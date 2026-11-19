import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { resolveBackendConfig } from './src/lib/backend-config.ts'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const { proxyTarget } = resolveBackendConfig(env.VITE_API_BASE_URL)
  if (!proxyTarget) {
    throw new Error(
      'Set VITE_API_BASE_URL in .env.local or your hosting environment (see .env.example)',
    )
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': { target: proxyTarget, changeOrigin: true },
        '/socket.io': {
          target: proxyTarget,
          changeOrigin: true,
          ws: true,
          configure: (proxy) => {
            proxy.on('error', (err: any) => {
              if (err.code === 'ECONNABORTED' || err.code === 'ECONNRESET') {
                return;
              }
              console.error('[vite] ws proxy error:', err);
            });
            proxy.on('proxyReqWs', (_proxyReq, _req, socket) => {
              socket.on('error', (err: any) => {
                if (err.code === 'ECONNABORTED' || err.code === 'ECONNRESET') {
                  return;
                }
                console.error('[vite] ws proxy socket error:', err);
              });
            });
          },
        },
      },
    },
  }
})
