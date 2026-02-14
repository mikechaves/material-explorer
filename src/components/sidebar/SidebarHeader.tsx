import React from 'react';
import { motion } from 'framer-motion';

type SidebarHeaderProps = {
  isCollapsed: boolean;
  materialsCount: number;
  favoriteCount: number;
  logoUrl: string;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onToggleCollapsed: () => void;
  onStartNew: () => void;
  onOpenImport: () => void;
  onExportJson: () => void;
  onExportGlb: () => void;
  onOpenCommands: () => void;
  onImportFile: (file: File) => void;
};

export function SidebarHeader({
  isCollapsed,
  materialsCount,
  favoriteCount,
  logoUrl,
  fileInputRef,
  onToggleCollapsed,
  onStartNew,
  onOpenImport,
  onExportJson,
  onExportGlb,
  onOpenCommands,
  onImportFile,
}: SidebarHeaderProps) {
  return (
    <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-between'} items-start mb-5`}>
      <div className={`flex items-center ${isCollapsed ? 'flex-col' : 'gap-3'}`}>
        <motion.button
          onClick={onToggleCollapsed}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1.5 rounded-xl bg-slate-900/65 hover:bg-slate-800/75 border border-slate-100/15 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <img alt="Material Explorer" width="48" height="48" src={logoUrl} className="rounded-lg shadow-lg" />
        </motion.button>

        {!isCollapsed && (
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide text-slate-100">Material Explorer</div>
            <div className="text-xs ui-muted">
              {materialsCount} materials • {favoriteCount} favorites
            </div>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <motion.button
            className="ui-btn px-3 py-1.5 text-xs font-semibold"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onStartNew}
          >
            New
          </motion.button>
          <motion.button
            className="ui-btn px-3 py-1.5 text-xs font-semibold"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenImport}
          >
            Import
          </motion.button>
          <motion.button
            className="ui-btn px-3 py-1.5 text-xs font-semibold"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onExportJson}
          >
            Export JSON
          </motion.button>
          <motion.button
            className="ui-btn px-3 py-1.5 text-xs font-semibold"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onExportGlb}
          >
            Export GLB
          </motion.button>
          <motion.button
            className="ui-btn px-3 py-1.5 text-xs font-semibold"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenCommands}
          >
            Commands
          </motion.button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImportFile(file);
            }}
          />
        </div>
      )}
    </div>
  );
}
