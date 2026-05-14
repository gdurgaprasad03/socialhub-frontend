import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || 'https://pseudopregnant-fatless-ila.ngrok-free.dev/api';
  // Strip trailing /api to get the host (e.g. https://xxxx.ngrok-free.app)
  const backendHost = apiUrl.replace(/\/api\/?$/, '');

  const proxyBase = {
    target: backendHost,
    changeOrigin: true,
    secure: false,
    headers: { 'ngrok-skip-browser-warning': 'true' },
  };

  return {
    server: {
      host: '::',
      port: 8080,
      hmr: { overlay: false },
      proxy: {
        '/api': proxyBase,
        '/media': proxyBase,
      },
    },
    plugins: [react(), mode === 'development' && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
