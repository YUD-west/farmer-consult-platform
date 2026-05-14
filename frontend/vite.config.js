import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_API_URL || 'http://localhost:3000'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': { target, changeOrigin: true },
        '/health': { target, changeOrigin: true },
        '/market-data': { target, changeOrigin: true },
        '/dashboard-stats': { target, changeOrigin: true },
        '/ask': { target, changeOrigin: true },
        '/ask-question': { target, changeOrigin: true },
      },
    },
  }
})
