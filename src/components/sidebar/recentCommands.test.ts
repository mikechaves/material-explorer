import { describe, expect, it } from 'vitest';
import {
  deriveVisibleCommands,
  parseRecentCommandIds,
  promoteRecentCommandId,
  RECENT_COMMAND_LIMIT,
  serializeRecentCommandIds,
} from './recentCommands';

const commands = [
  { id: 'new', title: 'Create New Material', keywords: ['new', 'create'] },
  { id: 'save', title: 'Save Current Material', keywords: ['save'] },
  { id: 'preview', title: 'Toggle 3D Preview', keywords: ['preview', '3d'] },
];

describe('recentCommands', () => {
  it('parses and serializes recent command ids safely', () => {
    expect(parseRecentCommandIds(null)).toEqual([]);
    expect(parseRecentCommandIds('not-json')).toEqual([]);
    expect(parseRecentCommandIds('{"x":1}')).toEqual([]);
    expect(parseRecentCommandIds(JSON.stringify(['save', 1, null, 'preview']))).toEqual(['save', 'preview']);

    const serialized = serializeRecentCommandIds(['a', 'b', 'c'], 2);
    expect(serialized).toBe(JSON.stringify(['a', 'b']));
  });

  it('promotes recent command ids with dedupe and limit', () => {
    const promoted = promoteRecentCommandId(['save', 'preview'], 'save');
    expect(promoted).toEqual(['save', 'preview']);

    const largeList = Array.from({ length: RECENT_COMMAND_LIMIT + 3 }, (_, index) => `id-${index}`);
    const truncated = promoteRecentCommandId(largeList, 'new');
    expect(truncated[0]).toBe('new');
    expect(truncated.length).toBe(RECENT_COMMAND_LIMIT);
  });

  it('orders visible commands with recents first when query is empty', () => {
    const result = deriveVisibleCommands(commands, ['preview', 'missing', 'save'], '');

    expect(result.prunedRecentCommandIds).toEqual(['preview', 'save']);
    expect(result.visibleCommands.map((command) => command.id)).toEqual(['preview', 'save', 'new']);
    expect(result.recentCommandIdSet.has('preview')).toBe(true);
    expect(result.recentCommandIdSet.has('new')).toBe(false);
  });

  it('filters by query regardless of recent ordering', () => {
    const result = deriveVisibleCommands(commands, ['preview', 'save'], 'create');

    expect(result.visibleCommands.map((command) => command.id)).toEqual(['new']);
    expect(result.normalizedQuery).toBe('create');
  });
});
