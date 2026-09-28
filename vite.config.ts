import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Dev-only: serves /api/* from the same handler Vercel runs (src/server/handler.ts),
 * so `npm run dev` has a real backend instead of a 404. Production is untouched —
 * on Vercel, /api/index.ts wraps the same handler as a single serverless function.
 */
function apiDevServer(mode: string): Plugin {
  return {
    name: 'api-dev-server',
    apply: 'serve',
    configureServer(server) {
      // Server-side code reads process.env (MONGODB_URI, JWT_SECRET, SMTP_*, ...).
      // Vite only exposes VITE_* to the browser, so load the rest into process.env here.
      const all = loadEnv(mode, process.cwd(), '')
      for (const [k, v] of Object.entries(all)) if (process.env[k] === undefined) process.env[k] = v

      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''
        if (!url.startsWith('/api/') && url !== '/api') return next()
        try {
          // Read + parse the JSON body (Vercel does this for you in production).
          const chunks: Buffer[] = []
          for await (const c of req) chunks.push(c as Buffer)
          const raw = Buffer.concat(chunks).toString('utf8')
          let body: unknown = undefined
          if (raw) { try { body = JSON.parse(raw) } catch { body = raw } }

          const r = req as any
          r.body = body
          r.query = Object.fromEntries(new URL(url, 'http://localhost').searchParams)

          // Vercel-style response helpers used by the handler.
          const s = res as any
          s.status = (code: number) => { res.statusCode = code; return s }
          s.json = (data: unknown) => {
            if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(data))
            return s
          }

          const mod = await server.ssrLoadModule('/src/server/handler.ts')
          await (mod.default as (q: unknown, s: unknown) => Promise<unknown>)(req, res)
        } catch (e: any) {
          server.config.logger.error(`[api] ${e?.stack || e}`)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ success: false, error: { code: 'SERVER_ERROR', message: 'API error — see the terminal running `npm run dev`.' } }))
          }
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins = [react(), tailwindcss(), apiDevServer(mode)];
  try {
    // @ts-ignore
    const m = await import('./.vite-source-tags.js');
    plugins.push(m.sourceTags());
  } catch {}

  const env = loadEnv(mode, process.cwd(), ['VITE_', 'NEXT_PUBLIC_']);
  const processEnvDefines: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    processEnvDefines[`process.env.${key}`] = JSON.stringify(value);
  }

  return {
    plugins,
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: processEnvDefines,
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'motion': ['framer-motion'],
            'admin': ['./src/pages/AdminDashboard.tsx', './src/pages/AdminRequests.tsx', './src/pages/AdminRequestDetail.tsx', './src/components/AdminLayout.tsx'],
          }
        }
      }
    }
  };
})
