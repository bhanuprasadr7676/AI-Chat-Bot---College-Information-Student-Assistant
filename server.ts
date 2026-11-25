import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IS_PROD = process.env.NODE_ENV === 'production';
const PORT = IS_PROD ? Number(process.env.PORT || 3000) : 3000;

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface AssistantRequestBody {
  message?: string;
  history?: ChatTurn[];
  campusContext?: Record<string, unknown>;
  studentContext?: Record<string, unknown> | null;
  systemSettings?: {
    institutionName?: string;
    academicYear?: string;
    currentSemester?: string;
    minAttendancePercent?: number;
    aiAssistantEnabled?: boolean;
    strictAcademicMode?: boolean;
    googleSearchRedirectBase?: string;
    supportEmail?: string;
    supportPhone?: string;
  };
}

function getSafeGoogleSearchUrl(base: string | undefined, query: string): string {
  const fallback = 'https://www.google.com/search?q=';
  let safeBase = fallback;
  if (typeof base === 'string' && base.startsWith('https://www.google.com/search')) {
    safeBase = base.includes('?q=') ? base : `${base}${base.includes('?') ? '&' : '?'}q=`;
  }
  return `${safeBase}${encodeURIComponent(query.trim())}`;
}

function buildSystemInstruction(body: AssistantRequestBody): string {
  const settings = body.systemSettings ?? {};
  const strictAcademic = settings.strictAcademicMode !== false;
  const institution = settings.institutionName || 'Crestwood Institute of Technology';
  const minAtt = settings.minAttendancePercent ?? 75;

  const contextPayload = JSON.stringify({
    institution,
    academicYear: settings.academicYear || '2026-2027',
    currentSemester: settings.currentSemester || 'Fall 2026',
    minAttendancePercent: minAtt,
    supportEmail: settings.supportEmail || 'helpdesk@crestwood.edu',
    supportPhone: settings.supportPhone || '+1 (555) 234-8910',
    studentProfileAndRecords: body.studentContext ?? 'Guest / Not signed in',
    campusResources: body.campusContext ?? {},
  });

  if (!strictAcademic) {
    return [
      `You are the real-time AI Student Assistant for ${institution}.`,
      `Your very first line MUST always be: INTENT: ACADEMIC`,
      `After that newline, answer the student's question clearly, concisely, and helpfully.`,
      `When answering college, schedule, attendance, fee, faculty, scholarship, placement, notice, or facility questions, ground your response accurately in the live campus data below. Format all monetary amounts using the Indian Rupee symbol (₹).`,
      `Live Campus Context JSON:\n${contextPayload}`,
    ].join('\n\n');
  }

  return [
    `You are the official real-time AI Student Assistant for ${institution}.`,
    `STRICT CLASSIFICATION & RESPONSE PROTOCOL:`,
    `On your VERY FIRST LINE (before any prose), you MUST output one of two exact directives followed by a newline:`,
    `1) If the user's question is about academic schedules, timetable, classes, exams, attendance, college timings, library/campus facilities, faculty details, notices, fees, scholarships, placements, student profile, study advice for their courses, or campus administration:`,
    `   Output: INTENT: ACADEMIC`,
    `   Then on the next line, answer accurately and concisely in plain, helpful prose using the Live Campus Context JSON below. Include exact course codes, times, room numbers, amounts (using the Indian Rupee symbol ₹), dates, or faculty names when available. If personal student data is missing because they are not signed in, let them know they can sign in with Google to view their personal attendance/fees.`,
    `2) If the user's question is NOT about college, academics, or campus resources (for example: general world news, weather, sports, movies, cooking recipes, celebrity trivia, travel, medical/legal advice, random internet trivia, or general non-academic topics):`,
    `   Output: INTENT: GENERAL | QUERY: <concise 2-6 word search query representing what the user asked>`,
    `   Then on the next line, write a polite 1-2 sentence response stating that you are dedicated exclusively to college information, academic schedules, and campus resources, and direct them to use the Google Search link below for general information.`,
    `Never skip the first-line INTENT directive. Keep responses crisp, accurate, and directly grounded in the campus data.`,
    `Live Campus Context JSON:\n${contextPayload}`,
  ].join('\n\n');
}

const MODEL_CANDIDATES: Array<{ model: string; thinkingLevel?: ThinkingLevel }> = [
  { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW },
  { model: 'gemini-3.1-flash-lite' },
];

const modelCooldownUntil = new Map<string, number>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s.`));
    }, ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function parseGeminiError(err: unknown): {
  code?: number;
  status?: string;
  isQuota: boolean;
  isTransient: boolean;
  isAuthError: boolean;
  retryDelay?: string;
  cleanMessage: string;
} {
  const raw = err instanceof Error ? err.message : String(err ?? 'Unknown error');
  let code: number | undefined;
  let status: string | undefined;
  let innerMessage = raw;
  let retryDelay: string | undefined;

  const tryExtract = (text: string) => {
    try {
      const parsed = JSON.parse(text) as {
        error?: {
          code?: number;
          status?: string;
          message?: string;
          details?: Array<{ retryDelay?: string }>;
        };
      };
      if (parsed?.error) {
        if (typeof parsed.error.code === 'number') code = parsed.error.code;
        if (typeof parsed.error.status === 'string') status = parsed.error.status;
        if (typeof parsed.error.message === 'string') {
          innerMessage = parsed.error.message;
          if (innerMessage.trim().startsWith('{')) {
            tryExtract(innerMessage);
          }
        }
        const retryObj = parsed.error.details?.find((d) => typeof d?.retryDelay === 'string');
        if (retryObj?.retryDelay) retryDelay = retryObj.retryDelay;
      }
    } catch {
      // ignore non-JSON
    }
  };

  tryExtract(raw);

  const lower = `${raw} ${innerMessage}`.toLowerCase();
  const isQuota =
    code === 429 ||
    status === 'RESOURCE_EXHAUSTED' ||
    lower.includes('resource_exhausted') ||
    lower.includes('quota exceeded') ||
    lower.includes('too many requests');
  const isTransient =
    code === 503 ||
    code === 502 ||
    code === 500 ||
    status === 'UNAVAILABLE' ||
    lower.includes('high demand') ||
    lower.includes('temporarily unavailable') ||
    lower.includes('timed out');
  const isAuthError =
    code === 401 ||
    code === 403 ||
    status === 'PERMISSION_DENIED' ||
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid');

  if (isQuota) {
    const retryHint = retryDelay ? ` Suggested retry wait: ${retryDelay}.` : '';
    return {
      code: 429,
      status: 'RESOURCE_EXHAUSTED',
      isQuota: true,
      isTransient: false,
      isAuthError: false,
      retryDelay,
      cleanMessage: `Gemini API rate or daily free-tier quota has been reached.${retryHint} To increase quota, attach a billing-enabled API key in Settings > Secrets.`,
    };
  }

  if (isTransient) {
    return {
      code: code ?? 503,
      status: status ?? 'UNAVAILABLE',
      isQuota: false,
      isTransient: true,
      isAuthError: false,
      cleanMessage:
        'The Gemini AI service is experiencing temporary high demand. Please click Retry Question in a moment.',
    };
  }

  if (isAuthError) {
    return {
      code: code ?? 403,
      status: status ?? 'PERMISSION_DENIED',
      isQuota: false,
      isTransient: false,
      isAuthError: true,
      cleanMessage:
        'Gemini API key is invalid or missing permissions. Please verify your key in Settings > Secrets.',
    };
  }

  return {
    code,
    status,
    isQuota: false,
    isTransient: false,
    isAuthError: false,
    cleanMessage:
      innerMessage.length > 260 ? `${innerMessage.slice(0, 260)}...` : innerMessage,
  };
}

function parseIntentLine(
  firstLine: string,
  fallbackUserMessage: string,
  redirectBase: string | undefined
): {
  scope: 'academic' | 'general';
  searchQuery?: string;
  searchUrl?: string;
  recognizedHeader: boolean;
} {
  const normalized = firstLine.replace(/^\*+|\*+$/g, '').trim();
  if (/^INTENT:\s*GENERAL/i.test(normalized)) {
    const queryMatch = normalized.match(/QUERY:\s*(.+)$/i);
    const searchQuery = queryMatch?.[1]?.trim() || fallbackUserMessage;
    const searchUrl = getSafeGoogleSearchUrl(redirectBase, searchQuery);
    return { scope: 'general', searchQuery, searchUrl, recognizedHeader: true };
  }
  if (/^INTENT:\s*ACADEMIC/i.test(normalized)) {
    return { scope: 'academic', recognizedHeader: true };
  }
  return { scope: 'academic', recognizedHeader: false };
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/api/assistant/chat', async (req: Request, res: Response) => {
    const body = (req.body || {}) as AssistantRequestBody;
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!message || message.length > 2000) {
      res.status(400).json({ error: 'Please provide a valid question (1 to 2000 characters).' });
      return;
    }

    if (body.systemSettings?.aiAssistantEnabled === false) {
      res.status(403).json({
        error:
          'The AI Student Assistant is currently disabled by campus administration in System Settings.',
      });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error: 'GEMINI_API_KEY is not configured. Please set it in Settings > Secrets.',
      });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    res.write(': stream-open\n\n');

    let clientClosed = false;
    res.on('close', () => {
      clientClosed = true;
    });

    const sendEvent = (payload: Record<string, unknown>) => {
      if (!clientClosed && !res.writableEnded) {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }
    };

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
      const conversationLines = history
        .filter(
          (h) =>
            h && typeof h.content === 'string' && (h.role === 'user' || h.role === 'assistant')
        )
        .map((h) => `${h.role === 'user' ? 'Student' : 'Assistant'}: ${h.content.slice(0, 800)}`)
        .join('\n');

      const prompt = conversationLines
        ? `Previous conversation:\n${conversationLines}\n\nCurrent Student Question: ${message}`
        : `Current Student Question: ${message}`;

      const systemInstruction = buildSystemInstruction(body);

      let activeIterator: AsyncIterator<{ text?: string }> | null = null;
      let firstPiece = '';
      let lastError: unknown = null;
      let sawQuota = false;

      const now = Date.now();
      const orderedCandidates = MODEL_CANDIDATES.filter(
        (c) => (modelCooldownUntil.get(c.model) ?? 0) <= now
      );
      if (orderedCandidates.length < MODEL_CANDIDATES.length) {
        sawQuota = true;
      }
      const candidatesToTry =
        orderedCandidates.length > 0 ? orderedCandidates : MODEL_CANDIDATES;

      for (const candidate of candidatesToTry) {
        const maxAttempts = 2;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          if (clientClosed) break;
          try {
            const stream = await withTimeout(
              ai.models.generateContentStream({
                model: candidate.model,
                contents: prompt,
                config: {
                  systemInstruction,
                  ...(candidate.thinkingLevel
                    ? { thinkingConfig: { thinkingLevel: candidate.thinkingLevel } }
                    : {}),
                },
              }),
              10000,
              `Model ${candidate.model}`
            );

            const iter = stream[Symbol.asyncIterator]();
            let buffered = '';
            while (true) {
              const step = await withTimeout(iter.next(), 10000, `Stream ${candidate.model}`);
              if (step.done) break;
              const piece = step.value?.text ?? '';
              if (piece) {
                buffered = piece;
                break;
              }
            }
            activeIterator = iter;
            firstPiece = buffered;
            modelCooldownUntil.delete(candidate.model);
            break;
          } catch (candidateErr) {
            lastError = candidateErr;
            const info = parseGeminiError(candidateErr);
            if (info.isQuota) {
              sawQuota = true;
              modelCooldownUntil.set(candidate.model, Date.now() + 5 * 60 * 1000);
              break;
            }
            if (info.isTransient && attempt < maxAttempts - 1) {
              await sleep(450);
              continue;
            }
            if (info.isTransient || info.code === 404) {
              break;
            }
            throw candidateErr;
          }
        }
        if (activeIterator || clientClosed) break;
      }

      if (!activeIterator) {
        if (sawQuota && lastError && parseGeminiError(lastError).isTransient) {
          throw new Error(
            'Daily free-tier Gemini quota was reached on the primary model and the fallback model is temporarily busy. Please click Retry Question in a moment, or attach a billing-enabled API key in Settings > Secrets.'
          );
        }
        throw lastError ?? new Error('Unable to reach AI Assistant model.');
      }

      let headerBuffer = firstPiece;
      let headerParsed = false;

      const processChunk = (piece: string) => {
        if (!piece) return;
        if (!headerParsed) {
          headerBuffer += piece;
          const trimmedStart = headerBuffer.replace(/^\n+/, '');
          const newlineIdx = trimmedStart.indexOf('\n');
          if (newlineIdx !== -1) {
            const firstLine = trimmedStart.slice(0, newlineIdx).trim();
            const remainder = trimmedStart.slice(newlineIdx + 1).replace(/^\n+/, '');
            headerParsed = true;

            const parsed = parseIntentLine(
              firstLine,
              message,
              body.systemSettings?.googleSearchRedirectBase
            );
            sendEvent({
              type: 'meta',
              scope: parsed.scope,
              ...(parsed.searchQuery ? { searchQuery: parsed.searchQuery } : {}),
              ...(parsed.searchUrl ? { searchUrl: parsed.searchUrl } : {}),
            });

            if (parsed.recognizedHeader) {
              if (remainder) sendEvent({ type: 'chunk', text: remainder });
            } else {
              sendEvent({ type: 'chunk', text: trimmedStart });
            }
          }
        } else {
          sendEvent({ type: 'chunk', text: piece });
        }
      };

      if (firstPiece) {
        headerBuffer = '';
        processChunk(firstPiece);
      }

      while (true) {
        const step = await activeIterator.next();
        if (step.done) break;
        const piece = step.value?.text ?? '';
        if (piece) processChunk(piece);
      }

      if (!headerParsed) {
        const trimmed = headerBuffer.trim();
        const parsed = parseIntentLine(
          trimmed,
          message,
          body.systemSettings?.googleSearchRedirectBase
        );
        if (parsed.recognizedHeader && parsed.scope === 'general') {
          sendEvent({
            type: 'meta',
            scope: 'general',
            searchQuery: parsed.searchQuery,
            searchUrl: parsed.searchUrl,
          });
          sendEvent({
            type: 'chunk',
            text: 'I am dedicated exclusively to college information, academic schedules, and campus resources. Please use the Google Search link below to explore general topics.',
          });
        } else {
          sendEvent({ type: 'meta', scope: 'academic' });
          const cleaned = trimmed.replace(/^(\*\*)?INTENT:\s*ACADEMIC(\*\*)?\s*/i, '');
          if (cleaned) {
            sendEvent({ type: 'chunk', text: cleaned });
          }
        }
      }

      sendEvent({ type: 'done' });
      res.end();
    } catch (err) {
      const info = parseGeminiError(err);
      sendEvent({ type: 'error', error: info.cleanMessage });
      res.end();
    }
  });

  app.all('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
