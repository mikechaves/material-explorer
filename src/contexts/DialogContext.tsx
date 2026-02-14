import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type ConfirmTone = 'default' | 'danger';

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
};

type CopyDialogOptions = {
  title: string;
  value: string;
  message?: string;
};

type ConfirmDialogState = {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  tone: ConfirmTone;
};

type DialogContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  showCopyDialog: (options: CopyDialogOptions) => void;
};

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [copyDialog, setCopyDialog] = useState<CopyDialogOptions | null>(null);
  const confirmResolverRef = useRef<((value: boolean) => void) | null>(null);
  const copyInputRef = useRef<HTMLTextAreaElement>(null);

  const closeConfirmDialog = useCallback((result: boolean) => {
    const resolver = confirmResolverRef.current;
    confirmResolverRef.current = null;
    setConfirmDialog(null);
    resolver?.(result);
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        if (confirmResolverRef.current) confirmResolverRef.current(false);
        confirmResolverRef.current = resolve;
        setConfirmDialog({
          title: options.title,
          message: options.message,
          confirmLabel: options.confirmLabel ?? 'Confirm',
          cancelLabel: options.cancelLabel ?? 'Cancel',
          tone: options.tone ?? 'default',
        });
      }),
    []
  );

  const showCopyDialog = useCallback((options: CopyDialogOptions) => {
    setCopyDialog(options);
  }, []);

  useEffect(() => {
    if (!confirmDialog) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeConfirmDialog(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeConfirmDialog, confirmDialog]);

  useEffect(() => {
    if (!copyDialog) return;
    const raf = window.requestAnimationFrame(() => {
      copyInputRef.current?.focus();
      copyInputRef.current?.select();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setCopyDialog(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [copyDialog]);

  useEffect(
    () => () => {
      confirmResolverRef.current?.(false);
      confirmResolverRef.current = null;
    },
    []
  );

  return (
    <DialogContext.Provider value={{ confirm, showCopyDialog }}>
      {children}
      <AnimatePresence>
        {confirmDialog && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeConfirmDialog(false);
            }}
          >
            <motion.div
              className="glass-panel w-full max-w-md rounded-2xl border border-slate-100/20 p-4"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 6, opacity: 0 }}
              transition={{ duration: 0.2 }}
              role="dialog"
              aria-modal="true"
              aria-label={confirmDialog.title}
            >
              <div className="text-sm font-semibold text-slate-50">{confirmDialog.title}</div>
              {confirmDialog.message && (
                <div className="mt-2 text-xs ui-muted leading-relaxed">{confirmDialog.message}</div>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" className="ui-btn px-3 py-1.5 text-xs" onClick={() => closeConfirmDialog(false)}>
                  {confirmDialog.cancelLabel}
                </button>
                <button
                  type="button"
                  className={`ui-btn px-3 py-1.5 text-xs ${confirmDialog.tone === 'danger' ? 'ui-btn-danger' : 'ui-btn-primary'}`}
                  onClick={() => closeConfirmDialog(true)}
                >
                  {confirmDialog.confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {copyDialog && (
          <motion.div
            className="fixed inset-0 z-[61] flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setCopyDialog(null);
            }}
          >
            <motion.div
              className="glass-panel w-full max-w-xl rounded-2xl border border-slate-100/20 p-4"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 6, opacity: 0 }}
              transition={{ duration: 0.2 }}
              role="dialog"
              aria-modal="true"
              aria-label={copyDialog.title}
            >
              <div className="text-sm font-semibold text-slate-50">{copyDialog.title}</div>
              {copyDialog.message && <div className="mt-2 text-xs ui-muted leading-relaxed">{copyDialog.message}</div>}
              <textarea
                ref={copyInputRef}
                readOnly
                value={copyDialog.value}
                className="ui-input mt-3 min-h-[110px] resize-y px-3 py-2 text-xs leading-relaxed"
                onFocus={(event) => event.currentTarget.select()}
                aria-label="Copy link value"
              />
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" className="ui-btn px-3 py-1.5 text-xs" onClick={() => setCopyDialog(null)}>
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
};

export function useDialogs() {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialogs must be used within a DialogProvider');
  return context;
}
