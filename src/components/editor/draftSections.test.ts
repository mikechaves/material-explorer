import { describe, expect, it } from 'vitest';
import { DEFAULT_MATERIAL_DRAFT } from '../../utils/material';
import { isOpticsSectionDirty, isSurfaceSectionDirty, resetOpticsSection, resetSurfaceSection } from './draftSections';

describe('draftSections', () => {
  it('detects dirty state for surface and optics sections independently', () => {
    const baseline = { ...DEFAULT_MATERIAL_DRAFT };
    const changedSurface = { ...baseline, roughness: 0.2 };
    const changedOptics = { ...baseline, transmission: 0.7 };

    expect(isSurfaceSectionDirty(changedSurface, baseline)).toBe(true);
    expect(isOpticsSectionDirty(changedSurface, baseline)).toBe(false);
    expect(isSurfaceSectionDirty(changedOptics, baseline)).toBe(false);
    expect(isOpticsSectionDirty(changedOptics, baseline)).toBe(true);
  });

  it('resets only targeted section fields', () => {
    const baseline = { ...DEFAULT_MATERIAL_DRAFT, color: '#ffffff', transmission: 0 };
    const current = {
      ...baseline,
      color: '#ff0000',
      metalness: 0.95,
      roughness: 0.05,
      transmission: 0.8,
      repeatX: 2,
    };

    const resetSurface = resetSurfaceSection(current, baseline);
    expect(resetSurface.color).toBe(baseline.color);
    expect(resetSurface.metalness).toBe(baseline.metalness);
    expect(resetSurface.roughness).toBe(baseline.roughness);
    expect(resetSurface.transmission).toBe(current.transmission);
    expect(resetSurface.repeatX).toBe(current.repeatX);

    const resetOptics = resetOpticsSection(current, baseline);
    expect(resetOptics.transmission).toBe(baseline.transmission);
    expect(resetOptics.ior).toBe(baseline.ior);
    expect(resetOptics.color).toBe(current.color);
    expect(resetOptics.repeatX).toBe(current.repeatX);
  });
});
