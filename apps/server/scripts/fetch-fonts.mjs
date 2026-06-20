// Downloads the МОЗОЛЕУМ brand fonts (TTF) used for server-side PNG rendering.
// Run with: npm run fonts -w @mozoleum/server
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'fonts');
mkdirSync(OUT, { recursive: true });

const BASE = 'https://raw.githubusercontent.com/google/fonts/main';
const FILES = [
  ['ofl/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf', 'PlayfairDisplay.ttf'],
  ['ofl/playfairdisplay/PlayfairDisplay-Italic%5Bwght%5D.ttf', 'PlayfairDisplay-Italic.ttf'],
  ['ofl/spacegrotesk/SpaceGrotesk%5Bwght%5D.ttf', 'SpaceGrotesk.ttf'],
  ['ofl/spacemono/SpaceMono-Regular.ttf', 'SpaceMono-Regular.ttf'],
  ['ofl/spacemono/SpaceMono-Bold.ttf', 'SpaceMono-Bold.ttf'],
  ['ofl/spacemono/SpaceMono-Italic.ttf', 'SpaceMono-Italic.ttf'],
];

let ok = 0;
for (const [rel, name] of FILES) {
  const dest = join(OUT, name);
  if (existsSync(dest)) {
    console.log('· exists', name);
    ok++;
    continue;
  }
  try {
    const res = await fetch(`${BASE}/${rel}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(dest, buf);
    console.log('✓', name, (buf.length / 1024).toFixed(0) + 'kb');
    ok++;
  } catch (err) {
    console.error('✗ failed', name, '—', err.message);
  }
}
console.log(`\n${ok}/${FILES.length} fonts ready in ${OUT}`);
if (ok < FILES.length) process.exitCode = 1;
