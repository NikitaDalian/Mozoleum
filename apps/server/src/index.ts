import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import compression from 'compression';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildCallus } from '@mozoleum/engine';
import { renderCallusPng, svgToPng } from './render.js';
import { parseCallusParams } from './params.js';
import { generateMotto, mottoEnrichmentEnabled } from './motto.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8787;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const app = express();
app.use(compression()); // gzip/deflate responses (HTML/JS/CSS/JSON) for faster loads
app.use(express.json({ limit: '64kb' }));
app.use(
  cors({
    origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map((s) => s.trim()),
  }),
);

// ── Helpers ────────────────────────────────────────────────────────────────
function publicBase(req: Request): string {
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}
function calculateCacheHeaders(res: Response) {
  // Deterministic by (origin, seed, style) — safe to cache hard.
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
}

// ── Health ───────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mottoApi: mottoEnrichmentEnabled(), ts: Date.now() });
});

// ── Image: deterministic callus PNG ────────────────────────────────────────
// GET /api/callus.png?origin=18&seed=12345&style=heraldry&signature=...&width=1080&download=1
app.get('/api/callus.png', (req, res) => {
  try {
    const params = parseCallusParams(req.query as Record<string, unknown>);
    const width = Math.max(256, Math.min(2160, Number(req.query.width) || 1080));
    const { png } = renderCallusPng(params, width);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('X-Callus-Origin', String(params.origin));
    res.setHeader('X-Callus-Seed', String(params.seed));
    res.setHeader('X-Callus-Style', params.style);
    if (req.query.seed != null) calculateCacheHeaders(res);
    if (req.query.download != null) {
      res.setHeader('Content-Disposition', `attachment; filename="mozoleum_${params.origin}_${params.seed}.png"`);
    }
    res.send(png);
  } catch (err) {
    console.error('[callus.png] render failed:', err);
    res.status(500).json({ error: 'render_failed' });
  }
});

// ── Metadata: callus JSON (name, rarity, links) ────────────────────────────
// GET /api/callus.json?origin=18&seed=12345&style=heraldry
app.get('/api/callus.json', (req, res) => {
  const params = parseCallusParams(req.query as Record<string, unknown>);
  const c = buildCallus({ originId: params.origin, seed: params.seed });
  const base = publicBase(req);
  const q = `origin=${params.origin}&seed=${params.seed}&style=${params.style}`;
  res.json({
    origin: params.origin,
    seed: params.seed,
    style: params.style,
    activity: c.name.act,
    folk: c.name.folk,
    latin: c.name.latin,
    location: c.loc,
    stage: c.stage,
    degree: c.name.degree,
    year: c.name.year,
    motto: c.name.motto,
    rarity: { key: c.rarity.key, label: c.rarity.label, stars: c.rarity.stars, color: c.rarity.color },
    cert: { key: c.cert.key, title: c.cert.title },
    lotNo: String(c.originId).padStart(2, '0') + '-' + ((c.seed % 9000) + 1000),
    imageUrl: `${base}/api/callus.png?${q}`,
    shareUrl: `${base}/#o=${params.origin}&s=${params.seed}&sy=${params.style}`,
  });
});

// ── Motto enrichment proxy (key stays server-side) ─────────────────────────
// POST /api/motto { folk: "Перст Гончара" } -> { motto: "..." | null }
app.post('/api/motto', async (req, res) => {
  const folk = typeof req.body?.folk === 'string' ? req.body.folk.slice(0, 80) : '';
  if (!folk) {
    res.status(400).json({ error: 'missing_folk' });
    return;
  }
  if (!mottoEnrichmentEnabled()) {
    res.json({ motto: null, enabled: false });
    return;
  }
  const motto = await generateMotto(folk);
  res.json({ motto, enabled: true });
});

// ── Static frontend (single-deploy option) ─────────────────────────────────
const WEB_DIST = join(__dirname, '..', '..', 'web', 'dist');
if (existsSync(WEB_DIST)) {
  app.use(express.static(WEB_DIST));
  // SPA fallback for any non-API route.
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(join(WEB_DIST, 'index.html'));
  });
  console.log('[server] serving web app from', WEB_DIST);
} else {
  app.get('/', (_req, res) => {
    res.type('text/plain').send(
      'МОЗОЛЕУМ API\n\n' +
        'GET  /api/health\n' +
        'GET  /api/callus.png?origin=&seed=&style=&signature=&width=&download=\n' +
        'GET  /api/callus.json?origin=&seed=&style=\n' +
        'POST /api/motto { folk }\n\n' +
        '(build the web app with `npm run build` to serve it here too)',
    );
  });
}

app.listen(PORT, () => {
  console.log(`[server] МОЗОЛЕУМ API on http://localhost:${PORT}`);
  console.log(`[server] CORS origin: ${CORS_ORIGIN}`);
  console.log(`[server] motto enrichment: ${mottoEnrichmentEnabled() ? 'ON' : 'off (curated bank)'}`);
});

export { svgToPng };
