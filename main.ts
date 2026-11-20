// Leonida Platinum — the entry program (Node 22, standard library only).
// The guide is plain static files under app/ (index.html, style.css, app.js and
// data/trophies.json), with no build step and nothing fetched over the network.
// This program hands the guide in: it copies app/ and screenshots/ from beside this
// file into the output directory and writes output/dossier.json with the vendored
// make.fun library, which is the summary the judge reads. vendor/makefun-frontend.ts
// is the kit's copy and must stay unchanged: the scorer rebuilds the dossier with its
// own copy and compares the two byte for byte.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Inside the grader, MAKEFUN_OUTPUT_DIR is unset and /output is used instead.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's caps for this competition, so a local run refuses what the scorer
// would refuse instead of handing in an entry that cannot pass: at most 4 screenshots
// and 256 KiB each, app/ at most 993 files and directories and 48 MiB in all, and a
// dossier text of at most 160 KiB.
const DOSSIER_OPTIONS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function handInEntry() {
  mkdirSync(outputDir, { recursive: true });
  cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
  mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
  if (existsSync(join(repoRoot, 'screenshots'))) {
    cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
  }
  writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, DOSSIER_OPTIONS));
}

handInEntry();
