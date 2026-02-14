export type TelemetryLevel = 'info' | 'warn' | 'error';

export type TelemetryPayload = {
  app: 'material-explorer';
  level: TelemetryLevel;
  event: string;
  timestamp: string;
  data?: Record<string, unknown>;
};

export const TELEMETRY_DEBUG_EVENT = 'material-explorer:telemetry';

const TELEMETRY_ENDPOINT = (() => {
  const raw = import.meta.env.VITE_TELEMETRY_URL as string | undefined;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : null;
})();

let globalTelemetryInitialized = false;

function hasTelemetryTransport() {
  return !!TELEMETRY_ENDPOINT;
}

function buildPayload(event: string, level: TelemetryLevel, data?: Record<string, unknown>): TelemetryPayload {
  return {
    app: 'material-explorer',
    level,
    event,
    timestamp: new Date().toISOString(),
    ...(data ? { data } : {}),
  };
}

async function postTelemetry(payload: TelemetryPayload) {
  if (!TELEMETRY_ENDPOINT) return false;

  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function' && typeof Blob !== 'undefined') {
      const sent = navigator.sendBeacon(TELEMETRY_ENDPOINT, new Blob([body], { type: 'application/json' }));
      if (sent) return true;
    }

    if (typeof fetch === 'function') {
      await fetch(TELEMETRY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      });
      return true;
    }
  } catch {
    // Telemetry is best effort; never throw to user-facing flows.
  }

  return false;
}

function publishTelemetryDebugEvent(payload: TelemetryPayload) {
  if (!import.meta.env.DEV) return;
  if (typeof window === 'undefined' || typeof CustomEvent === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<TelemetryPayload>(TELEMETRY_DEBUG_EVENT, {
      detail: payload,
    })
  );
}

export function emitTelemetryEvent(event: string, data?: Record<string, unknown>, level: TelemetryLevel = 'info') {
  const payload = buildPayload(event, level, data);
  publishTelemetryDebugEvent(payload);
  if (!hasTelemetryTransport()) return;
  void postTelemetry(payload);
}

export function initGlobalTelemetryListeners() {
  if (globalTelemetryInitialized || typeof window === 'undefined') return;
  globalTelemetryInitialized = true;

  window.addEventListener('error', (event) => {
    emitTelemetryEvent(
      'window.error',
      {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
      'error'
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason =
      event.reason instanceof Error
        ? {
            name: event.reason.name,
            message: event.reason.message,
            stack: event.reason.stack,
          }
        : { reason: String(event.reason) };
    emitTelemetryEvent('window.unhandledrejection', reason, 'error');
  });
}
