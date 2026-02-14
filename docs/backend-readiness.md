# Backend Readiness Plan

## Goals

- Keep current frontend behavior unchanged while introducing server persistence.
- Preserve import/export/share compatibility with existing local JSON payloads.
- Add server-side validation so malformed material payloads are rejected consistently.

## API Contract (v1)

### `GET /api/v1/materials`

- Returns all materials for the authenticated user, sorted by `updatedAt desc`.
- Response:

```json
{
  "materials": [
    {
      "id": "uuid",
      "name": "Steel",
      "favorite": false,
      "tags": ["metal"],
      "color": "#FFFFFF",
      "metalness": 0.5,
      "roughness": 0.5,
      "emissive": "#000000",
      "emissiveIntensity": 0,
      "clearcoat": 0,
      "clearcoatRoughness": 0.03,
      "transmission": 0,
      "ior": 1.5,
      "opacity": 1,
      "baseColorMap": "data:image/png;base64,...",
      "normalMap": "data:image/png;base64,...",
      "normalScale": 1,
      "roughnessMap": null,
      "metalnessMap": null,
      "aoMap": null,
      "emissiveMap": null,
      "alphaMap": null,
      "aoIntensity": 1,
      "alphaTest": 0,
      "repeatX": 1,
      "repeatY": 1,
      "createdAt": 1739577600000,
      "updatedAt": 1739577600000
    }
  ]
}
```

### `POST /api/v1/materials`

- Creates one material.
- Request body: material draft (same shape as current `MaterialDraft`).
- Response: created material with canonical server values.

### `PATCH /api/v1/materials/:id`

- Updates one material.
- Request body: partial patch of editable fields.
- Response: updated material.

### `DELETE /api/v1/materials/:id`

- Deletes one material.
- Response: `204 No Content`.

### `POST /api/v1/materials/bulk`

- Supports current frontend bulk actions efficiently.
- Request:

```json
{
  "updates": [{ "id": "uuid", "favorite": true }],
  "deletes": ["uuid-1", "uuid-2"]
}
```

- Response: `{ "updated": [...], "deletedIds": [...] }`.

## Validation Rules

- `name`: required, trimmed, max 120 chars.
- `color`, `emissive`: `#RRGGBB`.
- `metalness`, `roughness`, `emissiveIntensity`, `clearcoat`, `clearcoatRoughness`, `transmission`, `opacity`, `alphaTest`: `0..1`.
- `ior`: `1..2.5`.
- `normalScale`, `aoIntensity`: `0..2`.
- `repeatX`, `repeatY`: `0.01..20`.
- `tags`: array of non-empty strings, max 32 tags, max 40 chars/tag.
- texture fields: either omitted/null or valid `data:` URL (current mode) or object storage URL (future mode).

## Data Model (SQL-friendly)

- `users` table.
- `materials` table:
  - `id uuid pk`
  - `user_id uuid fk users(id)`
  - scalar material fields
  - `tags jsonb`
  - texture fields (`text`) for initial parity
  - `created_at timestamptz`, `updated_at timestamptz`
- Indexes:
  - `(user_id, updated_at desc)`
  - `(user_id, favorite)`
  - GIN on `tags`.

## Frontend Migration Path

1. Add repository abstraction in frontend (`localStorage` vs `http`) behind one interface.
2. Keep `localStorage` as fallback if API is unavailable.
3. Migrate bulk actions to `POST /materials/bulk`.
4. Keep import/export JSON format unchanged for backward compatibility.

## Security & Ops Baseline

- Auth required on all `/api/v1/*` endpoints.
- Per-user row scoping enforced in DB query layer.
- Request body size limits (especially for data URL textures).
- Rate limits on write endpoints.
- Structured audit logs for create/update/delete.
