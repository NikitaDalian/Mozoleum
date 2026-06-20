import { Resvg } from '@resvg/resvg-js';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  buildCallus,
  buildExportSVG,
  type Callus,
  type StyleKey,
} from '@mozoleum/engine';

const __dirname = dirname(fileURLToPath(import.meta.url));
// fonts live at apps/server/fonts (one level up from dist/ or src/)
const FONTS_DIR = join(__dirname, '..', 'fonts');

let FONT_FILES: string[] = [];
try {
  FONT_FILES = readdirSync(FONTS_DIR)
    .filter((f) => /\.(ttf|otf)$/i.test(f))
    .map((f) => join(FONTS_DIR, f));
} catch {
  FONT_FILES = [];
}

if (FONT_FILES.length === 0) {
  console.warn(
    '[render] no font files found in',
    FONTS_DIR,
    '— PNG text will fall back to system fonts (or be missing). Run `npm run fonts -w @mozoleum/server`.',
  );
}

/**
 * The export SVG requests Georgia/Helvetica fallbacks (which look right in a
 * browser). On the server we only ship the brand fonts, so remap those stacks
 * to the loaded families for a faithful render.
 */
function normalizeFonts(svg: string): string {
  return svg
    .replace(/Georgia,'Times New Roman',serif/g, 'Playfair Display')
    .replace(/Georgia,serif/g, 'Playfair Display')
    .replace(/Helvetica,Arial,sans-serif/g, 'Space Grotesk');
}

export type RenderFormat = 'png';

export interface RenderOptions {
  width?: number;
}

/** Rasterize an export-card SVG string to a PNG buffer. */
export function svgToPng(svg: string, opts: RenderOptions = {}): Buffer {
  const width = opts.width ?? 1080;
  const resvg = new Resvg(normalizeFonts(svg), {
    fitTo: { mode: 'width', value: width },
    font: {
      fontFiles: FONT_FILES,
      loadSystemFonts: FONT_FILES.length === 0,
      defaultFontFamily: 'Playfair Display',
    },
    background: '#100f0d',
  });
  return Buffer.from(resvg.render().asPng());
}

export interface CallusRequest {
  origin: number;
  seed: number;
  style: StyleKey;
  signature?: string;
}

/** Build the deterministic callus + its export-card PNG. */
export function renderCallusPng(req: CallusRequest, width?: number): { png: Buffer; callus: Callus } {
  const callus = buildCallus({ originId: req.origin, seed: req.seed });
  const svg = buildExportSVG(callus, req.style, req.signature);
  const png = svgToPng(svg, { width });
  return { png, callus };
}
