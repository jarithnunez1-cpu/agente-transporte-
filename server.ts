import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { DEFAULT_BUSINESS_CONFIG, INITIAL_SAMPLE_LEADS } from './src/defaultConfig.ts';
import type { BusinessConfig, ChatMessage, ExtractedLeadData, Lead, LeadStatus } from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

interface StoreData {
  config: BusinessConfig;
  leads: Lead[];
}

function ensureStore(): StoreData {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    const initial: StoreData = {
      config: DEFAULT_BUSINESS_CONFIG,
      leads: INITIAL_SAMPLE_LEADS,
    };
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return {
      config: parsed.config ?? DEFAULT_BUSINESS_CONFIG,
      leads: Array.isArray(parsed.leads) ? parsed.leads : INITIAL_SAMPLE_LEADS,
    };
  } catch {
    const fallback: StoreData = {
      config: DEFAULT_BUSINESS_CONFIG,
      leads: INITIAL_SAMPLE_LEADS,
    };
    fs.writeFileSync(STORE_PATH, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
}

function writeStore(data: StoreData): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function buildSystemInstruction(config: BusinessConfig, currentLeadDraft?: Partial<ExtractedLeadData>): string {
  const servicesList = config.services
    .map((s, idx) => `${idx + 1}. ${s.name}: ${s.priceBs} (${s.unit}). Detalle: ${s.description}`)
    .join('\n');

  const faqsList = config.faqs
    .map((f, idx) => `${idx + 1}. P: ${f.question}\n   R: ${f.answer}`)
    .join('\n');

  const draftInfo = [
    currentLeadDraft?.nombre ? `Nombre ya conocido: ${currentLeadDraft.nombre}` : null,
    currentLeadDraft?.telefono ? `Teléfono ya conocido: ${currentLeadDraft.telefono}` : null,
    currentLeadDraft?.necesidad ? `Necesidad ya conocida: ${currentLeadDraft.necesidad}` : null,
  ]
    .filter(Boolean)
    .join(' | ');

  return `Eres ${config.agentName}, asistente virtual de atención al cliente de "${config.businessName}" (${config.industry}) en ${config.cityCountry}.

OBJETIVO DEL AGENTE:
${config.agentObjective}

PERSONALIDAD Y TONO:
- Habla en español boliviano, cercano, cordial y profesional (trato amable de "usted" o cordialidad natural de Santa Cruz de la Sierra, sin exagerar modismos).
- Respuestas cortas, directas y muy claras (máximo 2 a 4 oraciones o viñetas breves cuando des precios).
- Nunca inventes precios, rutas, promociones, horarios ni datos que NO aparezcan explícitamente en la BASE DE CONOCIMIENTO de abajo.
- Si el cliente consulta algo que NO está en la BASE DE CONOCIMIENTO (por ejemplo, un servicio fuera de lista, ruta especial, descuento o carga especial), dilo con total honestidad ("No cuento con ese dato exacto en este momento") y ofrece derivar la consulta a un asesor humano por WhatsApp (+${config.whatsappNumber}), marcando requiereHumano = true.

CAPTURA DE DATOS DEL CLIENTE (LEAD):
- Si aún faltan datos del cliente (nombre, teléfono o necesidad específica), pídelos de forma amable y natural al responder o cotizar.
- ${draftInfo || 'Aún no se han capturado datos de contacto en esta sesión.'}
- En el JSON de respuesta, llena extractedLead con los datos acumulados hasta ahora (combina lo ya conocido con lo nuevo que acaba de escribir el cliente). Si un campo sigue sin saberse, devuelve null.

BASE DE CONOCIMIENTO OFICIAL (ÚNICA FUENTE DE VERDAD):
- Empresa: ${config.businessName}
- Ubicación: ${config.address}
- Horarios de atención: ${config.hours}
- WhatsApp oficial de asesores humanos: +${config.whatsappNumber}

SERVICIOS Y PRECIOS EN BOLIVIANOS (Bs):
${servicesList}

PREGUNTAS FRECUENTES (FAQ):
${faqsList}`;
}

function getAiClient() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function generateWithRetry(
  params: Parameters<GoogleGenAI['models']['generateContent']>[0],
  maxRetries = 2
) {
  const ai = getAiClient();
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable = msg.includes('429') || msg.includes('503') || msg.includes('UNAVAILABLE');
      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 600 * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/config', (_req, res) => {
    const store = ensureStore();
    res.json(store.config);
  });

  app.put('/api/config', (req, res) => {
    const incoming = req.body as BusinessConfig;
    if (!incoming || !incoming.businessName || !Array.isArray(incoming.services)) {
      res.status(400).json({ error: 'Configuración inválida.' });
      return;
    }
    const store = ensureStore();
    store.config = incoming;
    writeStore(store);
    res.json(store.config);
  });

  app.get('/api/leads', (_req, res) => {
    const store = ensureStore();
    const sorted = [...store.leads].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    res.json(sorted);
  });

  app.post('/api/leads', (req, res) => {
    const body = req.body as {
      sessionId?: string;
      nombre?: string;
      telefono?: string;
      necesidad?: string;
      cotizacionEstimada?: string;
      status?: LeadStatus;
      lastMessageSnippet?: string;
    };

    const nombre = (body.nombre ?? '').trim();
    const telefono = (body.telefono ?? '').trim();
    const necesidad = (body.necesidad ?? '').trim();

    if (!nombre && !telefono) {
      res.status(400).json({ error: 'Ingrese al menos nombre o teléfono para registrar el lead.' });
      return;
    }

    const store = ensureStore();
    const now = new Date().toISOString();
    const existingIdx = body.sessionId
      ? store.leads.findIndex((l) => l.sessionId === body.sessionId)
      : -1;

    if (existingIdx >= 0) {
      const existing = store.leads[existingIdx];
      store.leads[existingIdx] = {
        ...existing,
        nombre: nombre || existing.nombre,
        telefono: telefono || existing.telefono,
        necesidad: necesidad || existing.necesidad,
        cotizacionEstimada: body.cotizacionEstimada ?? existing.cotizacionEstimada,
        status: body.status ?? existing.status,
        lastMessageSnippet: body.lastMessageSnippet ?? existing.lastMessageSnippet,
        updatedAt: now,
      };
      writeStore(store);
      res.json(store.leads[existingIdx]);
      return;
    }

    const newLead: Lead = {
      id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sessionId: body.sessionId || `manual-${Date.now()}`,
      nombre: nombre || 'Sin nombre',
      telefono: telefono || 'Sin teléfono',
      necesidad: necesidad || 'Consulta general',
      cotizacionEstimada: body.cotizacionEstimada || 'Por confirmar',
      status: body.status || 'Nuevo',
      createdAt: now,
      updatedAt: now,
      lastMessageSnippet: body.lastMessageSnippet || '',
    };

    store.leads.unshift(newLead);
    writeStore(store);
    res.status(201).json(newLead);
  });

  app.patch('/api/leads/:id', (req, res) => {
    const { id } = req.params;
    const body = req.body as Partial<Lead>;
    const store = ensureStore();
    const idx = store.leads.findIndex((l) => l.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Lead no encontrado.' });
      return;
    }
    store.leads[idx] = {
      ...store.leads[idx],
      ...body,
      id: store.leads[idx].id,
      updatedAt: new Date().toISOString(),
    };
    writeStore(store);
    res.json(store.leads[idx]);
  });

  app.delete('/api/leads/:id', (req, res) => {
    const { id } = req.params;
    const store = ensureStore();
    store.leads = store.leads.filter((l) => l.id !== id);
    writeStore(store);
    res.json({ ok: true });
  });

  app.post('/api/chat', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({
          error:
            'No se encontró GEMINI_API_KEY en el servidor. Configura la clave en Settings > Secrets para activar el agente.',
        });
        return;
      }

      const body = req.body as {
        sessionId?: string;
        message?: string;
        history?: ChatMessage[];
        currentLeadDraft?: Partial<ExtractedLeadData>;
      };

      const userMessage = (body.message ?? '').trim();
      if (!userMessage) {
        res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
        return;
      }

      const store = ensureStore();
      const systemInstruction = buildSystemInstruction(store.config, body.currentLeadDraft);

      const recentHistory = Array.isArray(body.history) ? body.history.slice(-14) : [];
      const contents = [
        ...recentHistory.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        {
          role: 'user',
          parts: [{ text: userMessage }],
        },
      ];

      const response = await generateWithRetry({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description:
                  'Respuesta breve, cordial y clara en español boliviano basada únicamente en la base de conocimiento.',
              },
              requiereHumano: {
                type: Type.BOOLEAN,
                description:
                  'true si el cliente pide hablar con un humano o pregunta algo que no está en la base de conocimiento.',
              },
              extractedLead: {
                type: Type.OBJECT,
                properties: {
                  nombre: { type: Type.STRING, nullable: true },
                  telefono: { type: Type.STRING, nullable: true },
                  necesidad: { type: Type.STRING, nullable: true },
                  cotizacionEstimada: { type: Type.STRING, nullable: true },
                },
                required: ['nombre', 'telefono', 'necesidad', 'cotizacionEstimada'],
              },
            },
            required: ['reply', 'requiereHumano', 'extractedLead'],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      let parsed: {
        reply: string;
        requiereHumano: boolean;
        extractedLead: ExtractedLeadData;
      };

      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = {
          reply: rawText || 'Disculpe, no pude procesar su consulta en este momento. ¿Desea hablar con un asesor por WhatsApp?',
          requiereHumano: true,
          extractedLead: {
            nombre: body.currentLeadDraft?.nombre ?? null,
            telefono: body.currentLeadDraft?.telefono ?? null,
            necesidad: body.currentLeadDraft?.necesidad ?? null,
            cotizacionEstimada: body.currentLeadDraft?.cotizacionEstimada ?? null,
          },
        };
      }

      const mergedLead: ExtractedLeadData = {
        nombre: parsed.extractedLead?.nombre || body.currentLeadDraft?.nombre || null,
        telefono: parsed.extractedLead?.telefono || body.currentLeadDraft?.telefono || null,
        necesidad: parsed.extractedLead?.necesidad || body.currentLeadDraft?.necesidad || null,
        cotizacionEstimada:
          parsed.extractedLead?.cotizacionEstimada || body.currentLeadDraft?.cotizacionEstimada || null,
      };

      let savedLead: Lead | null = null;
      if (body.sessionId && (mergedLead.nombre || mergedLead.telefono)) {
        const now = new Date().toISOString();
        const existingIdx = store.leads.findIndex((l) => l.sessionId === body.sessionId);
        if (existingIdx >= 0) {
          const prev = store.leads[existingIdx];
          store.leads[existingIdx] = {
            ...prev,
            nombre: mergedLead.nombre || prev.nombre,
            telefono: mergedLead.telefono || prev.telefono,
            necesidad: mergedLead.necesidad || prev.necesidad,
            cotizacionEstimada: mergedLead.cotizacionEstimada || prev.cotizacionEstimada,
            lastMessageSnippet: userMessage.slice(0, 140),
            updatedAt: now,
          };
          savedLead = store.leads[existingIdx];
        } else {
          const created: Lead = {
            id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            sessionId: body.sessionId,
            nombre: mergedLead.nombre || 'Cliente sin nombre',
            telefono: mergedLead.telefono || 'Pendiente',
            necesidad: mergedLead.necesidad || userMessage.slice(0, 100),
            cotizacionEstimada: mergedLead.cotizacionEstimada || 'Por confirmar',
            status: mergedLead.cotizacionEstimada ? 'Cotizado' : 'Nuevo',
            createdAt: now,
            updatedAt: now,
            lastMessageSnippet: userMessage.slice(0, 140),
          };
          store.leads.unshift(created);
          savedLead = created;
        }
        writeStore(store);
      }

      res.json({
        reply: parsed.reply,
        requiereHumano: Boolean(parsed.requiereHumano),
        extractedLead: mergedLead,
        savedLead,
      });
    } catch (err) {
      console.error('Error en /api/chat:', err);
      const message = err instanceof Error ? err.message : 'Error al consultar la API de Gemini.';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor activo en http://0.0.0.0:${port}`);
  });
}

startServer();
