import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";

type SocketContextType = {
  socket: Socket | null;
  connected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
});

export function SocketProvider({
  token,
  children,
}: {
  token: string | null;
  children: React.ReactNode;
}) {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setConnected(false);
      return;
    }

    // Em dev, o socket conecta na mesma origem (sem host) e usa
    // o prefixo customizado, que é redirecionado pelo proxy do Vite
    // até a API. Em prod, não há proxy: conecta direto na URL do
    // backend, sem prefixo (usa o path padrão do socket.io).
    const isProd = import.meta.env.VITE_PROFILE === "prod";

    const socketUrl = isProd ? import.meta.env.VITE_BACKEND_URL : undefined;
    const socketPath = isProd ? import.meta.env.VITE_SOCKET_PREFIX : undefined;

    const socketInstance = io({
      path: socketPath,
      auth: { token },
      query: { accesstoken: token },
      extraHeaders: { accesstoken: token },
      autoConnect: true,
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      setConnected(true);
    });

    socketInstance.on("disconnect", () => {
      setConnected(false);
    });

    return () => {
      socketInstance.disconnect();
      if (socketRef.current === socketInstance) {
        socketRef.current = null;
      }
      setSocket(null);
      setConnected(false);
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}