import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./shared/context/AuthContext";

// Importe a árvore de rotas que o TanStack gera automaticamente
import { routeTree } from "./routeTree.gen";

// 1. Instanciamos o QueryClient (necessário para o seu root route)
const queryClient = new QueryClient();

// 2. Criamos o roteador passando a árvore de rotas e o contexto
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreloadStaleTime: 0,
});

// 3. Injetamos a tipagem do router para o TypeScript parar de reclamar nas Links
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <AuthProvider>
      {/* O QueryClient precisa abraçar o RouterProvider */}
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AuthProvider>
  );
}