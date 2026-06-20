import type { CSSProperties } from 'react';

/** Injects a trusted, engine-generated SVG string (mirrors dangerouslySetInnerHTML usage in the prototype). */
export function RawSvg({ html, style, className }: { html: string; style?: CSSProperties; className?: string }) {
  return <div className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />;
}
