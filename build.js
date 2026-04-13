/**
 * Custom build script for Control Personal.
 *
 * electron-builder requires "Developer Mode" on Windows to create symlinks
 * inside the winCodeSign toolchain. Since we don't code-sign personal builds,
 * we run the packager with the `dir` target (which always succeeds), then zip
 * the result ourselves using PowerShell's Compress-Archive.
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = __dirname;

// Use a temp folder outside the project to avoid file-lock issues on Windows.
const TMP_OUT = path.join(os.tmpdir(), 'control-personal-build');
const UNPACKED = path.join(TMP_OUT, 'win-unpacked');

// Final zip goes next to this script.
const pkg = require('./package.json');
const { version } = pkg;
const productName = (pkg.build && pkg.build.productName) || pkg.name || 'app';
const zipName = `${productName.replace(/\s+/g, '-')}-${version}-win-x64.zip`;
const zipPath = path.join(ROOT, 'dist-app', zipName);

// ── 1. Run electron-builder (dir target, ignore exit code) ─────────────────

console.log('\n  Packaging app with electron-builder...\n');

spawnSync(
  'npx',
  ['electron-builder', '--win', '--dir', `--config.directories.output=${TMP_OUT}`],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      CSC_LINK: '',
      CSC_IDENTITY_AUTO_DISCOVERY: 'false',
    },
    shell: true,
  }
);

if (!fs.existsSync(UNPACKED)) {
  console.error('\n  Packaging failed — win-unpacked directory not found at: ' + UNPACKED);
  process.exit(1);
}

console.log('\n  Packaging complete: ' + UNPACKED);

// ── 2. Zip the win-unpacked directory using PowerShell ─────────────────────

fs.mkdirSync(path.join(ROOT, 'dist-app'), { recursive: true });

console.log(`\n  Creating archive: ${zipName} ...`);

const psCmd = `Compress-Archive -Path '${UNPACKED}\\*' -DestinationPath '${zipPath}' -Force`;
const zipResult = spawnSync('powershell', ['-NoProfile', '-Command', psCmd], {
  stdio: 'inherit',
  shell: false,
});

if (zipResult.status !== 0 || !fs.existsSync(zipPath)) {
  console.error('\n  Failed to create zip archive.');
  process.exit(1);
}

const sizeMB = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(1);
console.log(`\n  Done!  ->  dist-app/${zipName}  (${sizeMB} MB)`);
console.log('\nTo run the app: unzip and launch "Control Personal.exe"');
