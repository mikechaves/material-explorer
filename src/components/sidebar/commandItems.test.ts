import { describe, expect, it, vi } from 'vitest';
import { buildCommandItems } from './commandItems';

function findCommand(commands: ReturnType<typeof buildCommandItems>, id: string) {
  return commands.find((command) => command.id === id);
}

describe('buildCommandItems', () => {
  it('includes history commands with expected shortcuts', () => {
    const commands = buildCommandItems({
      isCollapsed: false,
      setIsCollapsed: () => {},
      startNewMaterial: () => {},
      focusSearch: () => {},
      openImportPicker: () => {},
      exportAll: () => {},
      exportAllGlb: async () => {},
    });

    expect(findCommand(commands, 'undo-material-change')?.shortcut).toBe('Ctrl/Cmd+Z');
    expect(findCommand(commands, 'redo-material-change')?.shortcut).toBe('Ctrl/Cmd+Shift+Z / Ctrl/Cmd+Y');
  });

  it('runs local sidebar/library actions', () => {
    let isCollapsed = false;
    const setIsCollapsed = (nextState: boolean | ((prev: boolean) => boolean)) => {
      isCollapsed = typeof nextState === 'function' ? nextState(isCollapsed) : nextState;
    };

    const startNewMaterial = vi.fn();
    const focusSearch = vi.fn();
    const openImportPicker = vi.fn();
    const exportAll = vi.fn();
    const exportAllGlb = vi.fn(async () => {});

    const commands = buildCommandItems({
      isCollapsed,
      setIsCollapsed,
      startNewMaterial,
      focusSearch,
      openImportPicker,
      exportAll,
      exportAllGlb,
    });

    findCommand(commands, 'new-material')?.run();
    findCommand(commands, 'toggle-sidebar')?.run();
    findCommand(commands, 'focus-search')?.run();
    findCommand(commands, 'import-json')?.run();
    findCommand(commands, 'export-json')?.run();
    findCommand(commands, 'export-glb')?.run();

    expect(startNewMaterial).toHaveBeenCalledTimes(1);
    expect(isCollapsed).toBe(true);
    expect(focusSearch).toHaveBeenCalledTimes(1);
    expect(openImportPicker).toHaveBeenCalledTimes(1);
    expect(exportAll).toHaveBeenCalledTimes(1);
    expect(exportAllGlb).toHaveBeenCalledTimes(1);
  });
});
