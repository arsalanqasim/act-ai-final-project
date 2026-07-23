import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import aiHandler from './api/ai';

function apiDevMiddleware(): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/ai' || req.url?.startsWith('/api/ai?')) {
          try {
            await aiHandler(req, res);
          } catch (e) {
            console.error('Dev Server API Error:', e);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: 'Internal Dev API Server Error' }));
            }
          }
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), apiDevMiddleware()],
  server: {
    port: 5173,
    host: true
  }
});
