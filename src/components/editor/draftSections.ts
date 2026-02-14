import type { MaterialDraft } from '../../types/material';

export function isSurfaceSectionDirty(current: MaterialDraft, baseline: MaterialDraft) {
  return (
    current.color !== baseline.color ||
    current.metalness !== baseline.metalness ||
    current.roughness !== baseline.roughness
  );
}

export function isOpticsSectionDirty(current: MaterialDraft, baseline: MaterialDraft) {
  return (
    current.emissive !== baseline.emissive ||
    current.emissiveIntensity !== baseline.emissiveIntensity ||
    current.clearcoat !== baseline.clearcoat ||
    current.clearcoatRoughness !== baseline.clearcoatRoughness ||
    current.transmission !== baseline.transmission ||
    current.ior !== baseline.ior ||
    current.opacity !== baseline.opacity
  );
}

export function resetSurfaceSection(current: MaterialDraft, baseline: MaterialDraft): MaterialDraft {
  return {
    ...current,
    color: baseline.color,
    metalness: baseline.metalness,
    roughness: baseline.roughness,
  };
}

export function resetOpticsSection(current: MaterialDraft, baseline: MaterialDraft): MaterialDraft {
  return {
    ...current,
    emissive: baseline.emissive,
    emissiveIntensity: baseline.emissiveIntensity,
    clearcoat: baseline.clearcoat,
    clearcoatRoughness: baseline.clearcoatRoughness,
    transmission: baseline.transmission,
    ior: baseline.ior,
    opacity: baseline.opacity,
  };
}
