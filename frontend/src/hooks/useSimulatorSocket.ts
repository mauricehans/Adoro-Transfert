import { useCallback, useEffect, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useRatesStore, useSimulationStore } from '../store';

interface SimSyncPayload {
  corridor: string;
  amount_sent: number;
  currency_sent: string;
  adoro_fee: number;
  airtel_fee: number;
  total_to_send: number;
  amount_received: number;
  currency_received: string;
  rate: number;
}

interface RatesUpdatePayload {
  pair: string;
  rate: number;
  source: string;
}

type WSMessage =
  | { type: 'sim:sync'; payload: SimSyncPayload }
  | { type: 'rates:update'; payload: RatesUpdatePayload };

export function useSimulatorSocket() {
  const sessionId = useRef(crypto.randomUUID());
  const setResult = useSimulationStore((s) => s.setResult);
  const updateRate = useRatesStore((s) => s.updateRate);

  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = import.meta.env.VITE_WS_HOST || window.location.host;
  const socketUrl = `${wsProtocol}//${wsHost}/ws/simulate/${sessionId.current}/`;

  const { sendJsonMessage, readyState } = useWebSocket(socketUrl, {
    shouldReconnect: () => true,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
    onMessage: (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        if (msg.type === 'sim:sync') {
          const p = msg.payload;
          setResult({
            corridor: p.corridor,
            amountSent: p.amount_sent,
            currencySent: p.currency_sent,
            adoroFee: p.adoro_fee,
            airtelFee: p.airtel_fee,
            totalToSend: p.total_to_send,
            amountReceived: p.amount_received,
            currencyReceived: p.currency_received,
            rate: p.rate,
          });
        } else if (msg.type === 'rates:update') {
          updateRate(msg.payload.pair, msg.payload.rate);
        }
      } catch {
        // ignore malformed messages
      }
    },
  });

  const sendSimulation = useCallback(
    (data: { corridor: string; amount: number; include_airtel_fee: boolean }) => {
      if (readyState === ReadyState.OPEN) {
        sendJsonMessage({ type: 'sim:calculate', payload: data });
      }
    },
    [sendJsonMessage, readyState]
  );

  const isConnected = readyState === ReadyState.OPEN;

  useEffect(() => {
    return () => {
      // cleanup handled by react-use-websocket
    };
  }, []);

  return { sendSimulation, isConnected, sessionId: sessionId.current };
}
