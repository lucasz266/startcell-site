import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT) || 3000;
const BUSINESS_WHATSAPP = process.env.BUSINESS_WHATSAPP || '5566999858520';
const MAX_BODY = 12_000;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 12;
const requestLog = new Map();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

function send(res, status, data, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    ...headers
  });
  res.end(JSON.stringify(data));
}

function getClientKey(req) {
  // Não confie em X-Forwarded-For sem proxy configurado por você.
  return req.socket.remoteAddress || 'unknown';
}

function isRateLimited(key) {
  const now = Date.now();
  const entry = requestLog.get(key);
  if (!entry || now - entry.startedAt > WINDOW_MS) {
    requestLog.set(key, { startedAt: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REQUESTS;
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_BODY) throw new Error('BODY_TOO_LARGE');
  }
  try {
    return JSON.parse(raw || '{}');
  } catch {
    throw new Error('INVALID_JSON');
  }
}

function clean(value, maxLength) {
  return String(value ?? '').replace(/[<>\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLength);
}

async function serveStatic(req, res) {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const requested = pathname === '/' ? '/index.html' : pathname;
  const normalized = path.normalize(requested).replace(/^([.][.][/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, normalized);
  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  try {
    const body = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Página não encontrada.');
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/api/health') {
    return send(res, 200, { ok: true, service: 'StartCell site API' });
  }

  if (req.method === 'POST' && req.url === '/api/contact') {
    if (isRateLimited(getClientKey(req))) {
      return send(res, 429, { ok: false, message: 'Muitas tentativas. Tente novamente mais tarde.' });
    }
    try {
      const body = await readJson(req);
      // Campo invisível para reduzir envios automatizados. Se preenchido, encerra sem revelar o motivo.
      if (clean(body.website, 120)) return send(res, 200, { ok: true });

      const name = clean(body.name, 80);
      const phone = clean(body.phone, 24);
      const subject = clean(body.subject, 80);
      const message = clean(body.message, 700);
      if (name.length < 2 || phone.replace(/\D/g, '').length < 10 || !subject || message.length < 5) {
        return send(res, 400, { ok: false, message: 'Confira os campos e tente novamente.' });
      }

      const text = [
        'Olá! Vim pelo site da StartCell.',
        `Nome: ${name}`,
        `Meu telefone: ${phone}`,
        `Assunto: ${subject}`,
        `Mensagem: ${message}`
      ].join('\n');
      const whatsappUrl = `https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(text)}`;
      return send(res, 200, { ok: true, whatsappUrl });
    } catch (error) {
      const status = error.message === 'BODY_TOO_LARGE' ? 413 : 400;
      return send(res, status, { ok: false, message: 'Não foi possível processar o formulário. Tente novamente.' });
    }
  }

  if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res);
  res.writeHead(405, { Allow: 'GET, HEAD, POST' });
  res.end('Method not allowed');
});

server.listen(PORT, () => {
  console.log(`StartCell site disponível em http://localhost:${PORT}`);
});
