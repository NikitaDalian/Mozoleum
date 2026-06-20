import { useMemo } from 'react';
import { buildCallus, fullArtSVG, fullFrameSVG } from '@mozoleum/engine';
import { RawSvg } from './RawSvg';
import { FxButton } from './FxButton';
import type { MozoleumStore } from '../state/useMozoleum';

export function Hall({ store }: { store: MozoleumStore }) {
  const lots = useMemo(
    () =>
      store.collection.map((lot, i) => {
        const cc = buildCallus({ originId: lot.o, seed: lot.s });
        const r = cc.rarity;
        return {
          lot,
          folk: lot.folk,
          rl: lot.rl,
          stars: '★'.repeat(lot.stars),
          color: r.color,
          border: r.color + '55',
          art: fullArtSVG(cc, lot.sy || 'heraldry', 'thumb' + i),
          frame: fullFrameSVG(r.key, 'tfr' + i),
        };
      }),
    [store.collection],
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'repeating-linear-gradient(45deg, rgba(247,228,168,.014) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(0,0,0,.045) 0 1px, transparent 1px 6px), radial-gradient(1200px 700px at 50% -10%, #1c1812 0%, #100f0d 62%)',
        padding: '0 0 64px',
      }}
    >
      <header style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderBottom: '1px solid rgba(212,175,55,.16)' }}>
        <FxButton
          onClick={store.gotoIntro}
          base={{ background: 'transparent', border: '1px solid rgba(212,175,55,.3)', color: '#e3d4a4', borderRadius: 999, padding: '9px 16px', fontFamily: "'Space Grotesk'", fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background .15s ease' }}
          hover={{ background: 'rgba(212,175,55,.08)' }}
        >
          ‹ Меню
        </FxButton>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, letterSpacing: 3, color: '#f3e7c8' }}>Аукционный зал</div>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: 2, color: '#8a8170', textTransform: 'uppercase' }}>
            ваша коллекция · {store.collection.length} лотов
          </div>
        </div>
        <FxButton
          onClick={store.gotoGenerator}
          base={{ background: 'linear-gradient(180deg,#e8c252,#caa23d)', color: '#1a1208', border: 'none', borderRadius: 999, padding: '9px 16px', fontFamily: "'Space Grotesk'", fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'filter .15s ease, transform .12s ease' }}
          hover={{ filter: 'brightness(1.06)', transform: 'translateY(-1px)' }}
        >
          К генерации
        </FxButton>
      </header>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 28 }}>
        {store.collection.length === 0 && (
          <div style={{ textAlign: 'center', padding: '90px 20px', color: '#8a8170' }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontStyle: 'italic', fontSize: 24, color: '#cdc3aa' }}>Зал пока пуст</div>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, marginTop: 10 }}>сгенерируйте мозоли — и они займут места на торгах</div>
            <FxButton
              onClick={store.gotoGenerator}
              base={{ marginTop: 24, background: 'linear-gradient(180deg,#e8c252,#caa23d)', color: '#1a1208', border: 'none', borderRadius: 9, padding: '14px 28px', fontFamily: "'Space Grotesk'", fontSize: 14, fontWeight: 700, letterSpacing: 1, cursor: 'pointer', textTransform: 'uppercase', transition: 'filter .15s ease, transform .12s ease' }}
              hover={{ filter: 'brightness(1.06)', transform: 'translateY(-2px)' }}
            >
              Начать коллекцию
            </FxButton>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 18 }}>
          {lots.map((l) => (
            <div
              key={l.lot.k}
              onClick={() => store.loadLot(l.lot)}
              style={{ background: 'linear-gradient(165deg,#1b1710,#141009)', border: '1px solid ' + l.border, borderRadius: 8, padding: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8, transition: 'transform .14s ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <div style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 4, overflow: 'hidden', background: '#0d0c0a' }}>
                <RawSvg html={l.art} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
                <RawSvg html={l.frame} style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }} />
              </div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 600, color: '#f3e7c8', lineHeight: 1.2, textAlign: 'center' }}>«{l.folk}»</div>
              <div style={{ textAlign: 'center', fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: 1, color: l.color, textTransform: 'uppercase' }}>
                {l.rl} {l.stars}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
