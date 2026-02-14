export const RECENT_COMMANDS_KEY = 'materialExplorerRecentCommands';
export const RECENT_COMMAND_LIMIT = 6;

export type SearchableCommand = {
  id: string;
  title: string;
  description?: string;
  keywords?: string[];
};

export function parseRecentCommandIds(raw: string | null, limit = RECENT_COMMAND_LIMIT): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string').slice(0, limit);
  } catch {
    return [];
  }
}

export function serializeRecentCommandIds(commandIds: string[], limit = RECENT_COMMAND_LIMIT) {
  return JSON.stringify(commandIds.slice(0, limit));
}

export function promoteRecentCommandId(previous: string[], commandId: string, limit = RECENT_COMMAND_LIMIT): string[] {
  return [commandId, ...previous.filter((id) => id !== commandId)].slice(0, limit);
}

export function deriveVisibleCommands<T extends SearchableCommand>(
  commands: T[],
  recentCommandIds: string[],
  query: string
) {
  const normalizedQuery = query.trim().toLowerCase();
  const commandById = new Map(commands.map((command) => [command.id, command]));
  const prunedRecentCommandIds = recentCommandIds.filter((commandId) => commandById.has(commandId));
  const recentCommands = prunedRecentCommandIds
    .map((commandId) => commandById.get(commandId))
    .filter((command): command is T => !!command);
  const recentCommandIdSet = new Set(recentCommands.map((command) => command.id));

  if (normalizedQuery) {
    const filteredCommands = commands.filter((command) => {
      const haystack = [command.title, command.description ?? '', ...(command.keywords ?? [])].join(' ').toLowerCase();
      return haystack.includes(normalizedQuery);
    });
    return {
      normalizedQuery,
      visibleCommands: filteredCommands,
      recentCommandIdSet,
      prunedRecentCommandIds,
    };
  }

  return {
    normalizedQuery,
    visibleCommands: [...recentCommands, ...commands.filter((command) => !recentCommandIdSet.has(command.id))],
    recentCommandIdSet,
    prunedRecentCommandIds,
  };
}
