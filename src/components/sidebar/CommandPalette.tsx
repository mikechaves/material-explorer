import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export type CommandPaletteItem = {
  id: string;
  title: string;
  description?: string;
  shortcut?: string;
  keywords?: string[];
  run: () => void;
};

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  commands: CommandPaletteItem[];
};

export function CommandPalette({ open, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((command) => {
      const haystack = [command.title, command.description ?? '', ...(command.keywords ?? [])].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [commands, query]);

  React.useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    const raf = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(raf);
  }, [open]);

  React.useEffect(() => {
    if (!filtered.length) {
      setActiveIndex(0);
      return;
    }
    if (activeIndex >= filtered.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, filtered.length]);

  const runCommand = (command: CommandPaletteItem | undefined) => {
    if (!command) return;
    command.run();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              onClose();
              return;
            }
            if (!filtered.length) return;
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActiveIndex((prev) => (prev + 1) % filtered.length);
              return;
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
              return;
            }
            if (event.key === 'Enter') {
              event.preventDefault();
              runCommand(filtered[activeIndex] ?? filtered[0]);
            }
          }}
        >
          <motion.div
            className="mx-auto w-full max-w-2xl glass-panel rounded-2xl p-3"
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            <div className="flex items-center gap-2 pb-3">
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                placeholder="Type a command"
                className="ui-input px-3 py-2 text-sm"
                aria-label="Command search"
              />
              <button type="button" className="ui-btn px-3 py-2 text-xs" onClick={onClose}>
                Esc
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-1">
              {filtered.length === 0 && (
                <div className="section-shell rounded-xl px-3 py-4 text-sm ui-muted">
                  No command found. Try another keyword.
                </div>
              )}

              {filtered.map((command, index) => (
                <button
                  key={command.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => runCommand(command)}
                  className={`w-full text-left rounded-xl px-3 py-2 transition-colors border ${
                    index === activeIndex
                      ? 'bg-cyan-300/15 border-cyan-200/45 text-white'
                      : 'bg-slate-950/45 border-slate-100/10 text-slate-100/90 hover:bg-slate-900/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{command.title}</div>
                      {command.description && <div className="text-xs ui-muted">{command.description}</div>}
                    </div>
                    {command.shortcut && (
                      <div className="text-[11px] text-slate-100/75 border border-slate-100/20 rounded-md px-2 py-0.5">
                        {command.shortcut}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
