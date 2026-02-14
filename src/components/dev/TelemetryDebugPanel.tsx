import React from 'react';
import { TELEMETRY_DEBUG_EVENT, type TelemetryPayload } from '../../utils/telemetry';

const MAX_VISIBLE_EVENTS = 30;

const levelClass: Record<TelemetryPayload['level'], string> = {
  info: 'text-cyan-200 border-cyan-200/35',
  warn: 'text-amber-200 border-amber-200/35',
  error: 'text-rose-200 border-rose-200/35',
};

export default function TelemetryDebugPanel() {
  const [open, setOpen] = React.useState(false);
  const [events, setEvents] = React.useState<TelemetryPayload[]>([]);

  React.useEffect(() => {
    const onTelemetryEvent = (event: Event) => {
      const payload = (event as CustomEvent<TelemetryPayload>).detail;
      if (!payload) return;
      setEvents((previous) => [payload, ...previous].slice(0, MAX_VISIBLE_EVENTS));
    };

    window.addEventListener(TELEMETRY_DEBUG_EVENT, onTelemetryEvent as EventListener);
    return () => {
      window.removeEventListener(TELEMETRY_DEBUG_EVENT, onTelemetryEvent as EventListener);
    };
  }, []);

  const clearEvents = () => {
    setEvents([]);
  };

  return (
    <>
      <button
        type="button"
        aria-label={open ? 'Hide telemetry panel' : 'Show telemetry panel'}
        onClick={() => setOpen((value) => !value)}
        className="ui-btn fixed bottom-4 right-4 z-[70] px-3 py-2 text-xs font-semibold"
      >
        {open ? 'Hide telemetry' : 'Telemetry'}
      </button>

      {open && (
        <aside className="glass-panel fixed bottom-16 right-4 z-[70] w-[min(92vw,430px)] rounded-2xl border border-slate-100/20 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-50">Telemetry Debug</div>
              <div className="text-[11px] ui-muted">Most recent {MAX_VISIBLE_EVENTS} local telemetry events.</div>
            </div>
            <button type="button" onClick={clearEvents} className="ui-btn px-2 py-1 text-[11px]">
              Clear
            </button>
          </div>

          <div className="mt-3 max-h-[55vh] space-y-2 overflow-y-auto pr-1">
            {events.length === 0 && (
              <div className="rounded-lg bg-slate-950/45 px-3 py-2 text-xs ui-muted">No events yet.</div>
            )}
            {events.map((event, index) => (
              <div key={`${event.timestamp}-${event.event}-${index}`} className="rounded-lg bg-slate-950/45 px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-slate-100">{event.event}</div>
                    <div className="mt-0.5 text-[10px] text-slate-300/80">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className={`rounded-md border px-1.5 py-0.5 text-[10px] uppercase ${levelClass[event.level]}`}>
                    {event.level}
                  </div>
                </div>
                {event.data && (
                  <pre className="mt-2 overflow-x-auto rounded-md bg-black/30 p-2 text-[10px] leading-relaxed text-slate-200/90">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </aside>
      )}
    </>
  );
}
