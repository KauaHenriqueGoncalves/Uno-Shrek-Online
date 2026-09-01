import { Navigate } from "@tanstack/react-router";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Carregando...
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}