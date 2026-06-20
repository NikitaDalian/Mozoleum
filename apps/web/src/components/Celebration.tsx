import type { CSSProperties } from 'react';
import { back } from '../lib/anim';
import type { MozoleumStore } from '../state/useMozoleum';

export function Celebration({ store }: { store: MozoleumStore }) {
  const cel = store.celebrate;
  if (!cel) return null;
  const c = store.callus;
  const cp = store.celebrateProgress;
  const inP = Math.min(1, cp / 0.42);
  const out = cp > 0.82 ? Math.max(0, (1 - cp) / 0.18) : 1;
  const scl = 0.55 + back(inP) * 0.55;

  const overlay: CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 80,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    cursor: 'pointer',
    background: `radial-gradient(circle at 50% 46%, ${cel.color}26, rgba(8,7,6,.88))`,
    opacity: out,
  };
  const ray: CSSProperties = {
    position: 'absolute',
    width: '170vmax',
    height: '170vmax',
    borderRadius: '50%',
    background: 'repeating-conic-gradient(from 0deg, rgba(232,194,82,0) 0deg, rgba(232,194,82,.16) 2.4deg, rgba(232,194,82,0) 5.6deg)',
    transform: `rotate(${(cp * 130).toFixed(1)}deg)`,
    opacity: 0.85 * out,
    WebkitMaskImage: 'radial-gradient(circle, #000 0%, #000 34%, transparent 62%)',
    maskImage: 'radial-gradient(circle, #000 0%, #000 34%, transparent 62%)',
  };
  const block: CSSProperties = { transform: `scale(${scl.toFixed(3)})`, opacity: out };

  return (
    <div onClick={store.dismissCelebrate} style={overlay}>
      <div style={ray} />
      <div style={{ position: 'relative', textAlign: 'center', ...block }}>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 13, letterSpacing: 6, color: '#f3e7c8', textTransform: 'uppercase', opacity: 0.85, marginBottom: 10 }}>
          {c ? '★'.repeat(c.rarity.stars) : ''}
        </div>
        <div
          style={{
            fontFamily: "'Playfair Display',serif",
            fontWeight: 800,
            fontSize: 'clamp(40px,8vw,92px)',
            lineHeight: 1,
            letterSpacing: 1,
            color: cel.color,
            textShadow: '0 0 30px rgba(0,0,0,.6),0 4px 0 rgba(0,0,0,.35)',
          }}
        >
          {cel.cheer}
        </div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontStyle: 'italic', fontSize: 'clamp(18px,3vw,28px)', color: '#f3e7c8', marginTop: 14 }}>
          {c ? `«${c.name.folk}» · ${c.rarity.label}` : ''}
        </div>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, letterSpacing: 2, color: '#cdc3aa', textTransform: 'uppercase', marginTop: 18, opacity: 0.7 }}>
          нажмите, чтобы продолжить
        </div>
      </div>
    </div>
  );
}
