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

interface RatesUpdatePayload {
  pair: string;
  rate: number;
  source: string;
}

type WSMessage =
  | { type: 'sim:sync'; payload: SimSyncPayload }
  | { type: 'rates:update'; payload: RatesUpdatePayload };

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
};

let cachedRates: Record<string, number> | null = null;

async function fetchLatestRates(): Promise<Record<string, number>> {
  if (cachedRates) return cachedRates;
  try {
    const { data } = await api.get('/rates/latest/');
    if (data?.rates) {
      cachedRates = data.rates;
      setTimeout(() => { cachedRates = null; }, 60000);
      return data.rates;
    }
  } catch {
    // fallback
  }
  return STATIC_RATES;
}

function computeLocally(
  corridor: string,
  amount: number,
  includeAirtelFee: boolean,
  rates: Record<string, number>
): SimulationResult {
  const isEurSource = corridor.startsWith('FR_');
  const targetCurrency = CORRIDOR_CURRENCY[corridor] || 'XAF';
  const rate = rates[targetCurrency] || STATIC_RATES[targetCurrency] || 655.957;
  const currencySent = isEurSource ? 'EUR' : targetCurrency;
  const currencyReceived = isEurSource ? targetCurrency : 'EUR';

  const amountReceived = isEurSource
    ? Math.round(amount * rate * 100) / 100
    : rate > 0 ? Math.round((amount / rate) * 100) / 100 : 0;

  let airtelFee = 0;
  if (includeAirtelFee && AIRTEL_CORRIDORS.has(corridor)) {
    const localAmount = isEurSource ? amountReceived : amount;
    airtelFee = Math.min(Math.round(localAmount * 0.03 * 100) / 100, 5000);
  }

  return {
    corridor,
    amountSent: amount,
    currencySent,
    adoroFee: 0,
    airtelFee,
    totalToSend: amount,
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
          cachedRates = null;
          updateRate(msg.payload.pair, msg.payload.rate);
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

        // Fallback: si pas de reponse WebSocket en 3s, calcul local avec taux BDD
        pendingTimeout.current = setTimeout(async () => {
          const rates = await fetchLatestRates();
          const result = computeLocally(
            data.corridor,
            data.amount,
            data.include_airtel_fee,
            rates
          );
          setResult(result);
        }, 3000);
      } else {
        // WebSocket pas connecte: calcul local immediat avec taux BDD
        (async () => {
          const rates = await fetchLatestRates();
          const result = computeLocally(
            data.corridor,
            data.amount,
            data.include_airtel_fee,
            rates
          );
          setResult(result);
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
