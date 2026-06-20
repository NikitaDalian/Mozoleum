import { buildExportSVG, type Callus } from '@mozoleum/engine';
import { callusImageUrl } from './api';

/**
 * Get the best available PNG for a callus card:
 *  1. the server renderer (pixel-perfect brand fonts), if reachable;
 *  2. otherwise the in-browser canvas fallback (system serif/sans).
 * This keeps downloads working offline / on a static host while giving
 * pixel-perfect fonts whenever the API is available.
 */
export async function getCardBlob(callus: Callus, styleKey: string, signature: string): Promise<Blob> {
  try {
    const res = await fetch(callusImageUrl(callus.originId, callus.seed, styleKey, signature));
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('image/png')) {
      const blob = await res.blob();
      if (blob.size > 1000) return blob;
    }
  } catch {
    /* server unreachable — fall back to client render */
  }
  return cardBlob(callus, styleKey, signature);
}

/**
 * Render the export-card SVG to a PNG Blob in the browser (canvas). Fonts fall
 * back to the system serif/sans inside the rasterized SVG (same caveat as the
 * original prototype); on-screen everything uses the brand webfonts.
 */
export function cardBlob(callus: Callus, styleKey: string, signature: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const svg = buildExportSVG(callus, styleKey, signature);
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement('canvas');
      cv.width = 1080;
      cv.height = 1350;
      const ctx = cv.getContext('2d')!;
      ctx.fillStyle = '#100f0d';
      ctx.fillRect(0, 0, 1080, 1350);
      ctx.drawImage(img, 0, 0, 1080, 1350);
      cv.toBlob((b) => {
        URL.revokeObjectURL(url);
        if (b) resolve(b);
        else reject(new Error('toBlob failed'));
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image load failed'));
    };
    img.src = url;
  });
}

export function fileSafeName(folk: string): string {
  return 'mozoleum_' + (folk || 'mozol').replace(/[^a-zа-я0-9]+/gi, '_').toLowerCase();
}
