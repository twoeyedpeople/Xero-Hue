import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { analyzePaletteFromImage, generateImageFromPalette } from './api/_lib/geminiApi';

async function readJsonBody(req: NodeJS.ReadableStream) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res: any, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  process.env.GEMINI_API_KEY ??= env.GEMINI_API_KEY;

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'local-gemini-api',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const url = req.url?.split('?')[0];
            if (req.method !== 'POST' || !url?.startsWith('/api/')) {
              return next();
            }

            try {
              const body = await readJsonBody(req);

              if (url === '/api/analyze-palette') {
                if (typeof body.image64 !== 'string' || !body.image64) {
                  return sendJson(res, 400, { error: 'Missing image64 payload.' });
                }
                const result = await analyzePaletteFromImage(body.image64);
                return sendJson(res, 200, result);
              }

              if (url === '/api/generate-image') {
                if (typeof body.image64 !== 'string' || !body.image64) {
                  return sendJson(res, 400, { error: 'Missing image64 payload.' });
                }
                if (typeof body.season !== 'string' || !body.season) {
                  return sendJson(res, 400, { error: 'Missing season.' });
                }
                if (typeof body.style !== 'string' || !body.style) {
                  return sendJson(res, 400, { error: 'Missing style.' });
                }
                const image = await generateImageFromPalette(body.image64, body.season as any, body.style as any);
                return sendJson(res, 200, { image });
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Request failed.';
              return sendJson(res, 500, { error: message });
            }

            return next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
