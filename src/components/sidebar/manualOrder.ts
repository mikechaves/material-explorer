export const MAX_MANUAL_ORDER_STORAGE_CHARS = 200_000;
export const MAX_MANUAL_ORDER_IDS = 5_000;
export const MAX_MANUAL_ORDER_ID_CHARS = 120;

export function sanitizeManualOrderIds(input: unknown): string[] {
  if (!Array.isArray(input)) return [];

  const next: string[] = [];
  const seen = new Set<string>();

  for (const value of input) {
    if (typeof value !== 'string') continue;
    const id = value.trim().slice(0, MAX_MANUAL_ORDER_ID_CHARS);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    next.push(id);
    if (next.length >= MAX_MANUAL_ORDER_IDS) break;
  }

  return next;
}

export function parseManualOrderStorage(raw: string | null): string[] {
  if (!raw || raw.length > MAX_MANUAL_ORDER_STORAGE_CHARS) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    return sanitizeManualOrderIds(parsed);
  } catch {
    return [];
  }
}
