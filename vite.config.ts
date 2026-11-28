import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const isTermux = Boolean(process.env.TERMUX_VERSION);
const GEMINI_MODEL = 'gemini-3.8-flash';
const requestBuckets = new Map<string, { startedAt: number; count: number }>();

function localGeminiProxy(): Plugin {
  let apiKey = '';

  return {
    name: 'salonquyen-local-gemini-aistudio-proxy',
    config(_, { mode }) {
      const env = loadEnv(mode, process.cwd(), '');
      apiKey = (env.GEMINI_API_KEY || env.GOOGLE_API_KEY || '').trim();
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '/', 'http://localhost');
        if (url.pathname !== '/__local-api/gemini' && url.pathname !== '/__local-api/gemini/status') {
          next();
          return;
        }

        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        const origin = req.headers.origin;
        let originHost = '';
        try { originHost = origin ? new URL(origin).hostname : ''; } catch { originHost = ''; }
        if (!['localhost', '127.0.0.1', '::1'].includes(originHost)) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'GEMINI_LOCAL_ORIGIN_ONLY' }));
          return;
        }

        if (url.pathname.endsWith('/status')) {
          if (req.method !== 'GET') { res.statusCode = 405; res.end(); return; }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ configured: Boolean(apiKey), model: GEMINI_MODEL, provider: 'Gemini Developer API' }));
          return;
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }));
          return;
        }
        if (!apiKey) {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'GEMINI_API_KEY_MISSING: thêm GEMINI_API_KEY vào .env.local rồi khởi động lại Vite.' }));
          return;
        }

        const remote = req.socket.remoteAddress || 'local';
        const now = Date.now();
        const bucket = requestBuckets.get(remote);
        if (!bucket || now - bucket.startedAt >= 60_000) requestBuckets.set(remote, { startedAt: now, count: 1 });
        else if (bucket.count >= 30) {
          res.statusCode = 429;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'GEMINI_LOCAL_RATE_LIMIT' }));
          return;
        } else bucket.count += 1;

        try {
          const chunks: Buffer[] = [];
          let size = 0;
          for await (const chunk of req) {
            const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            size += data.length;
            if (size > 16 * 1024) {
              res.statusCode = 413;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ error: 'GEMINI_REQUEST_TOO_LARGE' }));
              return;
            }
            chunks.push(data);
          }
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as { prompt?: unknown; temperature?: unknown; maxOutputTokens?: unknown };
          if (typeof body.prompt !== 'string' || !body.prompt.trim() || body.prompt.length > 12_000) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'GEMINI_INVALID_PROMPT' }));
            return;
          }
          const temperature = typeof body.temperature === 'number' ? Math.max(0, Math.min(1, body.temperature)) : 0.4;
          const maxOutputTokens = typeof body.maxOutputTokens === 'number' ? Math.max(256, Math.min(4096, Math.floor(body.maxOutputTokens))) : 2048;
          const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent?key=' + encodeURIComponent(apiKey), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: body.prompt }] }], generationConfig: { temperature, maxOutputTokens, thinkingConfig: { thinkingLevel: 'LOW' } } }),
            signal: AbortSignal.timeout(35_000),
          });
          const payload = await upstream.json().catch(() => null) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>; promptFeedback?: { blockReason?: string }; error?: { status?: string } } | null;
          if (!upstream.ok) {
            res.statusCode = upstream.status === 429 ? 429 : upstream.status === 400 ? 400 : 502;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            const code = upstream.status === 401 ? 'GEMINI_API_KEY_REJECTED' : upstream.status === 403 ? 'GEMINI_ACCESS_DENIED' : upstream.status === 404 ? 'GEMINI_MODEL_NOT_FOUND' : upstream.status === 429 ? 'GEMINI_QUOTA_OR_RATE_LIMIT' : upstream.status === 503 ? 'GEMINI_SERVICE_UNAVAILABLE' : upstream.status === 400 ? 'GEMINI_INVALID_REQUEST' : 'GEMINI_UPSTREAM_ERROR';
            res.end(JSON.stringify({ error: code }));
            return;
          }
          const text = payload?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim() || '';
          if (!text) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            const blockReason = payload?.promptFeedback?.blockReason;
            const finishReason = payload?.candidates?.[0]?.finishReason;
            const error = blockReason ? 'GEMINI_PROMPT_BLOCKED:' + blockReason : 'GEMINI_NO_TEXT:' + (finishReason || 'UNKNOWN');
            res.end(JSON.stringify({ error }));
            return;
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ text }));
        } catch (error) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: error instanceof Error && error.name === 'TimeoutError' ? 'GEMINI_TIMEOUT' : 'GEMINI_PROXY_FAILED' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    localGeminiProxy(),
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'Salon TÓC QUYỀN',
        short_name: 'TÓC QUYỀN',
        description: 'Ứng dụng quản lý salon dành cho chủ tiệm',
        lang: 'vi',
        theme_color: '#06352d',
        background_color: '#041f1b',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/pwa-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icons/pwa-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icons/pwa-maskable.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        mode: isTermux ? 'development' : 'production',
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
});
