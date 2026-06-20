import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { renderMonogram, originsByCategory, FREE_STYLES } from '@mozoleum/engine';
import { perimXY } from '../lib/anim';
import { RawSvg } from './RawSvg';
import { FxButton } from './FxButton';
import { SignatureInput } from './SignatureInput';
import type { MozoleumStore } from '../state/useMozoleum';

interface FxSpec {
  n: number;
  g: string;
  ga: number;
  gsz: number;
  rim: string;
  ra: [number, number];
  rb: [number, number];
  oc: string;
  oa: [number, number];
  ob: [number, number];
  gold?: boolean;
}
const FX: Record<string, FxSpec> = {
  common:    { n: 1, g: '212,200,164', ga: 0.40, gsz: 150, rim: '206,192,156', ra: [0.10, 0.20], rb: [10, 18], oc: '184,168,132', oa: [0.08, 0.16], ob: [14, 26] },
  uncommon:  { n: 2, g: '150,228,188', ga: 0.46, gsz: 150, rim: '95,174,134',  ra: [0.14, 0.26], rb: [12, 22], oc: '79,154,120',  oa: [0.14, 0.26], ob: [18, 36] },
  heroic:    { n: 2, g: '170,206,250', ga: 0.52, gsz: 160, rim: '111,155,216', ra: [0.16, 0.30], rb: [14, 26], oc: '90,131,194',  oa: [0.18, 0.32], ob: [22, 44] },
  legendary: { n: 3, g: '255,235,170', ga: 0.66, gsz: 175, rim: '232,194,82',  ra: [0.22, 0.40], rb: [16, 32], oc: '232,194,82',  oa: [0.26, 0.50], ob: [30, 66], gold: true },
  mythic:    { n: 3, g: '226,158,248', ga: 0.64, gsz: 175, rim: 'flame',       ra: [0.30, 0.52], rb: [18, 34], oc: '192,106,214', oa: [0.32, 0.58], ob: [32, 70] },
};

const mono = '₥'; // ₥

export function Generator({ store }: { store: MozoleumStore }) {
  const { callus, config, generating, genProgress, fxPhase, revealFx } = store;
  const monogramHtml = useMemo(() => renderMonogram('hdrm'), []);
  const originGroups = useMemo(() => originsByCategory(), []);

  // Track a narrow (stacked) layout so the generation overlay can go full-screen
  // on phones — otherwise the "Лепка мозоли" animation plays off-screen.
  const [isNarrow, setIsNarrow] = useState(() => typeof window !== 'undefined' && window.innerWidth < 900);
  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const hasCallus = !!callus;
  const r = callus?.rarity;
  const rarityLabel = r ? r.label : 'экспонат';
  const rarityColor = r ? r.color : '#8a8170';
  const starsLit = r ? '★'.repeat(r.stars) : '';
  const starsDim = r ? '★'.repeat(5 - r.stars) : '★★★★★';

  // ── Per-frame FX (mirrors the prototype's renderVals tail) ─────────────────
  const fx = useMemo(() => {
    const defaultCase: CSSProperties = {
      position: 'relative',
      containerType: 'inline-size',
      background: 'linear-gradient(160deg,#211b15,#16120d)',
      padding: 22,
      borderRadius: 6,
      border: '1px solid rgba(212,175,55,.14)',
      boxShadow: '0 26px 60px rgba(0,0,0,.55)',
    };
    if (!callus) {
      return {
        caseStyle: defaultCase,
        fxStyle: { display: 'none' } as CSSProperties,
        nameplateStyle: { display: 'none' } as CSSProperties,
        sealWrapStyle: { display: 'none' } as CSSProperties,
        locUpper: '',
      };
    }
    const fxP = fxPhase;
    const rv = revealFx;
    const pulse = 0.5 + 0.5 * Math.sin(fxP * 6.283);
    const F = FX[callus.rarity.key] || FX.common;
    const obN = F.ob[0] + (F.ob[1] - F.ob[0]) * pulse;
    const oaN = F.oa[0] + (F.oa[1] - F.oa[0]) * pulse;
    const ob = obN.toFixed(0);
    const oa = oaN.toFixed(2);
    const glow = `0 0 ${ob}px rgba(${F.oc},${oa}), 0 0 ${Number(ob) * 2}px rgba(${F.oc},${(Number(oa) * 0.45).toFixed(2)}), 0 26px 60px rgba(0,0,0,.55)`;

    const glints: string[] = [];
    for (let i = 0; i < F.n; i++) {
      const [gx, gy] = perimXY(fxP + i / F.n);
      const bright = (F.ga * (0.7 + 0.3 * Math.sin((fxP + i / F.n) * 12.566))).toFixed(2);
      glints.push(`radial-gradient(circle ${F.gsz}px at ${gx.toFixed(1)}% ${gy.toFixed(1)}%, rgba(${F.g},${bright}), rgba(${F.g},0) 62%)`);
    }
    if (F.gold) {
      const [lx, ly] = perimXY(fxP + 0.5);
      glints.push(`radial-gradient(circle 90px at ${lx.toFixed(1)}% ${ly.toFixed(1)}%, rgba(255,250,224,.55), rgba(255,250,224,0) 60%)`);
    }

    let innerShadow: string;
    if (F.rim === 'flame') {
      const f2 = 0.5 + 0.5 * Math.sin(fxP * 6.283 * 2.7 + 1.3);
      innerShadow = `inset 0 0 ${(18 + 16 * f2).toFixed(0)}px rgba(255,132,48,${(0.34 + 0.3 * f2).toFixed(2)}), inset 0 0 ${(34 + 22 * pulse).toFixed(0)}px rgba(180,92,216,${(0.4 + 0.26 * pulse).toFixed(2)})`;
    } else {
      const rb = (F.rb[0] + (F.rb[1] - F.rb[0]) * pulse).toFixed(0);
      const ra = (F.ra[0] + (F.ra[1] - F.ra[0]) * pulse).toFixed(2);
      innerShadow = `inset 0 0 ${rb}px rgba(${F.rim},${ra})`;
    }

    const fxStyle: CSSProperties = {
      position: 'absolute',
      inset: 0,
      zIndex: 5,
      pointerEvents: 'none',
      borderRadius: 3,
      background: glints.join(','),
      boxShadow: innerShadow,
      mixBlendMode: 'screen',
    };
    const caseStyle: CSSProperties = {
      position: 'relative',
      containerType: 'inline-size',
      background: 'linear-gradient(160deg,#211b15,#16120d)',
      padding: 22,
      borderRadius: 6,
      border: '1px solid rgba(212,175,55,.14)',
      boxShadow: glow,
      transform: `scale(${(1 + rv * 0.11).toFixed(3)})`,
      transformOrigin: 'center 42%',
    };
    const nameplateStyle: CSSProperties = {
      position: 'absolute',
      left: '50%',
      bottom: '3.6%',
      transform: 'translateX(-50%)',
      zIndex: 4,
      display: 'flex',
      alignItems: 'center',
      gap: 'clamp(5px,1.6cqw,9px)',
      background: 'linear-gradient(180deg,#2c2215,#17100a)',
      border: '1px solid rgba(212,175,55,.5)',
      borderRadius: 5,
      padding: 'clamp(3px,1cqw,5px) clamp(8px,3.6cqw,16px)',
      boxShadow: '0 5px 16px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,236,180,.22), inset 0 -1px 0 rgba(0,0,0,.45)',
      whiteSpace: 'nowrap',
      maxWidth: '90%',
    };
    const sealWrapStyle: CSSProperties = {
      position: 'absolute',
      right: '1.4%',
      bottom: '1.4%',
      width: 'min(104px, 21cqw)',
      height: 'min(104px, 21cqw)',
      zIndex: 7,
      filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.6))',
      opacity: generating ? 0 : 1,
      visibility: generating ? 'hidden' : 'visible',
    };
    return { caseStyle, fxStyle, nameplateStyle, sealWrapStyle, locUpper: (callus.loc || '').toUpperCase() };
  }, [callus, fxPhase, revealFx, generating]);

  // On phones the showcase is above the controls; promote the generation
  // overlay to full-screen so the "лепка" spectacle is centred on screen.
  const genStyle: CSSProperties = {
    position: isNarrow ? 'fixed' : 'absolute',
    inset: 0,
    zIndex: isNarrow ? 75 : 6,
    background: isNarrow ? 'rgba(10,9,7,.96)' : 'rgba(13,12,10,.92)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
    opacity: generating ? 1 : 0,
    pointerEvents: generating ? 'auto' : 'none',
    visibility: generating ? 'visible' : 'hidden',
  };
  const genSpin: CSSProperties = { transformOrigin: '60px 60px', transform: `rotate(${(genProgress * 720).toFixed(1)}deg)` };
  const genBar: CSSProperties = { width: `${(genProgress * 100).toFixed(1)}%`, height: '100%', background: 'linear-gradient(90deg,#caa23d,#e8c252)', borderRadius: 2 };

  const lotNo = callus ? String(callus.originId).padStart(2, '0') + '-' + ((callus.seed % 9000) + 1000) : '';

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'repeating-linear-gradient(45deg, rgba(247,228,168,.014) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(0,0,0,.045) 0 1px, transparent 1px 6px), radial-gradient(1200px 700px at 50% -10%, #1c1812 0%, #100f0d 60%)',
        padding: '0 0 64px',
      }}
    >
      {/* HEADER */}
      <header
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '20px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 18,
          flexWrap: 'wrap',
          borderBottom: '1px solid rgba(212,175,55,.16)',
        }}
      >
        <div onClick={store.gotoIntro} style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
          <div style={{ width: 44, height: 44, filter: 'drop-shadow(0 2px 5px rgba(0,0,0,.5))' }}>
            <RawSvg html={monogramHtml} style={{ width: '100%', height: '100%' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 23, fontWeight: 700, letterSpacing: 5, color: '#f3e7c8', lineHeight: 1 }}>
              МОЗОЛЕУМ
            </div>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: 2, color: '#8a8170', textTransform: 'uppercase' }}>
              сгенерировано: {store.count}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <FxButton
            onClick={store.gotoHall}
            base={{ background: 'transparent', border: '1px solid rgba(212,175,55,.3)', color: '#e3d4a4', borderRadius: 999, padding: '9px 15px', fontFamily: "'Space Grotesk'", fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background .15s ease' }}
            hover={{ background: 'rgba(212,175,55,.08)' }}
          >
            Зал
          </FxButton>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1b1711', border: '1px solid rgba(212,175,55,.35)', borderRadius: 999, padding: '9px 15px' }}>
            <span style={{ color: '#d4af37', fontSize: 15 }}>{mono}</span>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 14, color: '#f3e7c8', fontWeight: 700 }}>{store.balance}</span>
          </div>
          <FxButton
            onClick={store.openShop}
            base={{ background: 'transparent', border: '1px solid rgba(212,175,55,.35)', color: '#d4af37', borderRadius: 999, padding: '9px 15px', fontFamily: "'Space Grotesk'", fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background .15s ease' }}
            hover={{ background: 'rgba(212,175,55,.1)' }}
          >
            Магазин
          </FxButton>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 28, display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* SHOWCASE */}
        <section id="mz-showcase" style={{ flex: '1 1 460px', minWidth: 320, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, minHeight: 24 }}>
            <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,rgba(212,175,55,.4))' }} />
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: rarityColor }}>{rarityLabel}</span>
            <span style={{ fontSize: 14, letterSpacing: 2, color: rarityColor }}>
              {starsLit}
              <span style={{ opacity: 0.28 }}>{starsDim}</span>
            </span>
            <span style={{ flex: 1, height: 1, background: 'linear-gradient(270deg,transparent,rgba(212,175,55,.4))' }} />
          </div>

          <div style={fx.caseStyle}>
            <div style={{ position: 'relative', borderRadius: 3, overflow: 'hidden', background: '#0d0c0a', aspectRatio: '1/1' }}>
              <RawSvg html={store.memoHtml.artHtml} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
              <RawSvg html={store.memoHtml.frameHtml} style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }} />
              <div style={fx.fxStyle} />
              <div style={fx.nameplateStyle}>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 'clamp(7px,2.2cqw,8.5px)', letterSpacing: 2, color: '#b89a52', textTransform: 'uppercase' }}>Локация</span>
                <span style={{ width: 1, height: 'clamp(9px,2.8cqw,14px)', background: 'rgba(212,175,55,.4)' }} />
                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(11px,3.4cqw,15px)', fontWeight: 600, color: '#f6ead0', letterSpacing: 0.6, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fx.locUpper}</span>
              </div>
              <div style={genStyle}>
                <svg width="120" height="120" viewBox="0 0 120 120" style={{ overflow: 'visible' }}>
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#3a342a" strokeWidth="1" />
                  <g style={genSpin}>
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#d4af37" strokeWidth="2" strokeDasharray="62 252" strokeLinecap="round" />
                    <circle cx="60" cy="60" r="34" fill="none" stroke="#caa23d" strokeWidth="1.5" strokeDasharray="30 184" strokeLinecap="round" />
                  </g>
                  <line x1="60" y1="6" x2="60" y2="114" stroke="#d4af37" strokeWidth=".5" strokeOpacity=".4" />
                  <line x1="6" y1="60" x2="114" y2="60" stroke="#d4af37" strokeWidth=".5" strokeOpacity=".4" />
                  <circle cx="60" cy="60" r="3" fill="#d4af37" />
                </svg>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, letterSpacing: 4, color: '#d4af37', textTransform: 'uppercase' }}>Лепка мозоли</div>
                <div style={{ width: 170, height: 4, background: '#2a251d', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                  <div style={genBar} />
                </div>
              </div>
            </div>
            <div style={fx.sealWrapStyle}>
              <RawSvg html={store.memoHtml.sealHtml} style={{ width: '100%', height: '100%' }} />
            </div>
          </div>

          {/* PLAQUE */}
          {hasCallus && callus && (
            <div style={{ background: 'linear-gradient(165deg,#1d1810,#161209)', border: '1px solid rgba(212,175,55,.22)', borderRadius: 5, padding: '22px 26px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 10, left: 12, color: 'rgba(212,175,55,.35)', fontSize: 13 }}>✦</div>
              <div style={{ position: 'absolute', top: 10, right: 12, color: 'rgba(212,175,55,.35)', fontSize: 13 }}>✦</div>
              <div style={{ textAlign: 'center', fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: 3, color: '#8a8170', textTransform: 'uppercase', marginBottom: 8 }}>
                Лот №{lotNo} · {callus.cert.title}
              </div>
              <div style={{ textAlign: 'center', fontFamily: "'Playfair Display',serif", fontSize: 30, fontWeight: 700, color: '#f3e7c8', lineHeight: 1.15 }}>«{callus.name.folk}»</div>
              <div style={{ textAlign: 'center', fontFamily: "'Playfair Display',serif", fontStyle: 'italic', fontSize: 16, color: '#caa23d', marginTop: 4 }}>{callus.name.latin}</div>
              <div style={{ height: 1, background: 'rgba(212,175,55,.18)', margin: '14px 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 13.5, color: '#cdc3aa', lineHeight: 1.45 }}>
                <div>
                  <span style={{ color: '#8a8170', fontFamily: "'Space Mono',monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Происхождение&nbsp;</span>
                  {callus.name.act}
                </div>
                <div>
                  <span style={{ color: '#8a8170', fontFamily: "'Space Mono',monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Локация&nbsp;</span>
                  {callus.loc}
                </div>
                <div>
                  <span style={{ color: '#8a8170', fontFamily: "'Space Mono',monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Подвид&nbsp;</span>
                  {callus.name.sub} · {callus.stage} · {callus.name.degree} ст. · в строю с {callus.name.year}
                </div>
              </div>
              <div style={{ textAlign: 'center', fontFamily: "'Playfair Display',serif", fontStyle: 'italic', fontSize: 16, color: '#e3d4a4', marginTop: 14 }}>«{callus.name.motto}»</div>
              {store.signature && (
                <div style={{ textAlign: 'right', fontFamily: "'Playfair Display',serif", fontStyle: 'italic', fontSize: 14, color: '#9a9078', marginTop: 8 }}>— {store.signature}</div>
              )}
            </div>
          )}
        </section>

        {/* PANEL */}
        <aside style={{ flex: '1 1 340px', minWidth: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#16130e', border: '1px solid rgba(212,175,55,.16)', borderRadius: 8, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#8a8170' }}>Чем заработана мозоль</div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#8a8170' }}>Вид деятельности</span>
              <select
                value={String(config.originId)}
                onChange={(e) => store.onOrigin(Number(e.target.value))}
                style={{ background: '#0e0d0b', color: '#efe7d4', border: '1px solid rgba(212,175,55,.22)', borderRadius: 5, padding: '11px 12px', fontFamily: "'Space Grotesk'", fontSize: 13.5, cursor: 'pointer' }}
              >
                {originGroups.map((grp) => (
                  <optgroup key={grp.key} label={grp.label}>
                    {grp.items.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: '#6f6757', lineHeight: 1.5, marginTop: -6 }}>
              Имя, локацию, стадию и редкость экспонат получает сам — это гача. Крутите «Перекатить».
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#8a8170' }}>Стиль рендера</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {FREE_STYLES.map((f) => {
                  const active = config.styleKey === f.key;
                  return (
                    <FxButton
                      key={f.key}
                      onClick={() => store.selectStyle(f.key)}
                      base={{
                        padding: '10px 14px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontFamily: "'Space Grotesk'",
                        fontSize: 13,
                        fontWeight: 600,
                        letterSpacing: 0.3,
                        border: '1px solid ' + (active ? '#d4af37' : 'rgba(212,175,55,.25)'),
                        background: active ? 'linear-gradient(180deg,#e8c252,#caa23d)' : 'transparent',
                        color: active ? '#1a1208' : '#cdc3aa',
                        boxShadow: active ? '0 6px 16px rgba(212,175,55,.25)' : 'none',
                        flex: 'none',
                        transition: 'transform .12s cubic-bezier(.3,.7,.3,1), border-color .15s ease, box-shadow .15s ease, color .15s ease',
                      }}
                      hover={{ borderColor: '#f0d77a', boxShadow: '0 5px 16px rgba(212,175,55,.30)', transform: 'translateY(-2px)' }}
                      active={{ transform: 'translateY(0) scale(.97)' }}
                    >
                      {f.label}
                    </FxButton>
                  );
                })}
                <FxButton
                  onClick={store.openShop}
                  base={{ padding: '10px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: "'Space Grotesk'", fontSize: 13, fontWeight: 600, letterSpacing: 0.3, border: '1px dashed rgba(212,175,55,.4)', background: 'transparent', color: '#d4af37', flex: 'none' }}
                  hover={{ borderColor: '#f0d77a' }}
                >
                  ＋ Премиум
                </FxButton>
              </div>
            </div>
          </div>

          <FxButton
            onClick={store.reroll}
            base={{
              background: 'linear-gradient(180deg,#f6dc7e 0%,#e8c252 46%,#c89c36 100%)',
              color: '#1a1208',
              border: '1px solid #b8902f',
              borderRadius: 10,
              padding: 18,
              fontFamily: "'Space Grotesk'",
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: 4,
              cursor: 'pointer',
              boxShadow: '0 12px 28px rgba(212,175,55,.30), inset 0 1px 0 rgba(255,250,228,.75), inset 0 -3px 7px rgba(120,86,16,.4)',
              textTransform: 'uppercase',
              transition: 'transform .12s cubic-bezier(.3,.7,.3,1), box-shadow .16s ease, filter .16s ease',
            }}
            hover={{ filter: 'brightness(1.05)', transform: 'translateY(-2px)', boxShadow: '0 18px 38px rgba(212,175,55,.44), inset 0 1px 0 rgba(255,250,228,.75)' }}
            active={{ transform: 'translateY(2px) scale(.992)', boxShadow: '0 5px 14px rgba(212,175,55,.3), inset 0 3px 8px rgba(120,86,16,.55)' }}
          >
            ⟳ Перекатить
          </FxButton>

          <div style={{ display: 'flex', gap: 12 }}>
            <FxButton
              onClick={store.randomAll}
              base={{ flex: 1, background: 'linear-gradient(180deg,rgba(212,175,55,.07),rgba(212,175,55,.02))', color: '#e8d9b4', border: '1px solid rgba(212,175,55,.34)', borderRadius: 8, padding: 14, fontFamily: "'Space Grotesk'", fontSize: 13, fontWeight: 600, cursor: 'pointer', letterSpacing: 0.4, transition: 'transform .12s cubic-bezier(.3,.7,.3,1), background .15s ease, border-color .15s ease' }}
              hover={{ background: 'linear-gradient(180deg,rgba(212,175,55,.17),rgba(212,175,55,.06))', borderColor: '#caa23d', transform: 'translateY(-1px)' }}
              active={{ transform: 'translateY(1px) scale(.99)' }}
            >
              Случайная мозоль
            </FxButton>
            <FxButton
              onClick={store.download}
              base={{ flex: 1, background: 'linear-gradient(180deg,rgba(212,175,55,.07),rgba(212,175,55,.02))', color: '#e8d9b4', border: '1px solid rgba(212,175,55,.34)', borderRadius: 8, padding: 14, fontFamily: "'Space Grotesk'", fontSize: 13, fontWeight: 600, cursor: 'pointer', letterSpacing: 0.4, transition: 'transform .12s cubic-bezier(.3,.7,.3,1), background .15s ease, border-color .15s ease' }}
              hover={{ background: 'linear-gradient(180deg,rgba(212,175,55,.17),rgba(212,175,55,.06))', borderColor: '#caa23d', transform: 'translateY(-1px)' }}
              active={{ transform: 'translateY(1px) scale(.99)' }}
            >
              Скачать PNG
            </FxButton>
          </div>

          <div style={{ background: '#16130e', border: '1px solid rgba(212,175,55,.16)', borderRadius: 8, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#8a8170' }}>Ваша подпись на табличке</span>
              <SignatureInput value={store.signature} onChange={store.onSig} />
            </label>
            <FxButton
              onClick={store.openShare}
              base={{ background: 'linear-gradient(180deg,#3c151b,#290e12)', color: '#f3cdc4', border: '1px solid #7a1420', borderRadius: 8, padding: 14, fontFamily: "'Space Grotesk'", fontSize: 14, fontWeight: 600, cursor: 'pointer', letterSpacing: 0.5, boxShadow: 'inset 0 1px 0 rgba(255,180,160,.12)', transition: 'transform .12s cubic-bezier(.3,.7,.3,1), filter .15s ease, box-shadow .15s ease' }}
              hover={{ filter: 'brightness(1.2)', transform: 'translateY(-1px)', boxShadow: '0 10px 22px rgba(122,20,32,.42)' }}
              active={{ transform: 'translateY(1px) scale(.99)' }}
            >
              Подарить мозоль страдальцу →
            </FxButton>
          </div>
        </aside>
      </main>
    </div>
  );
}
