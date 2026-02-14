import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { SORT_OPTIONS, classNames, type SortMode } from './sidebarTypes';

type SidebarFiltersProps = {
  searchInputRef: React.RefObject<HTMLInputElement>;
  query: string;
  onQueryChange: (value: string) => void;
  cardPreviewEnabled: boolean;
  onToggleCardPreview: () => void;
  onlyFavorites: boolean;
  onToggleFavorites: () => void;
  bulkMode: boolean;
  onToggleBulkMode: () => void;
  sort: SortMode;
  onSortChange: (value: SortMode) => void;
  allTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
};

export function SidebarFilters({
  searchInputRef,
  query,
  onQueryChange,
  cardPreviewEnabled,
  onToggleCardPreview,
  onlyFavorites,
  onToggleFavorites,
  bulkMode,
  onToggleBulkMode,
  sort,
  onSortChange,
  allTags,
  selectedTags,
  onToggleTag,
  onClearTags,
}: SidebarFiltersProps) {
  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <input
          ref={searchInputRef}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search name or tags…"
          className="ui-input flex-1 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={onToggleFavorites}
          className="ui-chip px-3 py-2 text-sm"
          data-active={onlyFavorites}
          title="Toggle favorites"
          aria-label={onlyFavorites ? 'Show all materials' : 'Show only favorites'}
          aria-pressed={onlyFavorites}
        >
          ★
        </button>
        <button
          type="button"
          onClick={onToggleCardPreview}
          className="ui-chip px-3 py-2 text-sm"
          data-active={cardPreviewEnabled}
          title={cardPreviewEnabled ? 'Disable 3D thumbnails' : 'Enable 3D thumbnails'}
          aria-label={cardPreviewEnabled ? 'Disable 3D thumbnails' : 'Enable 3D thumbnails'}
          aria-pressed={cardPreviewEnabled}
        >
          3D
        </button>
        <button
          type="button"
          onClick={onToggleBulkMode}
          className="ui-chip px-3 py-2 text-sm"
          data-active={bulkMode}
          title="Bulk select"
          aria-label={bulkMode ? 'Disable bulk selection' : 'Enable bulk selection'}
          aria-pressed={bulkMode}
        >
          ✓
        </button>
        <Listbox value={sort} onChange={onSortChange}>
          <div className="relative">
            <Listbox.Button className="ui-input px-3 py-2 text-sm text-left">
              {sort === 'updated' ? 'Updated' : sort === 'created' ? 'Created' : sort === 'name' ? 'Name' : 'Manual'}
            </Listbox.Button>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-50 mt-2 w-40 max-h-60 overflow-auto rounded-xl glass-panel p-1.5 text-sm text-white">
                {SORT_OPTIONS.map((option) => (
                  <Listbox.Option
                    key={option.value}
                    value={option.value}
                    className={({ active, selected }) =>
                      classNames(
                        'cursor-pointer select-none rounded-lg px-3 py-2 transition-colors',
                        active && 'bg-white/10',
                        selected && 'bg-cyan-400/20 text-cyan-100'
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
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {allTags.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onToggleTag(tag)}
                className="ui-chip px-2.5 py-1 text-xs"
                data-active={active}
              >
                {tag}
              </button>
            );
          })}
          {selectedTags.length > 0 && (
            <button type="button" onClick={onClearTags} className="ui-chip px-2.5 py-1 text-xs">
              Clear
            </button>
          )}
        </div>
      )}
    </>
  );
}
