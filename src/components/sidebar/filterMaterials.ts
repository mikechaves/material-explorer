import type { Material } from '../../types/material';
import type { SortMode } from './sidebarTypes';

type FilterMaterialsOptions = {
  query: string;
  onlyFavorites: boolean;
  selectedTags: string[];
  sort: SortMode;
  manualOrder: string[];
};

export function filterMaterials(
  materials: Material[],
  { query, onlyFavorites, selectedTags, sort, manualOrder }: FilterMaterialsOptions
) {
  const normalizedQuery = query.trim().toLowerCase();
  let list = materials.slice();

  if (onlyFavorites) {
    list = list.filter((material) => !!material.favorite);
  }

  if (selectedTags.length > 0) {
    list = list.filter((material) => selectedTags.every((tag) => (material.tags ?? []).includes(tag)));
  }

  if (normalizedQuery) {
    list = list.filter((material) => {
      const haystack = `${material.name ?? ''} ${(material.tags ?? []).join(' ')}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }

  if (sort === 'manual') {
    const indexById = new Map(manualOrder.map((id, index) => [id, index]));
    list.sort((a, b) => (indexById.get(a.id) ?? 999_999) - (indexById.get(b.id) ?? 999_999));
    return list;
  }

  list.sort((a, b) => {
    if (sort === 'name') return (a.name || '').localeCompare(b.name || '');
    if (sort === 'created') return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    return (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0);
  });
  return list;
}
