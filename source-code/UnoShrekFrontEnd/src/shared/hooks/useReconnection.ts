import { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";

const TIMEOUT_SECONDS = 60;

type ReconnectionState =
  | { status: "connected" }
  | { status: "reconnecting"; secondsLeft: number }
  | { status: "failed" };

/**
 * Tracks the socket connection state and exposes a countdown
 * matching the 60-second server-side inactivity timer.
 *
 * - "connected"     → tudo certo, não mostra nada
 * - "reconnecting"  → mostra banner com contador regressivo
 * - "failed"        → tempo esgotado, jogo encerrado pelo servidor
 */
export function useReconnection(): ReconnectionState {
  const { connected } = useSocket();
  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECONDS);
  const [failed, setFailed]           = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (connected) {
      // Reconectou — limpa tudo
      if (intervalRef.current) clearInterval(intervalRef.current);
      setSecondsLeft(TIMEOUT_SECONDS);
      setFailed(false);
      return;
    }

    // Desconectou — inicia contador regressivo
    setSecondsLeft(TIMEOUT_SECONDS);
    setFailed(false);

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setFailed(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [connected]);

  if (connected)  return { status: "connected" };
  if (failed)     return { status: "failed" };
  return { status: "reconnecting", secondsLeft };
}