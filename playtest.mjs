// Headless play-test for Palmera Bay: title -> Enter -> walk -> shoot -> pause
// -> save -> reload -> load, with zero console errors. Run: node playtest.mjs
import { createRequire } from 'node:module';
const require = createRequire('/tmp/pw-tools/package.json');
const { chromium } = require('playwright-core');
import { spawn } from 'node:child_process';

const CHROME = '/home/hatch/pwshot/chrome-linux64/chrome';
const PORT = 8124;
const errors = [];
const fail = (msg) => { console.error('FAIL: ' + msg); process.exitCode = 1; };

const server = spawn('node', ['serve.ts', '--port', String(PORT)], { stdio: 'pipe' });
await new Promise((resolve) => {
  server.stdout.on('data', () => resolve());
  setTimeout(resolve, 5000);
});

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-gpu'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push('pageerror ' + err.message));
  await page.goto(`http://127.0.0.1:${PORT}/index.html?seed=20261124`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__palmera && window.__palmera.ready, null, { timeout: 15000 });

  const state = () => page.evaluate(() => window.__palmera.state);
  if ((await state()) !== 'title') fail('expected title, got ' + (await state()));
  else console.log('title OK');

  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  if ((await state()) !== 'playing') fail('expected playing after Enter, got ' + (await state()));
  else console.log('Enter -> playing OK');

  const before = await page.evaluate(() => ({ x: window.__palmera.player.x, y: window.__palmera.player.y }));
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(900);
  await page.keyboard.up('KeyW');
  const after = await page.evaluate(() => ({ x: window.__palmera.player.x, y: window.__palmera.player.y }));
  if (Math.hypot(after.x - before.x, after.y - before.y) < 50) fail('player did not walk');
  else console.log(`walk OK (${Math.round(Math.hypot(after.x - before.x, after.y - before.y))}px)`);

  const ammoBefore = await page.evaluate(() => window.__palmera.ammo);
  await page.mouse.click(700, 300);
  await page.waitForTimeout(200);
  const ammoAfter = await page.evaluate(() => window.__palmera.ammo);
  if (ammoAfter !== ammoBefore - 1) fail(`shoot did not spend ammo (${ammoBefore} -> ${ammoAfter})`);
  else console.log('shoot OK (ammo ' + ammoBefore + ' -> ' + ammoAfter + ')');

  await page.keyboard.press('KeyF');
  await page.waitForTimeout(200);
  console.log('punch OK (no error)');

  await page.keyboard.press('KeyP');
  await page.waitForTimeout(200);
  if ((await state()) !== 'paused') fail('expected paused, got ' + (await state()));
  else console.log('pause OK');
  await page.keyboard.press('KeyS');
  await page.waitForTimeout(200);
  const saved = await page.evaluate(() => !!localStorage.getItem('palmera-bay-save-v1'));
  if (!saved) fail('save did not write localStorage');
  else console.log('save OK');
  await page.keyboard.press('KeyP');
  await page.waitForTimeout(200);
  if ((await state()) !== 'playing') fail('expected playing after resume, got ' + (await state()));
  else console.log('resume OK');

  // Reload and continue from the save with L.
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.__palmera && window.__palmera.ready, null, { timeout: 15000 });
  await page.keyboard.press('KeyL');
  await page.waitForTimeout(300);
  if ((await state()) !== 'playing') fail('expected playing after load, got ' + (await state()));
  else console.log('load OK');

  const mission = await page.evaluate(() => window.__palmera.mission && window.__palmera.mission.title);
  console.log('mission after load: ' + mission);
  await page.close();
} finally {
  await browser.close();
  server.kill();
}
if (errors.length > 0) {
  console.error('CONSOLE ERRORS:');
  for (const e of errors) console.error('  ' + e);
  process.exit(1);
}
console.log('Play-test passed, no console errors.');
