import type { MaterialDraft } from '../../types/material';

export type MaterialPreset = {
  id: string;
  label: string;
  description: string;
  values: Partial<MaterialDraft>;
};

export const MATERIAL_PRESETS: MaterialPreset[] = [
  {
    id: 'brushed-metal',
    label: 'Brushed Metal',
    description: 'Reflective and premium',
    values: {
      color: '#9ca7bc',
      metalness: 0.96,
      roughness: 0.22,
      clearcoat: 0.15,
      clearcoatRoughness: 0.08,
      transmission: 0,
      opacity: 1,
    },
  },
  {
    id: 'frosted-glass',
    label: 'Frosted Glass',
    description: 'Soft translucent look',
    values: {
      color: '#dcefff',
      metalness: 0,
      roughness: 0.16,
      transmission: 0.95,
      ior: 1.45,
      clearcoat: 0.22,
      clearcoatRoughness: 0.12,
      opacity: 1,
    },
  },
  {
    id: 'matte-clay',
    label: 'Matte Clay',
    description: 'Warm product mockups',
    values: {
      color: '#b77f63',
      metalness: 0,
      roughness: 0.88,
      clearcoat: 0,
      transmission: 0,
      opacity: 1,
    },
  },
  {
    id: 'neon-polymer',
    label: 'Neon Polymer',
    description: 'Glow-focused accent',
    values: {
      color: '#1f6cff',
      emissive: '#00e6ff',
      emissiveIntensity: 0.82,
      metalness: 0.38,
      roughness: 0.32,
      clearcoat: 0.4,
      clearcoatRoughness: 0.1,
      transmission: 0,
      opacity: 1,
    },
  },
];

export const EDITOR_CHECKBOX_CLASS =
  'h-3.5 w-3.5 rounded border border-cyan-100/40 bg-slate-950/55 text-cyan-300 focus:ring-2 focus:ring-cyan-300/35';

export const ONBOARDING_SEEN_KEY = 'materialExplorerOnboardingSeen';
