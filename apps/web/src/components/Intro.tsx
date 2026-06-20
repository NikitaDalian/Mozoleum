import { useMemo, type CSSProperties } from 'react';
import { renderMonogram } from '@mozoleum/engine';
import { ease } from '../lib/anim';
import { valanceSVG } from '../lib/decor';
import { RawSvg } from './RawSvg';
import { FxButton } from './FxButton';
import type { MozoleumStore } from '../state/useMozoleum';

const velvet = 'linear-gradient(180deg,#3a070b 0%,#72111b 20%,#5c0e16 52%,#7a1420 76%,#33060a 100%)';
const folds =
  'repeating-linear-gradient(90deg, rgba(15,2,4,.72) 0px, rgba(15,2,4,0) 17px, rgba(247,228,168,.11) 31px, rgba(15,2,4,0) 45px, rgba(15,2,4,.72) 60px)';
const sheen = 'radial-gradient(130% 55% at 50% 6%, rgba(255,232,194,.12), rgba(255,232,194,0) 58%)';

export function Intro({ store }: { store: MozoleumStore }) {
  const ip = store.introProgress;
  const e = ease(ip);
  const valance = useMemo(() => valanceSVG(), []);
  const mono = useMemo(() => renderMonogram('introm'), []);

  const curtainBase: CSSProperties = {
    position: 'absolute',
    top: 0,
    height: '100%',
    width: '53%',
    backgroundImage: [sheen, folds, velvet].join(', '),
    boxShadow: 'inset 0 -60px 80px rgba(0,0,0,.5)',
    zIndex: 20,
  };
  const curtainLeft: CSSProperties = {
    ...curtainBase,
    left: 0,
    borderRight: '5px solid #caa23d',
    transform: `translateX(${(-e * 103).toFixed(2)}%)`,
  };
  const curtainRight: CSSProperties = {
    ...curtainBase,
    right: 0,
    borderLeft: '5px solid #caa23d',
    transform: `translateX(${(e * 103).toFixed(2)}%)`,
  };
  const mp = Math.max(0, Math.min(1, (ip - 0.5) / 0.45));
  const introMenuStyle: CSSProperties = {
    display: 'flex',
    gap: 16,
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 38,
    opacity: mp,
    transform: `translateY(${((1 - mp) * 18).toFixed(1)}px)`,
    pointerEvents: mp > 0.5 ? 'auto' : 'none',
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        background:
          'repeating-linear-gradient(45deg, rgba(247,228,168,.016) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(0,0,0,.05) 0 1px, transparent 1px 6px), radial-gradient(1000px 620px at 50% 38%, #241a14 0%, #110d0a 62%, #0a0807 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '40px 24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 18,
          }}
        >
          <div style={{ width: 64, height: 64, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.6))' }}>
            <RawSvg html={mono} style={{ width: '100%', height: '100%' }} />
          </div>
        </div>
        <div
          style={{
            fontFamily: "'Space Mono',monospace",
            fontSize: 12,
            letterSpacing: 6,
            color: '#caa23d',
            textTransform: 'uppercase',
            marginBottom: 18,
          }}
        >
          Аукционный дом · с MMXXV
        </div>
        <div
          style={{
            fontFamily: "'Playfair Display',serif",
            fontWeight: 800,
            fontSize: 'clamp(54px,11vw,124px)',
            letterSpacing: 6,
            lineHeight: 0.96,
            color: '#f3e7c8',
            textShadow: '0 6px 40px rgba(212,175,55,.25)',
          }}
        >
          МОЗОЛЕУМ
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, margin: '14px auto 0', maxWidth: 520 }}>
          <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,#caa23d)' }} />
          <span style={{ color: '#caa23d', fontSize: 14 }}>✦</span>
          <span style={{ flex: 1, height: 1, background: 'linear-gradient(270deg,transparent,#caa23d)' }} />
        </div>
        <div
          style={{
            fontFamily: "'Playfair Display',serif",
            fontStyle: 'italic',
            fontSize: 'clamp(16px,2.4vw,22px)',
            color: '#cdc3aa',
            marginTop: 14,
          }}
        >
          Генератор почётных мозолей · торги открыты
        </div>
        <div style={introMenuStyle}>
          <FxButton
            onClick={store.gotoGenerator}
            base={{
              background: 'linear-gradient(180deg,#f6dc7e 0%,#e8c252 46%,#c89c36 100%)',
              color: '#1a1208',
              border: '1px solid #b8902f',
              borderRadius: 11,
              padding: '18px 34px',
              fontFamily: "'Space Grotesk'",
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 2,
              cursor: 'pointer',
              boxShadow:
                '0 14px 34px rgba(212,175,55,.32), inset 0 1px 0 rgba(255,250,228,.75), inset 0 -3px 7px rgba(120,86,16,.4)',
              textTransform: 'uppercase',
              transition: 'transform .12s cubic-bezier(.3,.7,.3,1), box-shadow .16s ease, filter .16s ease',
            }}
            hover={{
              filter: 'brightness(1.05)',
              transform: 'translateY(-2px)',
              boxShadow: '0 20px 42px rgba(212,175,55,.46), inset 0 1px 0 rgba(255,250,228,.75)',
            }}
            active={{
              transform: 'translateY(2px) scale(.99)',
              boxShadow: '0 6px 16px rgba(212,175,55,.3), inset 0 3px 8px rgba(120,86,16,.55)',
            }}
          >
            Войти в генерацию
          </FxButton>
          <FxButton
            onClick={store.gotoHall}
            base={{
              background: 'linear-gradient(180deg,rgba(212,175,55,.08),rgba(212,175,55,.02))',
              color: '#e8d9b4',
              border: '1.5px solid #caa23d',
              borderRadius: 11,
              padding: '18px 34px',
              fontFamily: "'Space Grotesk'",
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: 2,
              cursor: 'pointer',
              textTransform: 'uppercase',
              transition: 'transform .12s cubic-bezier(.3,.7,.3,1), background .15s ease',
            }}
            hover={{
              background: 'linear-gradient(180deg,rgba(212,175,55,.2),rgba(212,175,55,.07))',
              transform: 'translateY(-2px)',
            }}
            active={{ transform: 'translateY(1px) scale(.99)' }}
          >
            Аукционный зал
          </FxButton>
        </div>
      </div>

      {/* Valance */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 24 }}>
        <RawSvg html={valance} />
      </div>
      {/* Curtains */}
      <div style={curtainLeft} />
      <div style={curtainRight} />
      {/* Skip */}
      <button
        onClick={store.skipIntro}
        style={{
          position: 'absolute',
          right: 18,
          bottom: 16,
          zIndex: 30,
          background: 'transparent',
          border: '1px solid rgba(212,175,55,.3)',
          color: '#9a9078',
          borderRadius: 999,
          padding: '8px 16px',
          fontFamily: "'Space Mono',monospace",
          fontSize: 11,
          letterSpacing: 1,
          cursor: 'pointer',
        }}
      >
        раздвинуть занавес ▸
      </button>
    </div>
  );
}
