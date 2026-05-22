import { useCallback, useEffect, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useRatesStore, useSimulationStore, SimulationResult } from '../store';
import api from '../lib/api';

interface SimSyncPayload {
  corridor: string;
  amount_sent: string;
  currency_sent: string;
  adoro_fee: string;
  airtel_fee: string;
  total_to_send: string;
  amount_received: string;
  currency_received: string;
  rate: string;
}

// Backend pushes { date, source, rates: { XAF, XOF, MAD, USD, ... } }
interface RatesUpdatePayload {
  date?: string;
  source?: string;
  rates: Record<string, number>;
}

type WSMessage =
  | { type: 'sim:sync'; payload: SimSyncPayload }
  | { type: 'rates:update'; payload: RatesUpdatePayload }
  | { type: 'error'; payload: { code: string; detail: string } };

const CORRIDOR_CURRENCY: Record<string, string> = {
  FR_GA: 'XAF',
  GA_FR: 'XAF',
  FR_CM: 'XAF',
  CM_FR: 'XAF',
  FR_SN: 'XOF',
  SN_FR: 'XOF',
  FR_MA: 'MAD',
  MA_FR: 'MAD',
};

const AIRTEL_CORRIDORS = new Set(['FR_GA', 'GA_FR', 'FR_CM', 'CM_FR', 'FR_SN', 'SN_FR']);

const STATIC_RATES: Record<string, number> = {
  XAF: 655.957,
  XOF: 655.957,
  MAD: 10.9,
  USD: 1.09,
};

// Local fee grids — mirror seed_settings.py, used ONLY for the offline
// fallback display. The final stored values always come from the backend.
const EUR_TARIFFS: Array<[number, number | null, number]> = [
  [1, 50, 3],
  [51, 100, 5],
  [101, 200, 8],
  [201, 350, 10],
  [351, 500, 12],
  [501, 750, 15],
  [751, 1000, 18],
  [1001, null, 22],
];
const FCFA_TARIFFS: Array<[number, number | null, number]> = [
  [1000, 50000, 1000],
  [50001, 100000, 2000],
  [100001, 200000, 3000],
  [200001, 350000, 4500],
  [350001, 500000, 6000],
  [500001, 750000, 8000],
  [750001, 1000000, 10000],
  [1000001, null, 12000],
];
const MAD_TARIFFS: Array<[number, number | null, number]> = [
  [10, 500, 10],
  [501, 1000, 20],
  [1001, 2000, 35],
  [2001, 5000, 50],
  [5001, 10000, 80],
  [10001, null, 120],
];

function lookupFee(
  grid: Array<[number, number | null, number]>,
  amount: number
): number {
  for (const [min, max, fee] of grid) {
    if (amount >= min && (max === null || amount <= max)) return fee;
  }
  return 0;
}

let cachedRates: Record<string, number> | null = null;
let cacheTimer: ReturnType<typeof setTimeout> | null = null;

function setCachedRates(rates: Record<string, number>): void {
  cachedRates = rates;
  if (cacheTimer) clearTimeout(cacheTimer);
  cacheTimer = setTimeout(() => {
    cachedRates = null;
  }, 60_000);
}

async function fetchLatestRates(): Promise<Record<string, number>> {
  if (cachedRates) return cachedRates;
  try {
    const { data } = await api.get('/rates/latest/');
    if (data?.rates && typeof data.rates === 'object') {
      setCachedRates(data.rates);
      return data.rates;
    }
  } catch {
    // fallback
  }
  return STATIC_RATES;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function computeLocally(
  corridor: string,
  amount: number,
  includeAirtelFee: boolean,
  rates: Record<string, number>
): SimulationResult {
  const isEurSource = corridor.startsWith('FR_');
  const targetCurrency = CORRIDOR_CURRENCY[corridor] || 'XAF';
  const rate =
    Number(rates[targetCurrency]) ||
    STATIC_RATES[targetCurrency] ||
    655.957;

  const currencySent = isEurSource ? 'EUR' : targetCurrency;
  const currencyReceived = isEurSource ? targetCurrency : 'EUR';

  // Compute Adoro fee from the appropriate grid (matches the corridor's send currency)
  let adoroFee = 0;
  if (isEurSource) {
    adoroFee = lookupFee(EUR_TARIFFS, amount);
  } else if (targetCurrency === 'MAD') {
    adoroFee = lookupFee(MAD_TARIFFS, amount);
  } else {
    adoroFee = lookupFee(FCFA_TARIFFS, amount);
  }

  const amountReceived =
    rate > 0
      ? isEurSource
        ? round2(amount * rate)
        : round2(amount / rate)
      : 0;

  let airtelFeeTarget = 0;
  let airtelFeeSource = 0;
  if (includeAirtelFee && AIRTEL_CORRIDORS.has(corridor)) {
    const xafAmount = isEurSource ? amountReceived : amount;
    const calc = Math.min(round2(xafAmount * 0.03), 5000);
    if (isEurSource) {
      airtelFeeTarget = calc;
      airtelFeeSource = rate > 0 ? round2(calc / rate) : 0;
    } else {
      airtelFeeSource = calc;
      airtelFeeTarget = rate > 0 ? round2(calc / rate) : 0;
    }
  }

  const totalToSend = round2(amount + adoroFee + airtelFeeSource);

  return {
    corridor,
    amountSent: amount,
    currencySent,
    adoroFee,
    airtelFee: airtelFeeTarget,
    totalToSend,
    amountReceived,
    currencyReceived,
    rate,
  };
}

export function useSimulatorSocket() {
  const sessionId = useRef(crypto.randomUUID());
  const setResult = useSimulationStore((s) => s.setResult);
  const updateRate = useRatesStore((s) => s.updateRate);
  const pendingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = import.meta.env.VITE_WS_HOST || window.location.host;
  const socketUrl = `${wsProtocol}//${wsHost}/ws/simulator/${sessionId.current}/`;

  const { sendJsonMessage, readyState } = useWebSocket(socketUrl, {
    shouldReconnect: () => true,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
    onMessage: (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        if (msg.type === 'sim:sync') {
          if (pendingTimeout.current) {
            clearTimeout(pendingTimeout.current);
            pendingTimeout.current = null;
          }
          const p = msg.payload;
          setResult({
            corridor: p.corridor,
            amountSent: Number(p.amount_sent),
            currencySent: p.currency_sent,
            adoroFee: Number(p.adoro_fee),
            airtelFee: Number(p.airtel_fee),
            totalToSend: Number(p.total_to_send),
            amountReceived: Number(p.amount_received),
            currencyReceived: p.currency_received,
            rate: Number(p.rate),
          });
        } else if (msg.type === 'rates:update') {
          // Invalidate cache and store new rates so subsequent local
          // computes use the latest values broadcast by Celery.
          if (msg.payload?.rates && typeof msg.payload.rates === 'object') {
            const numericRates: Record<string, number> = {};
            for (const [k, v] of Object.entries(msg.payload.rates)) {
              const n = Number(v);
              if (!Number.isNaN(n)) numericRates[k] = n;
            }
            setCachedRates(numericRates);
            for (const [ccy, rate] of Object.entries(numericRates)) {
              updateRate(`EUR_${ccy}`, rate);
            }
          }
        }
      } catch {
        // ignore malformed messages
      }
    },
  });

  const sendSimulation = useCallback(
    (data: { corridor: string; amount: number; include_airtel_fee: boolean }) => {
      if (pendingTimeout.current) {
        clearTimeout(pendingTimeout.current);
        pendingTimeout.current = null;
      }

      if (readyState === ReadyState.OPEN) {
        sendJsonMessage({ type: 'sim:change', payload: data });

        // Si pas de reponse WS en 3s, calcul local correct (avec frais)
        pendingTimeout.current = setTimeout(async () => {
          const rates = await fetchLatestRates();
          setResult(
            computeLocally(data.corridor, data.amount, data.include_airtel_fee, rates)
          );
        }, 3000);
      } else {
        // WS non connecte: calcul local immediat
        (async () => {
          const rates = await fetchLatestRates();
          setResult(
            computeLocally(data.corridor, data.amount, data.include_airtel_fee, rates)
          );
        })();
      }
    },
    [sendJsonMessage, readyState, setResult]
  );

  const isConnected = readyState === ReadyState.OPEN;

  useEffect(() => {
    return () => {
      if (pendingTimeout.current) {
        clearTimeout(pendingTimeout.current);
      }
    };
  }, []);

  return { sendSimulation, isConnected, sessionId: sessionId.current };
}
