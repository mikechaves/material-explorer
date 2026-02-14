# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0-beta] - 2025-12-29

### Highlights

- Expanded materials into a full **PBR/physical** workflow (emissive, clearcoat, transmission/IOR, opacity).
- Added **texture maps**: base color, normal (+ scale), roughness, metalness, ambient occlusion (+ strength), emissive, and alpha (+ cutoff), plus **tiling (U/V)**.
- Major **preview workflow** improvements: model picker, environment/HDRI picker, auto-rotate, zoom/grid/background toggles, **reset view**, **PNG snapshot**, and **shareable links** (URL-encoded).
- Export options: **JSON presets**, **GLB export per material**, and **GLB export of the full library** (grid of preview spheres).
- Library UX: **favorites**, **tags**, **search**, **sorting**, tag filter chips, **bulk actions** (delete/export/favorite), and **manual drag-to-reorder**.
- Viewer tools: **A/B compare** mode and responsive preview sizing.
- Fully **responsive layout** (mobile → desktop): sidebar becomes a drawer on small screens and the editor stacks preview above controls.
- Share links upgraded: shorter compressed links (v2) with an optional “include textures” mode (size-limited).

### Fixes

- Security: pinned vulnerable transitive deps via npm overrides:
  - `node-forge` to `>=1.3.2`
  - `glob` to `>=10.5.0` (Node 16/18 compatible)
  - `qs` to `>=6.14.1` (arrayLimit bracket-notation DoS)
- Hardened persistence: schema normalization + safer numeric handling to avoid invalid values corrupting saved materials.
- Build/developer experience: updated Browserslist DB, fixed `@mediapipe/tasks-vision` sourcemap mismatch, and cleaned up preview rendering warnings.
- UI polish: better preview framing, dark-theme dropdowns, confirmation on delete, and small accessibility tweaks.
- Branding cleanup: removed “Luma” references and switched to `public/logo.png` (including updated apple-touch icon and favicon preference).
- Tests: updated sidebar test expectations after removing the “MATERIALS” header.

### Known issues

- **LocalStorage quota**: texture maps are currently stored as data URLs inside material JSON; large images can exceed browser storage limits.
- **Share links & textures**: “share + textures” is size-limited; for reliable sharing of textures, prefer **Export JSON**.
- **GLB exports are previews**: exported `.glb` contains preview geometry (sphere/grid), not a user-imported mesh.

## [0.1] - 2024-03-24

### Highlights

- Initial release: create/edit/delete materials with color/metalness/roughness and a 3D preview.
