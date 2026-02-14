import React from 'react';

type DraftHistoryCardProps = {
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onRevert: () => void;
  onUndo: () => void;
  onRedo: () => void;
};

export function DraftHistoryCard({
  isDirty,
  canUndo,
  canRedo,
  onRevert,
  onUndo,
  onRedo,
}: DraftHistoryCardProps) {
  return (
    <div className="section-shell px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-xs ui-muted">Draft history</div>
          <div className={`text-[11px] ${isDirty ? 'text-amber-100/90' : 'ui-muted'}`}>
            {isDirty ? 'Unsaved changes' : 'All changes saved'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="ui-btn px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            onClick={onRevert}
            disabled={!isDirty}
            title="Revert all unsaved changes"
          >
            Revert
          </button>
          <button
            type="button"
            className="ui-btn px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl/Cmd+Z)"
          >
            Undo
          </button>
          <button
            type="button"
            className="ui-btn px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl/Cmd+Shift+Z)"
          >
            Redo
          </button>
        </div>
      </div>
    </div>
  );
}
