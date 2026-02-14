import { describe, expect, it } from 'vitest';
import type { Material } from '../../types/material';
import { filterMaterials } from './filterMaterials';

function makeMaterial(id: string, name: string, overrides: Partial<Material> = {}): Material {
  const now = Date.now();
  return {
    id,
    name,
    color: '#ffffff',
    metalness: 0.5,
    roughness: 0.5,
    emissive: '#000000',
    emissiveIntensity: 0,
    clearcoat: 0,
    clearcoatRoughness: 0.03,
    transmission: 0,
    ior: 1.5,
    opacity: 1,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('filterMaterials', () => {
  const materials = [
    makeMaterial('m-1', 'Oak Wood', { favorite: true, tags: ['wood', 'brown'], createdAt: 10, updatedAt: 30 }),
    makeMaterial('m-2', 'Brushed Steel', { favorite: false, tags: ['metal'], createdAt: 20, updatedAt: 40 }),
    makeMaterial('m-3', 'Blue Fabric', { favorite: true, tags: ['fabric', 'blue'], createdAt: 30, updatedAt: 35 }),
  ];

  it('filters by query across name and tags', () => {
    const result = filterMaterials(materials, {
      query: 'blue',
      onlyFavorites: false,
      selectedTags: [],
      sort: 'updated',
      manualOrder: [],
    });

    expect(result.map((material) => material.id)).toEqual(['m-3']);
  });

  it('filters only favorites when requested', () => {
    const result = filterMaterials(materials, {
      query: '',
      onlyFavorites: true,
      selectedTags: [],
      sort: 'updated',
      manualOrder: [],
    });

    expect(result.map((material) => material.id)).toEqual(['m-3', 'm-1']);
  });

  it('requires all selected tags', () => {
    const result = filterMaterials(materials, {
      query: '',
      onlyFavorites: false,
      selectedTags: ['wood', 'brown'],
      sort: 'updated',
      manualOrder: [],
    });

    expect(result.map((material) => material.id)).toEqual(['m-1']);
  });

  it('sorts in manual order with unknown ids at the end', () => {
    const result = filterMaterials(materials, {
      query: '',
      onlyFavorites: false,
      selectedTags: [],
      sort: 'manual',
      manualOrder: ['m-2', 'm-1'],
    });

    expect(result.map((material) => material.id)).toEqual(['m-2', 'm-1', 'm-3']);
  });

  it('sorts by name when requested', () => {
    const result = filterMaterials(materials, {
      query: '',
      onlyFavorites: false,
      selectedTags: [],
      sort: 'name',
      manualOrder: [],
    });

    expect(result.map((material) => material.id)).toEqual(['m-3', 'm-2', 'm-1']);
  });
});
