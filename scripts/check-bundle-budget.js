/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function readAssets() {
  const assetsDir = path.join(process.cwd(), 'build', 'assets');
  if (!fs.existsSync(assetsDir)) {
    throw new Error('Missing build/assets directory. Run `npm run build` first.');
  }
  const files = fs.readdirSync(assetsDir);
  return { assetsDir, files };
}

function pickOne(files, pattern, label) {
  const matches = files.filter((file) => pattern.test(file)).sort();
  if (matches.length === 0) {
    throw new Error(`Could not find asset for ${label}.`);
  }
  return matches[matches.length - 1];
}

function getSizeInfo(assetsDir, file) {
  const fullPath = path.join(assetsDir, file);
  const content = fs.readFileSync(fullPath);
  return {
    file,
    raw: content.length,
    gzip: zlib.gzipSync(content, { level: 9 }).length,
  };
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(2)} KiB`;
}

function runBudgetChecks() {
  const { assetsDir, files } = readAssets();
  const jsFiles = files.filter((file) => file.endsWith('.js'));
  const cssFiles = files.filter((file) => file.endsWith('.css'));

  const info = {
    entryJs: getSizeInfo(assetsDir, pickOne(files, /^index-.*\.js$/, 'entry js')),
    sidebarJs: getSizeInfo(assetsDir, pickOne(files, /^Sidebar-.*\.js$/, 'sidebar chunk')),
    editorJs: getSizeInfo(assetsDir, pickOne(files, /^MaterialEditor-.*\.js$/, 'editor chunk')),
    threeCoreJs: getSizeInfo(assetsDir, pickOne(files, /^vendor-three-core-.*\.js$/, 'three core chunk')),
    entryCss: getSizeInfo(assetsDir, pickOne(files, /^index-.*\.css$/, 'entry css')),
  };

  const totalJsRaw = jsFiles.reduce((sum, file) => sum + getSizeInfo(assetsDir, file).raw, 0);
  const totalJsGzip = jsFiles.reduce((sum, file) => sum + getSizeInfo(assetsDir, file).gzip, 0);
  const totalCssRaw = cssFiles.reduce((sum, file) => sum + getSizeInfo(assetsDir, file).raw, 0);

  const checks = [
    { label: 'Entry JS raw', value: info.entryJs.raw, max: 20 * 1024 },
    { label: 'Sidebar JS raw', value: info.sidebarJs.raw, max: 30 * 1024 },
    { label: 'MaterialEditor JS raw', value: info.editorJs.raw, max: 42 * 1024 },
    { label: 'Three core JS raw', value: info.threeCoreJs.raw, max: 720 * 1024 },
    { label: 'Entry CSS raw', value: info.entryCss.raw, max: 30 * 1024 },
    { label: 'Total JS raw', value: totalJsRaw, max: 1350 * 1024 },
    { label: 'Total JS gzip', value: totalJsGzip, max: 380 * 1024 },
    { label: 'Total CSS raw', value: totalCssRaw, max: 32 * 1024 },
  ];

  console.log('Bundle budget check');
  console.log('-------------------');
  checks.forEach((check) => {
    const status = check.value <= check.max ? 'PASS' : 'FAIL';
    console.log(`${status} ${check.label}: ${formatKb(check.value)} / max ${formatKb(check.max)}`);
  });

  const failed = checks.filter((check) => check.value > check.max);
  if (failed.length > 0) {
    console.error('\nBundle budgets exceeded.');
    process.exit(1);
  }

  console.log('\nAll bundle budgets are within limits.');
}

try {
  runBudgetChecks();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
