import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      TanStackRouterVite({
        routesDirectory: './src/router',
      }),
      react(),
      tailwindcss(),
    ],

    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: ['tartness-sixfold-return.ngrok-free.dev'], // caso necessário, troque o host! OBS: caso já tenha subido o container, apague a imagem!

      proxy: {
        [env.VITE_API_PREFIX]: {
          target: env.VITE_BACKEND_URL,
          changeOrigin: true,
        },

        [env.VITE_SOCKET_PREFIX]: {
          target: env.VITE_BACKEND_URL,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  }
})