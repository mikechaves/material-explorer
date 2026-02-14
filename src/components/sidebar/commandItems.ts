import type { Dispatch, SetStateAction } from 'react';
import { dispatchAppCommand } from '../../types/commands';
import type { CommandPaletteItem } from './CommandPalette';

type BuildCommandItemsArgs = {
  isCollapsed: boolean;
  setIsCollapsed: Dispatch<SetStateAction<boolean>>;
  startNewMaterial: () => void;
  focusSearch: () => void;
  openImportPicker: () => void;
  exportAll: () => void;
  exportAllGlb: () => Promise<void>;
};

export function buildCommandItems({
  isCollapsed,
  setIsCollapsed,
  startNewMaterial,
  focusSearch,
  openImportPicker,
  exportAll,
  exportAllGlb,
}: BuildCommandItemsArgs): CommandPaletteItem[] {
  return [
    {
      id: 'new-material',
      title: 'Create New Material',
      description: 'Start a blank draft in the editor.',
      shortcut: 'Ctrl/Cmd+Shift+N',
      keywords: ['new', 'material', 'draft'],
      run: () => startNewMaterial(),
    },
    {
      id: 'toggle-sidebar',
      title: isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar',
      description: 'Toggle the library panel.',
      shortcut: 'Ctrl/Cmd+B',
      keywords: ['sidebar', 'panel'],
      run: () => setIsCollapsed((prev) => !prev),
    },
    {
      id: 'focus-search',
      title: 'Focus Material Search',
      description: 'Jump to the sidebar search input.',
      shortcut: 'Ctrl/Cmd+F',
      keywords: ['search', 'find', 'filter'],
      run: () => focusSearch(),
    },
    {
      id: 'import-json',
      title: 'Import Materials JSON',
      description: 'Open file picker for JSON import.',
      shortcut: 'Ctrl/Cmd+I',
      keywords: ['import', 'json', 'file'],
      run: () => openImportPicker(),
    },
    {
      id: 'export-json',
      title: 'Export Library (JSON)',
      description: 'Download full library as JSON.',
      keywords: ['export', 'json', 'download'],
      run: () => exportAll(),
    },
    {
      id: 'export-glb',
      title: 'Export Library (GLB)',
      description: 'Download full library as GLB.',
      keywords: ['export', 'glb', 'download'],
      run: () => {
        void exportAllGlb();
      },
    },
    {
      id: 'save-material',
      title: 'Save Current Material',
      description: 'Trigger save/update in the editor.',
      shortcut: 'Ctrl/Cmd+S',
      keywords: ['save', 'update', 'material'],
      run: () => dispatchAppCommand('save-material'),
    },
    {
      id: 'toggle-preview',
      title: 'Toggle 3D Preview',
      description: 'Enable or disable interactive 3D preview.',
      shortcut: 'Ctrl/Cmd+P',
      keywords: ['preview', '3d', 'render'],
      run: () => dispatchAppCommand('toggle-preview'),
    },
    {
      id: 'toggle-compare',
      title: 'Toggle Compare Mode',
      description: 'Capture or show A/B comparison in editor.',
      keywords: ['compare', 'ab', 'reference'],
      run: () => dispatchAppCommand('toggle-compare'),
    },
    {
      id: 'focus-editor-name',
      title: 'Focus Material Name',
      description: 'Jump cursor to the editor name field.',
      keywords: ['name', 'title', 'focus'],
      run: () => dispatchAppCommand('focus-material-name'),
    },
    {
      id: 'open-onboarding',
      title: 'Show Onboarding Card',
      description: 'Reopen first-run guidance in the editor.',
      keywords: ['onboarding', 'welcome', 'starter'],
      run: () => dispatchAppCommand('open-onboarding'),
    },
  ];
}
