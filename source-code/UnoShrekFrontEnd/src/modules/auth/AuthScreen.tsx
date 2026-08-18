import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { authService } from "./auth.service";
import { Field } from "../../shared/components/Field";
import { useGoogleLogin } from "@react-oauth/google";
import { GoogleIcon } from "../../shared/components/GoogleIcon";
import sideArt from "../../../assets/auth-side.png";
import logo from "../../../assets/logo-urro.png";
import { useAuth } from "../../shared/context/AuthContext";

type ApiError = {
  response?: { data?: { error?: string; message?: string } };
};

export function AuthScreen() {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    age: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSwitch = () => {
    setIsRegister((v) => !v);
    setError(null);
    setForm({ username: "", email: "", password: "", age: "" });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const age = Number(form.age);
        if (!age || age < 1 || age > 120) {
          setError("Informe uma idade válida.");
          return;
        }
        await authService.register(form.username, form.email, form.password, age);
        handleSwitch();
      } else {
        const data = await authService.login(form.username, form.password);
        setToken(data.access_token);
        navigate({ to: "/home" });
      }
    } catch (err) {
      const apiErr = err as ApiError;
      const message =
        apiErr.response?.data?.error ??
        apiErr.response?.data?.message ??
        "Algo deu errado. Tente novamente.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const data = await authService.googleAuth(tokenResponse.access_token);
        setToken(data.access_token);
        navigate({ to: "/home" });
      } catch (err) {
        const apiErr = err as ApiError;
        const message =
          apiErr.response?.data?.error ??
          apiErr.response?.data?.message ??
          "Falha ao autenticar com o Google";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Falha ao autenticar com o Google"),
    flow: "implicit",
  });

  return (
    <main className="grid min-h-screen grid-cols-1 bg-parchment md:grid-cols-2">
      <img
        src={sideArt}
        alt="Personagens do pântano reunidos no jogo URRO"
        className="hidden h-full w-full object-cover md:block"
      />

      <div className="relative flex items-center justify-center px-6 py-14 sm:px-12">
        <img
          src={logo}
          alt="Logo URRO"
          className="absolute top-5 right-6 w-16 rotate-[-12deg] sm:w-20"
        />

        <div className="w-full max-w-[360px]">
          <h1 className="font-display text-3xl text-ink">
            {isRegister ? "Criar conta" : "Entrar"}
          </h1>

          <button
            type="button"
            onClick={() => googleLogin()}
            className="mt-7 flex h-12 w-full items-center justify-center gap-3 rounded-full border border-ink/40 bg-white text-[15px] font-semibold text-ink transition hover:bg-ink/5"
          >
            <GoogleIcon className="h-5 w-5" />
            Continuar com o Google
          </button>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-ink/30" />
            <span className="text-xs font-semibold text-ink/70">OU</span>
            <div className="h-px flex-1 bg-ink/30" />
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-urro-red/40 bg-urro-red/10 px-4 py-3 text-sm font-medium text-urro-red">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              id="username"
              label={isRegister ? "Nome de usuário" : "Usuário"}
              value={form.username}
              onChange={set("username")}
              autoComplete="username"
              required
              disabled={loading}
            />

            {isRegister && (
              <>
                <Field
                  id="email"
                  label="E-mail"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  autoComplete="email"
                  required
                  disabled={loading}
                />
                <Field
                  id="age"
                  label="Idade"
                  type="number"
                  value={form.age}
                  onChange={set("age")}
                  required
                  disabled={loading}
                />
              </>
            )}

            <Field
              id="password"
              label="Sua senha"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={set("password")}
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
              disabled={loading}
              action={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="flex items-center gap-1 text-xs font-semibold text-ink/70 hover:text-ink"
                >
                  {showPassword ? <Eye size={14} /> : <EyeOff size={14} />}
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              }
              hint={
                isRegister ? (
                  <p className="text-xs font-medium text-ink/70">
                    Use 8 ou mais caracteres, com letras e números
                  </p>
                ) : (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-xs font-semibold text-ink underline"
                    >
                      Esqueceu sua senha?
                    </button>
                  </div>
                )
              }
            />

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-full bg-shrek text-[15px] font-bold text-white transition hover:brightness-105 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : isRegister ? (
                "Criar conta"
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <p className="mt-4 text-sm text-ink/80">
            {isRegister ? "Já tem uma conta? " : "Não tem uma conta? "}
            <button
              type="button"
              onClick={handleSwitch}
              className="font-bold text-ink underline"
            >
              {isRegister ? "Entrar" : "Cadastre-se"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}