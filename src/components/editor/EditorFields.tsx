import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';

export function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

export function Dropdown<T extends { value: string; label: string }>({
  value,
  onChange,
  options,
}: {
  value: T['value'];
  onChange: (next: T['value']) => void;
  options: T[];
}) {
  const selected = options.find((option) => option.value === value) ?? options[0];
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative flex-1">
        <Listbox.Button
          className="w-full px-3 py-2 bg-white/5 rounded-lg text-sm text-white/90 outline-none
                     focus:bg-white/10 border border-white/5 focus:border-purple-500/30 text-left"
        >
          {selected?.label}
        </Listbox.Button>
        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <Listbox.Options
            className="absolute z-50 mt-2 w-full max-h-60 overflow-auto rounded-lg bg-gray-950/95 backdrop-blur
                       border border-white/10 shadow-xl p-1 text-sm text-white"
          >
            {options.map((option) => (
              <Listbox.Option
                key={option.value}
                value={option.value}
                className={({ active }) => classNames('cursor-pointer select-none rounded-md px-3 py-2', active && 'bg-white/10')}
              >
                {option.label}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
}

export const Control = ({
  name,
  value,
  label,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
}: {
  name: string;
  value: number;
  label: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min?: number;
  max?: number;
  step?: number;
}) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center gap-2">
      <label className="text-sm text-white/90 font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          name={name}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          className="w-32 h-2 appearance-none bg-white/5 rounded-full cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-3
                   [&::-webkit-slider-thumb]:h-3
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-purple-500
                   [&::-webkit-slider-thumb]:hover:bg-purple-400
                   [&::-webkit-slider-thumb]:transition-colors
                   [&::-webkit-slider-thumb]:cursor-grab
                   [&:active::-webkit-slider-thumb]:cursor-grabbing
                   [&::-moz-range-thumb]:w-3
                   [&::-moz-range-thumb]:h-3
                   [&::-moz-range-thumb]:rounded-full
                   [&::-moz-range-thumb]:bg-purple-500
                   [&::-moz-range-thumb]:hover:bg-purple-400
                   [&::-moz-range-thumb]:border-0
                   [&::-moz-range-thumb]:cursor-grab
                   [&:active::-moz-range-thumb]:cursor-grabbing
                   [&::-moz-range-progress]:bg-purple-500/50
                   [&::-moz-range-track]:bg-transparent"
        />
        <input
          type="number"
          name={name}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          className="w-16 px-2 py-0.5 bg-purple-500/20 backdrop-blur-sm rounded text-sm text-white/90
                   font-medium appearance-none outline-none focus:bg-purple-500/30"
        />
      </div>
    </div>
  </div>
);

export type PreviewModel = 'sphere' | 'box' | 'torusKnot' | 'icosahedron';
export type PreviewEnv = 'warehouse' | 'studio' | 'city' | 'sunset' | 'dawn' | 'night' | 'forest' | 'apartment' | 'park' | 'lobby';

export const PREVIEW_MODEL_OPTIONS: Array<{ value: PreviewModel; label: string }> = [
  { value: 'sphere', label: 'Sphere' },
  { value: 'box', label: 'Box' },
  { value: 'torusKnot', label: 'Torus knot' },
  { value: 'icosahedron', label: 'Icosahedron' },
];

export const PREVIEW_ENV_OPTIONS: Array<{ value: PreviewEnv; label: string }> = [
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'studio', label: 'Studio' },
  { value: 'city', label: 'City' },
  { value: 'sunset', label: 'Sunset' },
  { value: 'dawn', label: 'Dawn' },
  { value: 'night', label: 'Night' },
  { value: 'forest', label: 'Forest' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'park', label: 'Park' },
  { value: 'lobby', label: 'Lobby' },
];
