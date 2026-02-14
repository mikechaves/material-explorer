/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

function safeCopy(src, dest) {
  try {
    if (!fs.existsSync(src)) return;
    if (fs.existsSync(dest)) return;
    fs.copyFileSync(src, dest);
  } catch {
    // Best-effort only; do not fail install for this.
  }
}

function main() {
  const pkgDir = path.join(process.cwd(), 'node_modules', '@mediapipe', 'tasks-vision');
  if (!fs.existsSync(pkgDir)) return;

  // tasks-vision 0.10.17 references these filenames, but ships *.mjs.map / *.cjs.map instead.
  safeCopy(path.join(pkgDir, 'vision_bundle.mjs.map'), path.join(pkgDir, 'vision_bundle_mjs.js.map'));
  safeCopy(path.join(pkgDir, 'vision_bundle.cjs.map'), path.join(pkgDir, 'vision_bundle_cjs.js.map'));
}

main();
