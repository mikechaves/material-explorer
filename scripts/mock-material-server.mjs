import http from 'node:http';
import { URL } from 'node:url';

const PORT = Number.parseInt(process.env.PORT ?? '8787', 10);
const MAX_JSON_BYTES = 12 * 1024 * 1024;
const MAX_EVENTS = 1000;
const MAX_MATERIALS = 600;

const materialsByScope = new Map();
const telemetryEvents = [];

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Material-Scope',
  });
  res.end(body);
}

function getScope(url, headers) {
  const fromQuery = url.searchParams.get('scope')?.trim();
  if (fromQuery) return fromQuery;
  const fromHeader = headers['x-material-scope'];
  if (typeof fromHeader === 'string' && fromHeader.trim()) return fromHeader.trim();
  return 'default';
}

async function readRequestJson(req) {
  return await new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;

    req.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > MAX_JSON_BYTES) {
        reject(new Error('Request payload too large.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Invalid JSON.'));
      }
    });

    req.on('error', reject);
  });
}

function isRecord(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeIncomingMaterials(payload) {
  const maybeArray = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.materials)
      ? payload.materials
      : null;
  if (!maybeArray) return null;
  if (maybeArray.length > MAX_MATERIALS) return null;
  return maybeArray.filter((item) => isRecord(item));
}

function handleOptions(res) {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Material-Scope',
    'Access-Control-Max-Age': '86400',
  });
  res.end();
}

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.method) {
    sendJson(res, 400, { error: 'Malformed request.' });
    return;
  }

  if (req.method === 'OPTIONS') {
    handleOptions(res);
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const { pathname } = url;

  if (pathname === '/health' && req.method === 'GET') {
    sendJson(res, 200, { ok: true, materialsScopes: materialsByScope.size, events: telemetryEvents.length });
    return;
  }

  if (pathname === '/materials' && req.method === 'GET') {
    const scope = getScope(url, req.headers);
    const materials = materialsByScope.get(scope) ?? [];
    sendJson(res, 200, { version: 1, scope, materials, exportedAt: Date.now() });
    return;
  }

  if (pathname === '/materials' && req.method === 'PUT') {
    try {
      const payload = await readRequestJson(req);
      const materials = normalizeIncomingMaterials(payload);
      if (!materials) {
        sendJson(res, 400, {
          error: `Body must be { "materials": Material[] } with no more than ${MAX_MATERIALS} materials.`,
        });
        return;
      }
      const scope = getScope(url, req.headers);
      materialsByScope.set(scope, materials);
      sendJson(res, 200, { ok: true, scope, count: materials.length, updatedAt: Date.now() });
    } catch (error) {
      sendJson(res, 400, { error: error instanceof Error ? error.message : 'Invalid request body.' });
    }
    return;
  }

  if (pathname === '/events' && req.method === 'POST') {
    try {
      const payload = await readRequestJson(req);
      if (!isRecord(payload) || typeof payload.event !== 'string') {
        sendJson(res, 400, { error: 'Telemetry payload must include an "event" string.' });
        return;
      }
      telemetryEvents.unshift({
        ...payload,
        receivedAt: new Date().toISOString(),
      });
      if (telemetryEvents.length > MAX_EVENTS) {
        telemetryEvents.length = MAX_EVENTS;
      }
      sendJson(res, 202, { accepted: true });
    } catch (error) {
      sendJson(res, 400, { error: error instanceof Error ? error.message : 'Invalid request body.' });
    }
    return;
  }

  if (pathname === '/events' && req.method === 'GET') {
    sendJson(res, 200, { count: telemetryEvents.length, events: telemetryEvents });
    return;
  }

  sendJson(res, 404, { error: `No route for ${req.method} ${pathname}` });
});

server.listen(PORT, () => {
  console.log(`Mock Material API listening on http://localhost:${PORT}`);
  console.log('Routes: GET/PUT /materials, POST/GET /events, GET /health');
});
