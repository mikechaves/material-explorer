export type SortMode = 'updated' | 'created' | 'name' | 'manual';

export const SORT_OPTIONS: Array<{ value: SortMode; label: string }> = [
  { value: 'updated', label: 'Updated' },
  { value: 'created', label: 'Created' },
  { value: 'name', label: 'Name' },
  { value: 'manual', label: 'Manual' },
];

export function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}
