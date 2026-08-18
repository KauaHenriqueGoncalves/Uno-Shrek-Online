import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "../shared/context/AuthContext";
import { SocketProvider } from "../shared/context/SocketContext";
import { useAuth } from "../shared/context/AuthContext";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-ink">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-ink">Página não encontrada</h2>
        <p className="mt-2 text-sm text-ink/70">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-shrek px-6 py-2 text-sm font-bold text-white transition hover:brightness-105"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl text-ink">Algo deu errado</h1>
        <p className="mt-2 text-sm text-ink/70">
          Ocorreu um erro inesperado. Tente recarregar a página.
        </p>
        <div className="mt-6">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-full bg-shrek px-6 py-2 text-sm font-bold text-white transition hover:brightness-105"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "URRO — Jogo de cartas multiplayer" },
      {
        name: "description",
        content: "Entre no pântano e jogue URRO, o jogo de cartas multiplayer mais brincalhão.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Titan+One&family=Nunito:wght@400;600;700;800&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function SocketWrapper({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return <SocketProvider token={token}>{children}</SocketProvider>;
}


function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocketWrapper>
            <Outlet />
          </SocketWrapper>
        </AuthProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}