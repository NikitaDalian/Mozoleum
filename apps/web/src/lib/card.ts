import { buildExportSVG, type Callus } from '@mozoleum/engine';

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
