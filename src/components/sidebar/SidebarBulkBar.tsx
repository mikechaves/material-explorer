import React from 'react';

type SidebarBulkBarProps = {
  selectedCount: number;
  onDelete: () => void;
  onExportJson: () => void;
  onExportGlb: () => void;
  onFavorite: () => void;
  onUnfavorite: () => void;
};

export function SidebarBulkBar({
  selectedCount,
  onDelete,
  onExportJson,
  onExportGlb,
  onFavorite,
  onUnfavorite,
}: SidebarBulkBarProps) {
  const disabled = selectedCount === 0;

  return (
    <div className="mb-4 p-3 rounded-xl section-shell">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-slate-200/80">
          Selected: <span className="font-semibold text-white">{selectedCount}</span>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <button type="button" disabled={disabled} onClick={onDelete} className="ui-btn ui-btn-danger px-3 py-1 text-xs disabled:opacity-50">
            Delete
          </button>
          <button type="button" disabled={disabled} onClick={onExportJson} className="ui-btn px-3 py-1 text-xs disabled:opacity-50">
            Export JSON
          </button>
          <button type="button" disabled={disabled} onClick={onExportGlb} className="ui-btn px-3 py-1 text-xs disabled:opacity-50">
            Export GLB
          </button>
          <button type="button" disabled={disabled} onClick={onFavorite} className="ui-btn px-3 py-1 text-xs disabled:opacity-50">
            Favorite
          </button>
          <button type="button" disabled={disabled} onClick={onUnfavorite} className="ui-btn px-3 py-1 text-xs disabled:opacity-50">
            Unfavorite
          </button>
        </div>
      </div>
    </div>
  );
}
