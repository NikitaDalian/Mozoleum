// Detailed SVG valance (pelmet) for the curtain — velvet swags with gold braid
// and hanging tassels. Ported from the prototype's valanceSVG().
export function valanceSVG(): string {
  const W = 1200;
  const swags = 7;
  const sw = W / swags;
  let b = '';
  b += `<rect x="0" y="0" width="${W}" height="30" fill="url(#vg)"/><rect x="0" y="28" width="${W}" height="4" fill="#caa23d"/>`;
  for (let i = 0; i < swags; i++) {
    const x0 = i * sw;
    const x1 = x0 + sw;
    const xm = x0 + sw / 2;
    b += `<path d="M${x0} 12 L${x1} 12 L${x1} 30 Q${xm.toFixed(0)} 118 ${x0} 30 Z" fill="url(#vg)" stroke="#9a1620" stroke-width="1"/>`;
    b += `<path d="M${(x0 + sw * 0.3).toFixed(0)} 26 Q${xm.toFixed(0)} 96 ${(x1 - sw * 0.3).toFixed(0)} 26" fill="none" stroke="rgba(15,2,4,.5)" stroke-width="3"/>`;
    b += `<path d="M${(x0 + sw * 0.14).toFixed(0)} 24 Q${xm.toFixed(0)} 108 ${(x1 - sw * 0.14).toFixed(0)} 24" fill="none" stroke="rgba(255,228,180,.10)" stroke-width="2"/>`;
    b += `<path d="M${x1} 30 Q${xm.toFixed(0)} 118 ${x0} 30" fill="none" stroke="#d8b24a" stroke-width="3"/>`;
  }
  for (let i = 0; i <= swags; i++) {
    const x = i * sw;
    let skirt = '';
    for (let j = -3; j <= 3; j++) skirt += `<line x1="${j * 2.4}" y1="56" x2="${j * 4.4}" y2="82" stroke="#caa23d" stroke-width="1.5"/>`;
    b += `<g transform="translate(${x} 30)"><line x1="0" y1="0" x2="0" y2="44" stroke="#caa23d" stroke-width="2.5"/><circle cx="0" cy="50" r="7.5" fill="url(#tg)" stroke="#9a7620" stroke-width="1"/>${skirt}</g>`;
  }
  const grad =
    '<linearGradient id="vg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8e1623"/><stop offset="0.5" stop-color="#6e1019"/><stop offset="1" stop-color="#460c11"/></linearGradient>';
  return `<svg viewBox="0 0 ${W} 132" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:132px;display:block;filter:drop-shadow(0 8px 14px rgba(0,0,0,.45))"><defs>${grad}<radialGradient id="tg" cx="0.4" cy="0.34" r="0.8"><stop offset="0" stop-color="#f3e2a6"/><stop offset="1" stop-color="#9a7620"/></radialGradient></defs>${b}</svg>`;
}
