import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api.js";

type Player = {
  id: string;
  username: string;
  email: string;
  age: number;
  picture?: string;
};

type AuthContextType = {
  user: Player | null;
  token: string | null;
  loading: boolean;
  setToken: (token: string) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Player | null>(null);
  const [token, setTokenState] = useState<string | null>(
    () => sessionStorage.getItem("accessToken"),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/api/players/me")
      .then((res) => setUser(res.data))
      .catch(() => {
        setUser(null);
        setTokenState(null);
        sessionStorage.removeItem("accessToken");
      })
      .finally(() => setLoading(false));
  }, [token]);

  function setToken(newToken: string) {
    sessionStorage.setItem("accessToken", newToken);
    setTokenState(newToken);
  }

  async function logout() {
    await api.post("/api/auth/logout");
    setUser(null);
    setTokenState(null);
    sessionStorage.removeItem("accessToken");
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}