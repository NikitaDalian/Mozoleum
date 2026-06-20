import type { CSSProperties } from 'react';
import { PREMIUM_STYLES } from '@mozoleum/engine';
import type { MozoleumStore } from '../state/useMozoleum';

const SWATCH_BG: Record<string, CSSProperties> = {
  foil: { background: 'linear-gradient(135deg,#3a2e0e,#c9a23a 45%,#5a4a14 60%,#e8c252)' },
  stained: { background: 'conic-gradient(from 20deg,#7a1420,#1a2e4a,#1f6b4a,#a8801f,#7a1420)' },
  neon: { background: 'radial-gradient(circle at 40% 40%,#102a3a,#0a0a16)', boxShadow: 'inset 0 0 26px rgba(80,200,255,.4)' },
  cyano: { background: 'linear-gradient(135deg,#0d2a5c,#1f4f9c)' },
  oldmaster: { background: 'radial-gradient(circle at 50% 40%,#3a2c1c,#120d08)' },
  pixel: { background: 'repeating-conic-gradient(#2a2418 0% 25%,#1a160e 0% 50%) 0/22px 22px' },
};
const swatchBase: CSSProperties = {
  height: 88,
  borderRadius: 6,
  border: '1px solid rgba(212,175,55,.12)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
};

export function Shop({ store }: { store: MozoleumStore }) {
  if (!store.shopOpen) return null;
  return (
    <div onClick={store.closeShop} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(8,7,6,.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#16130e', border: '1px solid rgba(212,175,55,.28)', borderRadius: 12, maxWidth: 760, width: '100%', maxHeight: '88vh', overflow: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 6 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: '#f3e7c8' }}>Лавка премиум-стилей</div>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: '#8a8170', letterSpacing: 1, marginTop: 4 }}>примерьте редкую огранку к своей мозоли</div>
          </div>
          <button onClick={store.closeShop} style={{ background: 'transparent', border: '1px solid rgba(212,175,55,.3)', color: '#d4af37', borderRadius: '50%', width: 36, height: 36, fontSize: 18, cursor: 'pointer', flex: 'none' }}>
            ✕
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0 20px', fontFamily: "'Space Mono',monospace", fontSize: 13, color: '#e3d4a4' }}>
          Баланс: <span style={{ color: '#d4af37', fontWeight: 700 }}>{store.balance} ₥</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 14 }}>
          {PREMIUM_STYLES.map((p) => {
            const owned = store.unlocks.includes(p.key);
            return (
              <div key={p.key} style={{ border: '1px solid rgba(212,175,55,.18)', borderRadius: 9, padding: 16, background: '#0f0d0a', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ ...swatchBase, ...(SWATCH_BG[p.key] || {}) }}>
                  {!owned && <span style={{ fontSize: 24, opacity: 0.85 }}>🔒</span>}
                  {owned && (
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, letterSpacing: 2, color: '#1a1208', background: '#d4af37', padding: '4px 10px', borderRadius: 999, fontWeight: 700 }}>ОТКРЫТО</span>
                  )}
                </div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 600, color: '#f3e7c8' }}>{p.label}</div>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10.5, color: '#8a8170', lineHeight: 1.5, minHeight: 28 }}>{p.hint}</div>
                <button
                  onClick={() => store.buy(p.key, p.price, p.label)}
                  style={{
                    border: 'none',
                    borderRadius: 6,
                    padding: 10,
                    cursor: owned ? 'default' : 'pointer',
                    fontFamily: "'Space Grotesk'",
                    fontSize: 12.5,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    background: owned ? 'rgba(212,175,55,.12)' : 'linear-gradient(180deg,#e8c252,#caa23d)',
                    color: owned ? '#8a8170' : '#1a1208',
                  }}
                >
                  {owned ? 'В коллекции' : 'Купить · ' + p.price + ' ₥'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
