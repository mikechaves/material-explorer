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
          className="ui-input px-3 py-2 text-sm text-left"
        >
          {selected?.label}
        </Listbox.Button>
        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <Listbox.Options
            className="absolute z-50 mt-2 w-full max-h-60 overflow-auto rounded-xl
                       glass-panel p-1.5 text-sm text-white"
          >
            {options.map((option) => (
              <Listbox.Option
                key={option.value}
                value={option.value}
                className={({ active, selected: isSelected }) =>
                  classNames(
                    'cursor-pointer select-none rounded-lg px-3 py-2 transition-colors',
                    active && 'bg-white/10',
                    isSelected && 'bg-cyan-400/20 text-cyan-100'
                  )
                }
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
}) => {
  const rangeId = `${name}-range`;
  const valueId = `${name}-value`;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center gap-2">
        <label className="ui-label" htmlFor={rangeId}>{label}</label>
        <div className="flex items-center gap-2">
          <input
            id={rangeId}
            type="range"
            name={name}
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            step={step}
            aria-label={`${label} slider`}
            className="w-36 h-2 appearance-none bg-white/10 rounded-full cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-3
                   [&::-webkit-slider-thumb]:h-3
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-cyan-300
                   [&::-webkit-slider-thumb]:hover:bg-cyan-200
                   [&::-webkit-slider-thumb]:ring-2
                   [&::-webkit-slider-thumb]:ring-cyan-100/35
                   [&::-webkit-slider-thumb]:transition-colors
                   [&::-webkit-slider-thumb]:cursor-grab
                   [&:active::-webkit-slider-thumb]:cursor-grabbing
                   [&::-moz-range-thumb]:w-3
                   [&::-moz-range-thumb]:h-3
                   [&::-moz-range-thumb]:rounded-full
                   [&::-moz-range-thumb]:bg-cyan-300
                   [&::-moz-range-thumb]:hover:bg-cyan-200
                   [&::-moz-range-thumb]:border-0
                   [&::-moz-range-thumb]:cursor-grab
                   [&:active::-moz-range-thumb]:cursor-grabbing
                   [&::-moz-range-progress]:bg-cyan-300/60
                   [&::-moz-range-track]:bg-transparent"
          />
          <input
            id={valueId}
            type="number"
            name={name}
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            step={step}
            aria-label={`${label} value`}
            className="w-16 px-2 py-0.5 rounded-md text-sm text-white/95 font-semibold
                     bg-slate-900/70 border border-cyan-100/20 appearance-none outline-none
                     focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
          />
        </div>
      </div>
    </div>
  );
};

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
