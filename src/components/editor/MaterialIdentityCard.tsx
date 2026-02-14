import React from 'react';
import type { MaterialDraft } from '../../types/material';
import { MATERIAL_NAME_MAX_LENGTH } from '../../utils/material';

type MaterialIdentityCardProps = {
  material: MaterialDraft;
  checkboxClass: string;
  nameInputRef: React.RefObject<HTMLInputElement>;
  onNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFavoriteChange: (checked: boolean) => void;
  onTagsInputChange: (value: string) => void;
};

export function MaterialIdentityCard({
  material,
  checkboxClass,
  nameInputRef,
  onNameChange,
  onFavoriteChange,
  onTagsInputChange,
}: MaterialIdentityCardProps) {
  return (
    <div className="section-shell px-3 py-3 space-y-3">
      <div className="space-y-2">
        <label className="ui-label" htmlFor="material-name">
          Name
        </label>
        <input
          ref={nameInputRef}
          id="material-name"
          type="text"
          name="name"
          value={material.name ?? ''}
          onChange={onNameChange}
          placeholder="Untitled"
          maxLength={MATERIAL_NAME_MAX_LENGTH}
          className="ui-input px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <label className="ui-label" htmlFor="material-favorite">
          Favorite
        </label>
        <input
          id="material-favorite"
          type="checkbox"
          checked={!!material.favorite}
          onChange={(event) => onFavoriteChange(event.target.checked)}
          className={checkboxClass}
        />
      </div>

      <div className="space-y-2">
        <label className="ui-label" htmlFor="material-tags">
          Tags
        </label>
        <input
          id="material-tags"
          type="text"
          value={(material.tags ?? []).join(', ')}
          onChange={(event) => onTagsInputChange(event.target.value)}
          placeholder="e.g. glass, carpaint, fabric"
          className="ui-input px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}
