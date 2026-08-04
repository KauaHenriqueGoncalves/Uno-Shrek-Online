import AppRouter from "./router/AppRouter.jsx";
import { AuthProvider } from "./shared/context/AuthContext.jsx";

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}