import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Content-Security-Policy for the web origin (dev server and `vite preview`). helmet in the API
// only covers API responses, so the document that runs the app needs its own header.
// CSP_ENABLED=true turns it on; CSP_REPORT_ONLY=true sends the report-only header instead.
function cspPlugin(mode: string): Plugin {
  const env = loadEnv(mode, fileURLToPath(new URL('../..', import.meta.url)), '');
  const enabled = env.CSP_ENABLED === 'true';
  const headerName =
    env.CSP_REPORT_ONLY === 'true'
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy';
  const apiUrl = (env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const apiWs = apiUrl.replace(/^http/, 'ws');

  const build = (dev: boolean): string =>
    [
      `default-src 'self'`,
      // The dev server injects an inline React Refresh preamble; the built app has none.
      `script-src 'self'${dev ? " 'unsafe-inline'" : ''}`,
      // Vite dev injects <style> tags; the build emits external CSS only.
      `style-src 'self'${dev ? " 'unsafe-inline'" : ''}`,
      `img-src 'self' data:`,
      // `ws://localhost:*` is the Vite HMR socket.
      `connect-src 'self' ${apiUrl} ${apiWs}${dev ? ' ws://localhost:*' : ''}`,
      `frame-src 'self'`,
      `frame-ancestors 'self'`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `report-uri ${apiUrl}/api/csp-report`,
    ].join('; ');

  return {
    name: 'helpdesk-csp',
    config() {
      if (!enabled) return;
      // `server.headers` is the dev server policy (relaxed); `preview.headers` is the strict one.
      return {
        server: { headers: { [headerName]: build(true) } },
        preview: { headers: { [headerName]: build(false) } },
      };
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), cspPlugin(mode)],
  server: {
    port: 5173,
    strictPort: true,
    // File-change events do not cross the Windows bind mount in Docker.
    watch: process.env.CHOKIDAR_USEPOLLING === 'true' ? { usePolling: true } : undefined,
  },
}));
