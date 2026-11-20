// Screenshot runner for Leonida Platinum (Node 22, standard library + playwright-core).
// Serves app/ with serve.ts, opens each view in shots.json in real Chromium, seeds
// progress through localStorage before the page loads, and saves a JPEG of each view
// into screenshots/. Every shot is a real render of the app's own code — nothing is
// edited or composited afterwards.
//
// Usage: node scripts/shots.mjs
//   CHROME_PATH — path to a Chromium binary (default: the shot chrome in ~/workspace/makefun/shot)
//   PLAYWRIGHT_CORE — path to the playwright-core package (default: ~/workspace/makefun/shot/node_modules)

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const home = process.env.HOME ?? '/home/hatch';
const playwrightCore = process.env.PLAYWRIGHT_CORE ??
  join(home, 'workspace/makefun/shot/node_modules/playwright-core');
const { chromium } = require(playwrightCore);

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const shotsFile = join(repoRoot, 'shots.json');
const screenshotsDir = join(repoRoot, 'screenshots');
const chromePath = process.env.CHROME_PATH ??
  join(home, 'workspace/makefun/shot/chrome-linux64/chrome');
const PORT = 8080;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const MAX_BYTES = 262144;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(tries = 50) {
  for (let i = 0; i < tries; i++) {
    try {
      const response = await fetch(`${BASE_URL}/`);
      if (response.ok) return;
    } catch {
      // Server is not up yet.
    }
    await sleep(200);
  }
  throw new Error('serve.ts did not answer on port 8080');
}

function trophyNamesById() {
  const doc = JSON.parse(readFileSync(join(repoRoot, 'app/data/trophies.json'), 'utf8'));
  return new Map(doc.trophies.map((t) => [t.id, t.name]));
}

async function takeOneShot(browser, shot, namesById) {
  const earnedNames = (shot.seed ?? []).map((id) => namesById.get(id)).filter(Boolean);
  const page = await browser.newPage({ viewport: shot.viewport });
  await page.addInitScript(
    ({ key, earned, spoiler }) => {
      localStorage.setItem(key, JSON.stringify({ earned, spoiler: Boolean(spoiler) }));
    },
    { key: 'leonida-platinum-v1', earned: earnedNames, spoiler: shot.spoiler ?? false },
  );
  await page.goto(`${BASE_URL}/${shot.path}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(
    () => document.querySelectorAll('#trophyList li, #roadmapList li, #missableList li').length > 0,
    { timeout: 10000 },
  );
  if (shot.kind) {
    await page.click(`.chip[data-kind="${shot.kind}"]`);
    await sleep(300);
  }
  if (shot.scroll) await page.evaluate((y) => window.scrollTo(0, y), shot.scroll);
  await sleep(400);
  const outPath = join(screenshotsDir, shot.file);
  await page.screenshot({ path: outPath, type: 'jpeg', quality: 82 });
  await page.close();
  const { size } = statSync(outPath);
  console.log(`${shot.file}: ${size} bytes (${(size / 1024).toFixed(1)} KiB)${size > MAX_BYTES ? ' — OVER 256 KiB!' : ''}`);
  if (size > MAX_BYTES) throw new Error(`${shot.file} is over the 256 KiB cap`);
  return outPath;
}

async function runShots() {
  const shots = JSON.parse(readFileSync(shotsFile, 'utf8'));
  const namesById = trophyNamesById();
  const server = spawn('node', ['serve.ts', '--port', String(PORT)], {
    cwd: repoRoot,
    stdio: 'ignore',
  });
  try {
    await waitForServer();
    const browser = await chromium.launch({ executablePath: chromePath, args: ['--no-sandbox'] });
    try {
      for (const shot of shots) await takeOneShot(browser, shot, namesById);
    } finally {
      await browser.close();
    }
    console.log(`Done: ${shots.length} screenshots in screenshots/`);
  } finally {
    server.kill();
  }
}

runShots().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
