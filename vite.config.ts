import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { PALETTES } from './src/constants';
import { Season } from './src/types';

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
                if (!process.env.GEMINI_API_KEY) {
                  return sendJson(res, 500, { error: 'Missing GEMINI_API_KEY environment variable.' });
                }
                const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                const response = await ai.models.generateContent({
                  model: 'gemini-3-flash-preview',
                  contents: [
                    {
                      parts: [
                        {
                          text: `Analyze this person's physical characteristics (skin undertone, hair color, eye color, and overall contrast) to determine their best Color Season among the 12-season color analysis theory.
                          
                          Return the result in JSON format with the following fields:
                          - season: One of [${Object.values(Season).map(s => `"${s}"`).join(', ')}]
                          - hue: "Warm", "Cool", or "Neutral"
                          - value: "Light", "Deep", or "Medium"
                          - chroma: "Bright", "Muted", or "Clear"
                          - confidence: A number between 0 and 1
                          - reasoning: A brief 1-sentence explanation of the findings.
                          
                          Focus on the scientific attributes of the facial features.`,
                        },
                        {
                          inlineData: {
                            mimeType: 'image/jpeg',
                            data: body.image64.split(',')[1] || body.image64,
                          },
                        },
                      ],
                    },
                  ],
                  config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                        season: { type: Type.STRING },
                        hue: { type: Type.STRING },
                        value: { type: Type.STRING },
                        chroma: { type: Type.STRING },
                        confidence: { type: Type.NUMBER },
                        reasoning: { type: Type.STRING },
                      },
                      required: ['season', 'hue', 'value', 'chroma', 'confidence', 'reasoning'],
                    },
                  },
                });
                const result = JSON.parse(response.text);
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
                if (!process.env.GEMINI_API_KEY) {
                  return sendJson(res, 500, { error: 'Missing GEMINI_API_KEY environment variable.' });
                }
                const palette = PALETTES[body.season as Season];
                const colorList = palette.colors.map((color) => color.name).join(', ');
                const prompt = `A professional, high-quality full-body portrait synthesis of the person in the provided image. 
                They are wearing a stylish ${body.style} outfit that perfectly matches their ${body.season} color palette.
                The clothing should feature colors like: ${colorList}.
                The setting is a modern, high-end professional environment.
                The image should look like a professional studio portrait with soft lighting.
                Maintain the facial features and identity of the person from the original image.
                The overall aesthetic should be polished, expensive, and sophisticated.`;
                const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                const response = await ai.models.generateContent({
                  model: 'gemini-2.5-flash-image',
                  contents: [
                    {
                      parts: [
                        { text: prompt },
                        {
                          inlineData: {
                            mimeType: 'image/jpeg',
                            data: body.image64.split(',')[1] || body.image64,
                          },
                        },
                      ],
                    },
                  ],
                });
                let image = '';
                for (const part of response.candidates?.[0]?.content?.parts || []) {
                  if (part.inlineData?.data) {
                    image = `data:image/png;base64,${part.inlineData.data}`;
                    break;
                  }
                }
                if (!image) {
                  return sendJson(res, 500, { error: 'Image generation failed' });
                }
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
