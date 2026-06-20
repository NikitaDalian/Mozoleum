import { ORIGINS, FREE_STYLES, rollSeed, type StyleKey } from '@mozoleum/engine';

const VALID_ORIGINS = new Set(ORIGINS.map((o) => o.id));
const VALID_STYLES = new Set(FREE_STYLES.map((s) => s.key));
const MAX_U32 = 0xffffffff;

export interface ParsedCallusParams {
  origin: number;
  seed: number;
  style: StyleKey;
  signature?: string;
}

function toInt(v: unknown): number | null {
  if (Array.isArray(v)) v = v[0];
  if (typeof v !== 'string' && typeof v !== 'number') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

/**
 * Parse query params for an image request. Missing/invalid values are filled
 * with sensible random/default choices so a bare `GET /api/callus.png` still
 * returns a valid random callus.
 */
export function parseCallusParams(query: Record<string, unknown>): ParsedCallusParams {
  // origin
  let origin = toInt(query.origin ?? query.o);
  if (origin == null || !VALID_ORIGINS.has(origin)) {
    origin = ORIGINS[Math.floor(Math.random() * ORIGINS.length)].id;
  }

  // seed (uint32)
  let seed = toInt(query.seed ?? query.s);
  if (seed == null) seed = rollSeed();
  seed = ((seed % (MAX_U32 + 1)) + (MAX_U32 + 1)) % (MAX_U32 + 1); // normalize to u32

  // style
  let styleRaw = query.style ?? query.sy;
  if (Array.isArray(styleRaw)) styleRaw = styleRaw[0];
  const style = (typeof styleRaw === 'string' && VALID_STYLES.has(styleRaw as StyleKey)
    ? styleRaw
    : 'heraldry') as StyleKey;

  // signature
  let sig = query.signature ?? query.sig;
  if (Array.isArray(sig)) sig = sig[0];
  const signature = typeof sig === 'string' ? sig.slice(0, 60) : undefined;

  return { origin, seed, style, signature };
}
