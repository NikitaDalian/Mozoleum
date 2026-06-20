#!/usr/bin/env node
// МОЗОЛЕУМ CLI — deterministic callus PNG generator for bots / scripts.
// Usage:
//   node dist/cli.js --origin 18 --seed 12345 --style heraldry --out callus.png
//   node dist/cli.js                       (fully random)
//   node dist/cli.js --json                (print metadata instead of writing PNG)
import { writeFileSync } from 'node:fs';
import { buildCallus } from '@mozoleum/engine';
import { renderCallusPng } from './render.js';
import { parseCallusParams } from './params.js';

function parseArgv(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        out[key] = next;
        i++;
      } else {
        out[key] = true;
      }
    }
  }
  return out;
}

const args = parseArgv(process.argv.slice(2));
const params = parseCallusParams({
  origin: args.origin,
  seed: args.seed,
  style: args.style,
  signature: args.signature,
});

if (args.json) {
  const c = buildCallus({ originId: params.origin, seed: params.seed });
  console.log(
    JSON.stringify(
      {
        origin: params.origin,
        seed: params.seed,
        style: params.style,
        folk: c.name.folk,
        latin: c.name.latin,
        rarity: c.rarity.label,
        stars: c.rarity.stars,
        cert: c.cert.title,
        stage: c.stage,
        motto: c.name.motto,
      },
      null,
      2,
    ),
  );
} else {
  const width = args.width ? Number(args.width) : 1080;
  const { png, callus } = renderCallusPng(params, width);
  const out = typeof args.out === 'string' ? args.out : `mozoleum_${params.origin}_${params.seed}.png`;
  writeFileSync(out, png);
  console.error(
    `✓ ${out} — «${callus.name.folk}» (${callus.rarity.label} ★${callus.rarity.stars}) ` +
      `[origin=${params.origin} seed=${params.seed} style=${params.style}]`,
  );
}
