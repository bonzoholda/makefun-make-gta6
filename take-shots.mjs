// Take Palmera Bay's four screenshots with Chrome for Testing (playwright-core).
// Serves game/ on a local port, loads each ?shot= scene at 1280x800, lets the
// game play itself forward for a few seconds, then saves a JPEG under 256 KiB.
// Fails loudly on any console error. Run: node take-shots.mjs
import { createRequire } from 'node:module';
const require = createRequire('/tmp/pw-tools/package.json');
const { chromium } = require('playwright-core');
import { spawn } from 'node:child_process';
import { statSync } from 'node:fs';

const CHROME = '/home/hatch/pwshot/chrome-linux64/chrome';
const PORT = 8123;
const SHOTS = [
  { name: '1-cover.jpg', shot: 'cover' },
  { name: '2-drive.jpg', shot: 'drive' },
  { name: '3-foot.jpg', shot: 'foot' },
  { name: '4-chase.jpg', shot: 'chase' },
];

const server = spawn('node', ['serve.ts', '--port', String(PORT)], { stdio: 'pipe' });
await new Promise((resolve) => {
  server.stdout.on('data', () => resolve());
  setTimeout(resolve, 5000);
});

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
});
const errors = [];
try {
  for (const s of SHOTS) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`${s.name}: ${msg.text()}`);
    });
    page.on('pageerror', (err) => errors.push(`${s.name}: pageerror ${err.message}`));
    await page.goto(`http://127.0.0.1:${PORT}/index.html?shot=${s.shot}&seed=20261124`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__palmera && window.__palmera.ready, null, { timeout: 15000 });
    // Let traffic, police and particles move so the frame is alive — but not
    // so long that a staged stand-off ends in WASTED or BUSTED.
    await page.waitForTimeout(1200);
    let quality = 82;
    let path = `screenshots/${s.name}`;
    await page.screenshot({ path, type: 'jpeg', quality });
    let size = statSync(path).size;
    while (size > 250000 && quality > 55) {
      quality -= 8;
      await page.screenshot({ path, type: 'jpeg', quality });
      size = statSync(path).size;
    }
    console.log(`${s.name}: ${size} bytes (quality ${quality})`);
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
if (errors.length > 0) {
  console.error('CONSOLE ERRORS:');
  for (const e of errors) console.error('  ' + e);
  process.exit(1);
}
console.log('All screenshots taken, no console errors.');
