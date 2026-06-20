// МОЗОЛЕУМ — deterministic callus engine.
// Architecture: "one geometry — many styles".
// From a seed we deterministically derive a callus "anatomy" (shape + params);
// a render style is layered on top. One seed = the exact same callus, forever.
// Ported from the original kallozey-engine.js prototype, fully framework-agnostic
// so it can run in the browser (website) and in Node (server image API / CLI).

// ---------- PRNG (mulberry32) + independent streams from a seed ----------
export function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function stream(seed: number, salt: number): () => number {
  return mulberry32((seed ^ salt) >>> 0);
}
export function rollSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}
function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

// ---------- Types ----------
export interface Rarity {
  key: string;
  label: string;
  idx: number;
  stars: number;
  p: number;
  color: string;
  soft: string;
  glow: boolean;
  cheer: string | null;
}
export interface Cert {
  key: string;
  title: string;
  idx: number;
  p: number;
  hi: string;
  mid: string;
  lo: string;
  ink: string;
}
export type OriginGroup = 'honor' | 'shame';
export interface Origin {
  id: number;
  g: OriginGroup;
  act: string;
  loc: string;
  folk: string;
  sub: string;
}
export interface Harmonic {
  k: number;
  amp: number;
  ph: number;
}
export interface Satellite {
  ang: number;
  dist: number;
  r: number;
}
export interface Anatomy {
  harm: Harmonic[];
  asym: number;
  asymPh: number;
  satellites: Satellite[];
  hasCrack: boolean;
  crackAng: number;
  crackJit: number[];
  hasHighlight: boolean;
  baseRough: number;
}
export interface CallusName {
  latin: string;
  latinCore: string;
  epithet: string;
  folk: string;
  sub: string;
  degree: string;
  year: number;
  motto: string;
  act: string;
}
export interface Callus {
  seed: number;
  originId: number;
  origin: Origin;
  loc: string;
  group: OriginGroup;
  stageIndex: number;
  stage: string;
  patina: number;
  rarity: Rarity;
  layers: number;
  cert: Cert;
  anatomy: Anatomy;
  tech: { height: number; contourStep: number; scaleBar: number; annotations: string[] };
  name: CallusName;
  silhouette: string;
}
export type StyleKey = 'heraldry' | 'botanical' | 'topo';

// ---------- Reference data ----------
export const STAGES: string[] = [
  'Новорождённая', 'Окрепшая', 'Боевая', 'Закалённая',
  'Бронзовая броня ветерана', 'Реликвия', 'Артефакт',
];

export const RARITIES: Rarity[] = [
  { key: 'common',    label: 'Обычная',     idx: 0, stars: 1, p: 0.60,  color: '#8a8170', soft: '#bcae90', glow: false, cheer: null },
  { key: 'uncommon',  label: 'Необычная',   idx: 1, stars: 2, p: 0.24,  color: '#4f9a78', soft: '#7bc2a0', glow: false, cheer: 'НЕДУРНО!' },
  { key: 'heroic',    label: 'Героическая', idx: 2, stars: 3, p: 0.105, color: '#5a83c2', soft: '#8aaee0', glow: false, cheer: 'УСПЕХ!!!' },
  { key: 'legendary', label: 'Легендарная', idx: 3, stars: 4, p: 0.042, color: '#e0b53e', soft: '#f4d977', glow: true,  cheer: 'ЭПИЧЕСКАЯ МОЗОЛЬ!!!' },
  { key: 'mythic',    label: 'Мифическая',  idx: 4, stars: 5, p: 0.013, color: '#c06ad6', soft: '#e7a6f4', glow: true,  cheer: 'МИФИЧЕСКАЯ МОЗОЛЬ!!!' },
];

// Authenticity certification — its own gacha on the seal.
export const CERTS: Cert[] = [
  { key: 'copy',   title: 'КОПИЯ',     idx: 0, p: 0.50, hi: '#e8e4da', mid: '#9a948a', lo: '#5a554c', ink: '#2e2a24' },
  { key: 'auth',   title: 'ПОДЛИННИК', idx: 1, p: 0.27, hi: '#fbeec0', mid: '#dcb74e', lo: '#9a7620', ink: '#3a2c10' },
  { key: 'orig',   title: 'ОРИГИНАЛ',  idx: 2, p: 0.14, hi: '#ffe6a6', mid: '#e0a93a', lo: '#8a5e12', ink: '#3a2606' },
  { key: 'etalon', title: 'ЭТАЛОН',    idx: 3, p: 0.07, hi: '#eaf2ff', mid: '#b9c6da', lo: '#6f7e92', ink: '#25303e' },
  { key: 'relic',  title: 'РЕЛИКВИЯ',  idx: 4, p: 0.02, hi: '#ffe6ff', mid: '#d9a0e6', lo: '#7c3f96', ink: '#3a1a4a' },
];

export interface PremiumStyle { key: string; label: string; price: number; hint: string }
export const PREMIUM_STYLES: PremiumStyle[] = [
  { key: 'foil',      label: 'Золотая фольга',    price: 250, hint: 'тиснёное золото по чёрному' },
  { key: 'stained',   label: 'Витраж',            price: 300, hint: 'свинцовый контур + цветное стекло' },
  { key: 'neon',      label: 'Неон · Голограмма', price: 400, hint: 'светящийся контур, RGB-перелив' },
  { key: 'cyano',     label: 'Цианотипия',        price: 200, hint: 'синий blueprint, белые линии' },
  { key: 'oldmaster', label: 'Старый мастер',     price: 350, hint: 'масло, кракелюр, тёмный лак' },
  { key: 'pixel',     label: 'Пиксель-арт',       price: 150, hint: '8-бит экспонат, дизеринг' },
];

export interface FreeStyle { key: StyleKey; label: string }
export const FREE_STYLES: FreeStyle[] = [
  { key: 'heraldry',  label: 'Геральдика' },
  { key: 'botanical', label: 'Ботаника' },
  { key: 'topo',      label: 'Топо-схема' },
];

const MOTTOS: string[] = [
  'Через боль — к лайкам', 'Ни дня без зацепа', 'Терпи, ладонь, атаманом будешь',
  'Заслужено потом и кринжем', 'Сила в мозоли', 'Кто не катал, тот не поймёт',
  'Гордись бугром своим', 'Что ни день — то слой', 'Боль временна, мозоль вечна',
  'Каждому труду — своя печать', 'Натёрто — значит честно', 'Сквозь натуг — к величию',
];

const EPITHET: Record<OriginGroup, string[]> = {
  honor: ['Maximus', 'Gloriosus', 'Heroicus', 'Invictus', 'Nobilis'],
  shame: ['Divanus', 'Scrollus', 'Procrastinatus', 'Nocturnus', 'Vulgaris'],
};
const RARITY_EPITHET: Record<string, string> = { legendary: 'Magnus', mythic: 'Aeternus' };

const LATIN_BY_LOC: Record<string, string> = {
  'ладонь': 'Manus', 'кончики пальцев': 'Digitus Durus', 'подушечки пальцев': 'Tuberculum',
  'костяшки': 'Nodus', 'пальцы ног': 'Digitus Pedis', 'подбородок': 'Mentum',
  'большой палец': 'Pollex', 'ребро ладони': 'Manus Latus', 'лоб': 'Frons',
  'пальцы': 'Digitus', 'обе ладони': 'Manus Gemina',
  'предплечья': 'Antebrachium',
};

// Silhouette underlay by location.
const SIL_BY_LOC: Record<string, string> = {
  'ладонь': 'palm', 'ребро ладони': 'palm', 'обе ладони': 'palms',
  'пальцы': 'fingers', 'кончики пальцев': 'fingers', 'подушечки пальцев': 'fingers', 'костяшки': 'fingers',
  'большой палец': 'thumb', 'пальцы ног': 'foot', 'подбородок': 'face', 'лоб': 'face',
  'предплечья': 'palm',
};

// ---------- Origins library (the comedic core) ----------
export const ORIGINS: Origin[] = [
  // Honourably earned
  { id: 1,  g: 'honor', act: 'Турник, подтягивания',        loc: 'ладонь',            folk: 'Длань Турникмена',   sub: 'Турниковый' },
  { id: 2,  g: 'honor', act: 'Скалодром, зацепы',           loc: 'кончики пальцев',   folk: 'Перст Скалолаза',    sub: 'Зацепный' },
  { id: 3,  g: 'honor', act: 'Штанга, кроссфит',            loc: 'ладонь',            folk: 'Хват Атлета',        sub: 'Железный' },
  { id: 4,  g: 'honor', act: 'Академическая гребля',        loc: 'ладонь',            folk: 'Мозоль Гребца',      sub: 'Вёсельный' },
  { id: 5,  g: 'honor', act: 'Гимнастические кольца',       loc: 'ладонь',            folk: 'Печать Колец',       sub: 'Гимнастический' },
  { id: 6,  g: 'honor', act: 'Лазание по канату',           loc: 'ладонь',            folk: 'Канатная Длань',     sub: 'Канатный' },
  { id: 7,  g: 'honor', act: 'Гиревой спорт',               loc: 'ладонь',            folk: 'Гиревая Печать',     sub: 'Гиревой' },
  { id: 8,  g: 'honor', act: 'Бокс',                        loc: 'костяшки',          folk: 'Костяшки Бойца',     sub: 'Боксёрский' },
  { id: 9,  g: 'honor', act: 'Балетные пуанты',             loc: 'пальцы ног',        folk: 'Стопа Балерины',     sub: 'Пуантовый' },
  { id: 10, g: 'honor', act: 'Гитарные струны',             loc: 'кончики пальцев',   folk: 'Перст Гитариста',    sub: 'Струнный' },
  { id: 11, g: 'honor', act: 'Скрипка',                     loc: 'подбородок',        folk: 'Скрипичная Печать',  sub: 'Скрипичный' },
  { id: 12, g: 'honor', act: 'Виолончель',                  loc: 'подушечки пальцев', folk: 'Виолончельный Бугор', sub: 'Виолончельный' },
  { id: 13, g: 'honor', act: 'Барабанные палочки',          loc: 'ладонь',            folk: 'Длань Барабанщика',  sub: 'Барабанный' },
  { id: 14, g: 'honor', act: 'Колка дров топором',          loc: 'ладонь',            folk: 'Дровяная Мозоль',    sub: 'Дровосечный' },
  { id: 15, g: 'honor', act: 'Огород, лопата',              loc: 'ладонь',            folk: 'Лопатная Печать',    sub: 'Огородный' },
  { id: 16, g: 'honor', act: 'Генеральная уборка, швабра',  loc: 'ладонь',            folk: 'Швабровая Длань',    sub: 'Шваберный' },
  { id: 17, g: 'honor', act: 'Шитьё, игла',                 loc: 'подушечки пальцев', folk: 'Игольный Бугор',     sub: 'Швейный' },
  { id: 18, g: 'honor', act: 'Гончарный круг',              loc: 'пальцы',            folk: 'Перст Гончара',      sub: 'Гончарный' },
  { id: 19, g: 'honor', act: 'Альпинизм, ледоруб',          loc: 'ладонь',            folk: 'Длань Альпиниста',   sub: 'Ледорубный' },
  { id: 20, g: 'honor', act: 'Парусный спорт, шкоты',       loc: 'ладонь',            folk: 'Шкотовая Мозоль',    sub: 'Парусный' },
  { id: 41, g: 'honor', act: 'Планка на предплечьях',       loc: 'предплечья',        folk: 'Печать Планкиста',   sub: 'Планочный' },
  { id: 42, g: 'honor', act: 'Стульчик (присед у стены)',   loc: 'ладонь',            folk: 'Трон Стульчика',     sub: 'Стульчиковый' },
  // Shamefully earned
  { id: 21, g: 'shame', act: 'Скролл ленты большим пальцем', loc: 'большой палец',    folk: 'Мозоль Скроллера',   sub: 'Скролльный' },
  { id: 22, g: 'shame', act: 'Стики геймпада',              loc: 'большой палец',     folk: 'Печать Геймпада',    sub: 'Стиковый' },
  { id: 23, g: 'shame', act: 'Механическая клавиатура',     loc: 'подушечки пальцев', folk: 'Бугор Клавишника',   sub: 'Клавишный' },
  { id: 24, g: 'shame', act: 'Игровая мышка',               loc: 'ребро ладони',      folk: 'Мозоль Кликера',     sub: 'Мышиный' },
  { id: 25, g: 'shame', act: 'Жим пульта от телевизора',    loc: 'большой палец',     folk: 'Пульт-Мозоль',       sub: 'Диванный' },
  { id: 26, g: 'shame', act: 'Открывание банки огурцов',    loc: 'ладонь',            folk: 'Огуречная Печать',   sub: 'Засольный' },
  { id: 27, g: 'shame', act: 'Все пакеты из машины за раз', loc: 'пальцы',            folk: 'Перст Грузчика-Любителя', sub: 'Пакетный' },
  { id: 28, g: 'shame', act: 'Рукопожатия на нетворкинге',  loc: 'ладонь',            folk: 'Длань Нетворкера',   sub: 'Рукопожатный' },
  { id: 29, g: 'shame', act: 'Аплодисменты на совещании',   loc: 'обе ладони',        folk: 'Овация-Мозоль',      sub: 'Совещательный' },
  { id: 30, g: 'shame', act: 'Фейспалм',                    loc: 'лоб',               folk: 'Печать Фейспалма',   sub: 'Лобный' },
  { id: 31, g: 'shame', act: 'Чесание затылка над тикетами', loc: 'пальцы',           folk: 'Перст Тимлида',      sub: 'Тикетный' },
  { id: 32, g: 'shame', act: 'Чемодан без колёсиков',       loc: 'ладонь',            folk: 'Чемоданная Длань',   sub: 'Багажный' },
  { id: 33, g: 'shame', act: 'Печатание гневных комментов',  loc: 'подушечки пальцев', folk: 'Бугор Комментатора', sub: 'Гневный' },
  { id: 34, g: 'shame', act: 'Лайканье чужих постов',       loc: 'большой палец',     folk: 'Лайк-Мозоль',        sub: 'Лайковый' },
  { id: 35, g: 'shame', act: 'Телефон над лицом ночью',     loc: 'пальцы',            folk: 'Ночной Перст',       sub: 'Ночной' },
  { id: 36, g: 'shame', act: 'Завязывание мусорных пакетов', loc: 'пальцы',           folk: 'Мусорный Узел',      sub: 'Узловой' },
  { id: 37, g: 'shame', act: 'Откручивание детского пюре',   loc: 'пальцы',           folk: 'Перст Родителя',     sub: 'Пюрешный' },
  { id: 38, g: 'shame', act: 'Ручка тележки в гипермаркете', loc: 'ладонь',           folk: 'Тележная Печать',    sub: 'Тележный' },
  { id: 39, g: 'shame', act: 'Кручение спиннера',           loc: 'пальцы',            folk: 'Спиннер-Мозоль',     sub: 'Спиннерный' },
  { id: 40, g: 'shame', act: 'Подъём по карьерной лестнице', loc: 'ладонь',           folk: 'Карьерная Мозоль',   sub: 'Карьерный' },
];

export const LOCATIONS: string[] = Array.from(new Set(ORIGINS.map((o) => o.loc)));

// Origin grouping by activity (for a readable picker).
export interface Category { key: string; label: string }
export const CATEGORIES: Category[] = [
  { key: 'sport',   label: 'Спорт и сила' },
  { key: 'art',     label: 'Искусство и ремёсла' },
  { key: 'home',    label: 'Дом и быт' },
  { key: 'office',  label: 'Офис и социум' },
  { key: 'digital', label: 'Цифровая дегенерация' },
];
const CAT_OF: Record<number, string> = {
  1: 'sport', 2: 'sport', 3: 'sport', 4: 'sport', 5: 'sport', 6: 'sport', 7: 'sport', 8: 'sport', 19: 'sport', 20: 'sport', 41: 'sport', 42: 'sport',
  9: 'art', 10: 'art', 11: 'art', 12: 'art', 13: 'art', 17: 'art', 18: 'art',
  14: 'home', 15: 'home', 16: 'home', 26: 'home', 27: 'home', 32: 'home', 36: 'home', 37: 'home', 38: 'home',
  28: 'office', 29: 'office', 30: 'office', 31: 'office', 40: 'office',
  21: 'digital', 22: 'digital', 23: 'digital', 24: 'digital', 25: 'digital', 33: 'digital', 34: 'digital', 35: 'digital', 39: 'digital',
};
export interface OriginGroupView {
  key: string;
  label: string;
  items: { value: string; label: string }[];
}
export function originsByCategory(): OriginGroupView[] {
  return CATEGORIES.map((c) => ({
    key: c.key,
    label: c.label,
    items: ORIGINS.filter((o) => CAT_OF[o.id] === c.key).map((o) => ({ value: String(o.id), label: o.act })),
  }));
}

// ---------- Building a callus ----------
export interface BuildArgs {
  originId: number;
  seed: number;
  stageKey?: string;
  locOverride?: string | null;
}
export function buildCallus({ originId, seed, stageKey = 'auto', locOverride = null }: BuildArgs): Callus {
  const origin = ORIGINS.find((o) => o.id === originId) || ORIGINS[0];
  const loc = locOverride || origin.loc;

  const rs = stream(seed, 0x9e3779b9); // shape
  const rr = stream(seed, 0x85ebca6b); // rarity
  const rt = stream(seed, 0xc2b2ae35); // tech data / name

  // Stage — always from the seed (hidden from the user).
  const stageRoll = rs();
  let stageIndex = clamp(Math.floor(Math.pow(stageRoll, 1.5) * 7), 0, 6);
  if (stageKey && stageKey !== 'auto') stageIndex = Math.max(0, STAGES.indexOf(stageKey));
  const patina = stageIndex / 6;

  // Rarity (gacha): higher stage → higher chance of rarer (tops stay rare).
  const lift = patina * 0.13;
  const roll = Math.min(0.9999, rr() + lift);
  let acc = 0, rarity = RARITIES[0];
  for (const r of RARITIES) { acc += r.p; if (roll <= acc) { rarity = r; break; } }

  // Seal certification (own gacha, with a bonus from rarity).
  const rcStream = stream(seed, 0x27d4eb2f);
  const certRoll = Math.min(0.9999, rcStream() + rarity.idx * 0.085);
  let cacc = 0, cert = CERTS[0];
  for (const ct of CERTS) { cacc += ct.p; if (certRoll <= cacc) { cert = ct; break; } }

  // Contour layers: more at higher stage.
  const layers = clamp(2 + Math.round(patina * 3) + (rs() < 0.45 ? 1 : 0), 2, 6);

  // Shape harmonics (smooth organic contour).
  const baseRough = 0.05 + rs() * 0.10;
  const harm: Harmonic[] = [
    { k: 2, amp: 0.10 + rs() * 0.16, ph: rs() * 6.283 },
    { k: 3, amp: 0.06 + rs() * 0.12, ph: rs() * 6.283 },
    { k: 5, amp: 0.03 + rs() * 0.07, ph: rs() * 6.283 },
    { k: 8, amp: baseRough, ph: rs() * 6.283 }, // edge "raggedness"
  ];
  const asym = (rs() * 2 - 1) * 0.14;
  const asymPh = rs() * 6.283;

  // Satellites.
  const satCount = Math.floor(rs() * 3) + (patina > 0.6 ? 1 : 0);
  const satellites: Satellite[] = [];
  for (let i = 0; i < satCount; i++) {
    satellites.push({ ang: rs() * 6.283, dist: 0.95 + rs() * 0.55, r: 0.10 + rs() * 0.10 });
  }

  // Crack / highlight.
  const hasCrack = rs() < 0.45 + patina * 0.3;
  const crackAng = rs() * 6.283;
  const crackJit: number[] = [];
  for (let i = 0; i < 7; i++) crackJit.push((rs() * 2 - 1));
  const hasHighlight = rs() < 0.7;

  // Technical data for topo / botanical.
  const height = 12 + Math.floor(rt() * 18) * 4 + stageIndex * 6;
  const contourStep = [2, 5, 10, 20][Math.floor(rt() * 4)];
  const scaleBar = [25, 50, 100][Math.floor(rt() * 3)];
  const annPool = ['stratum corneum', 'tuberculum durum', 'crista superior', 'margo asper', 'nucleus callosus', 'fissura minor', 'corona satellica'];
  const annotations: string[] = [];
  const aShuffle = annPool.slice().sort(() => rt() - 0.5);
  for (let i = 0; i < 3; i++) annotations.push(aShuffle[i]);

  // Name and plaque.
  const latinCore = LATIN_BY_LOC[loc] || 'Callus';
  let epithet = pick(rt, EPITHET[origin.g]);
  if (RARITY_EPITHET[rarity.key] && rt() < 0.6) epithet = RARITY_EPITHET[rarity.key];
  const degree = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][stageIndex];
  const year = 2013 + 1 + Math.floor(rt() * 12);
  const motto = pick(rt, MOTTOS);
  const latinName = `${latinCore} ${epithet}`;

  return {
    seed, originId, origin, loc,
    group: origin.g,
    stageIndex, stage: STAGES[stageIndex], patina,
    rarity, layers, cert,
    anatomy: { harm, asym, asymPh, satellites, hasCrack, crackAng, crackJit, hasHighlight, baseRough },
    tech: { height, contourStep, scaleBar, annotations },
    name: {
      latin: latinName, latinCore, epithet, folk: origin.folk, sub: origin.sub,
      degree, year, motto, act: origin.act,
    },
    silhouette: SIL_BY_LOC[loc] || 'palm',
  };
}

// ---------- Contour geometry ----------
function contourPath(a: Anatomy, scale: number, cx: number, cy: number, R: number): string {
  const n = 140; let d = '';
  for (let i = 0; i <= n; i++) {
    const ang = (i / n) * Math.PI * 2;
    let rr = 1;
    for (const h of a.harm) rr += h.amp * Math.sin(h.k * ang + h.ph);
    rr += a.asym * Math.cos(ang + a.asymPh);
    rr = Math.max(0.28, rr);
    const rad = R * scale * rr;
    const x = cx + Math.cos(ang) * rad;
    const y = cy + Math.sin(ang) * rad;
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
  }
  return d + 'Z';
}
function scales(layers: number): number[] {
  const out: number[] = [];
  for (let k = 0; k < layers; k++) out.push(1 - (k / layers) * 0.66);
  return out;
}
function crackPath(a: Anatomy, cx: number, cy: number, R: number): string {
  let d = `M${cx.toFixed(1)} ${cy.toFixed(1)} `;
  const dx = Math.cos(a.crackAng), dy = Math.sin(a.crackAng);
  const px = -dy, py = dx;
  for (let i = 1; i <= 6; i++) {
    const t = i / 6;
    const along = R * 0.9 * t;
    const off = a.crackJit[i] * R * 0.10 * (1 - t * 0.4);
    d += `L${(cx + dx * along + px * off).toFixed(1)} ${(cy + dy * along + py * off).toFixed(1)} `;
  }
  return d;
}

// ---------- Silhouette underlays (light line) ----------
function silhouette(kind: string): string {
  switch (kind) {
    case 'palm':
      return 'M385 770 Q368 600 384 500 L398 320 Q400 290 426 290 Q450 290 453 320 L463 480 L474 296 Q476 266 503 266 Q529 266 531 296 L539 484 L552 300 Q554 270 581 270 Q606 270 607 300 L614 482 L636 372 Q644 346 668 354 Q690 362 682 392 L636 560 Q632 690 600 762 Q500 808 385 770 Z';
    case 'palms':
      return 'M250 740 Q236 600 250 520 L262 360 Q264 334 286 334 Q307 334 309 360 L317 500 L327 340 Q329 314 352 314 Q374 314 376 340 L383 502 L395 346 Q397 320 419 320 Q440 320 441 348 L454 500 Q458 640 430 720 Q345 760 250 740 Z M560 720 Q548 620 562 540 L574 380 Q576 356 597 356 Q617 356 619 380 L627 520 L637 362 Q639 338 661 338 Q682 338 684 362 L691 522 L703 368 Q705 344 726 344 Q746 344 748 370 L760 520 Q764 640 738 712 Q655 750 560 720 Z';
    case 'fingers':
      return 'M408 800 L406 360 Q406 300 446 300 Q486 300 486 362 L486 800 Z M520 800 L518 330 Q518 270 558 270 Q598 270 598 332 L598 800 Z M452 470 L482 470 M540 440 L592 440';
    case 'thumb':
      return 'M360 720 Q340 560 400 470 Q450 392 540 372 Q620 356 660 396 Q694 430 660 470 Q600 540 560 600 Q520 680 500 760 Q420 776 360 720 Z M470 520 Q520 470 580 452';
    case 'foot':
      return 'M430 760 Q360 720 370 600 Q378 500 440 470 Q470 386 540 370 Q610 358 644 410 Q672 456 632 496 L600 620 Q590 720 560 770 Q495 800 430 760 Z M470 430 L478 372 M520 416 L526 360 M566 414 L572 366';
    case 'face':
      return 'M610 250 Q470 250 430 400 Q414 470 470 500 Q430 540 470 580 L450 640 Q470 700 560 720 Q640 730 690 690 M470 500 L520 500';
    default:
      return '';
  }
}

// ---------- Style renderers ----------
// Each returns inner-SVG (in a 0 0 1000 1000 coordinate system).

function renderHeraldry(c: Callus, id: string): string {
  const a = c.anatomy, cx = 500, cy = 470, R = 175;
  const shield = 'M268 232 H732 V548 Q732 716 500 800 Q268 716 268 548 Z';
  const sc = scales(c.layers);
  const goldStops = ['#f6e6a8', '#e6c463', '#caa23d', '#a87f26'];
  let layersSvg = '';
  sc.forEach((s, i) => {
    const fill = i === 0 ? `url(#${id}-gold)` : 'none';
    const stroke = i === 0 ? '#6e4f16' : goldStops[Math.min(i, 3)];
    const sw = i === 0 ? 4 : 3;
    layersSvg += `<path d="${contourPath(a, s, cx, cy, R)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-opacity="${i === 0 ? 1 : 0.85}"/>`;
  });
  let sats = '';
  a.satellites.forEach((st) => {
    const sxp = cx + Math.cos(st.ang) * R * st.dist, syp = cy + Math.sin(st.ang) * R * st.dist;
    sats += `<path d="${contourPath(a, st.r, sxp, syp, R)}" fill="url(#${id}-gold)" stroke="#6e4f16" stroke-width="2.5"/>`;
  });
  const crack = a.hasCrack ? `<path d="${crackPath(a, cx, cy, R)}" fill="none" stroke="#6e4f16" stroke-width="2.5" stroke-opacity="0.6" stroke-linecap="round"/>` : '';
  const hl = a.hasHighlight ? `<ellipse cx="${cx - R * 0.32}" cy="${cy - R * 0.34}" rx="${R * 0.22}" ry="${R * 0.13}" fill="#fdf3c8" opacity="0.55" transform="rotate(-28 ${cx - R * 0.32} ${cy - R * 0.34})"/>` : '';
  // degree stars
  let stars = '';
  const ns = c.rarity.stars;
  for (let i = 0; i < ns; i++) {
    const sx = 500 + (i - (ns - 1) / 2) * 46;
    stars += starPath(sx, 196, 15, '#e6c463', '#6e4f16');
  }
  return `<defs>
      <radialGradient id="${id}-gold" cx="0.4" cy="0.35" r="0.8">
        <stop offset="0" stop-color="#f8ecbe"/><stop offset="0.5" stop-color="#e2bd5b"/><stop offset="1" stop-color="#a8801f"/>
      </radialGradient>
      <clipPath id="${id}-shieldclip"><path d="${shield}"/></clipPath>
    </defs>
    <rect x="0" y="0" width="1000" height="1000" fill="#1a1411"/>
    <rect x="36" y="36" width="928" height="928" fill="none" stroke="#caa23d" stroke-width="2" stroke-opacity="0.5"/>
    <rect x="48" y="48" width="904" height="904" fill="none" stroke="#caa23d" stroke-width="1" stroke-opacity="0.3"/>
    ${stars}
    <path d="${shield}" fill="#5c1018" stroke="#caa23d" stroke-width="6"/>
    <path d="${shield}" fill="none" stroke="#2c0a0d" stroke-width="2" transform="scale(0.985)" transform-origin="500 520"/>
    <g clip-path="url(#${id}-shieldclip)">
      <path d="${silhouette(c.silhouette)}" fill="none" stroke="#caa23d" stroke-width="4" stroke-opacity="0.34" transform="translate(0 70) scale(0.78)" transform-origin="500 500"/>
      ${sats}${layersSvg}${crack}${hl}
    </g>
    ${ribbon(c.name.motto, id, '#5c1018', '#caa23d', '#f3e2a6')}`;
}

function renderBotanical(c: Callus, id: string): string {
  const a = c.anatomy, cx = 470, cy = 470, R = 200;
  const sc = scales(c.layers);
  let layersSvg = '';
  sc.forEach((s, i) => {
    layersSvg += `<path d="${contourPath(a, s, cx, cy, R)}" fill="none" stroke="#4b3a23" stroke-width="${i === 0 ? 2.6 : 1.4}" stroke-opacity="${i === 0 ? 0.95 : 0.7}"/>`;
  });
  // hatching inside the outer contour
  let hatch = '';
  for (let y = cy - R * 1.3; y < cy + R * 1.3; y += 9) {
    hatch += `<line x1="${cx - R * 1.3}" y1="${y.toFixed(1)}" x2="${cx + R * 1.3}" y2="${(y + R * 1.3).toFixed(1)}" stroke="#5a4730" stroke-width="0.8" stroke-opacity="0.5"/>`;
  }
  let sats = '';
  a.satellites.forEach((st) => {
    const sxp = cx + Math.cos(st.ang) * R * st.dist, syp = cy + Math.sin(st.ang) * R * st.dist;
    sats += `<path d="${contourPath(a, st.r, sxp, syp, R)}" fill="#efe7d2" stroke="#4b3a23" stroke-width="1.4"/>`;
  });
  const crack = a.hasCrack ? `<path d="${crackPath(a, cx, cy, R)}" fill="none" stroke="#4b3a23" stroke-width="1.4" stroke-opacity="0.8" stroke-linecap="round"/>` : '';
  // annotation callouts
  const anchors = [
    { x: cx + R * 0.7, y: cy - R * 0.6, lx: 880, ly: 270 },
    { x: cx - R * 0.55, y: cy + R * 0.2, lx: 120, ly: 560 },
    { x: cx + R * 0.5, y: cy + R * 0.75, lx: 870, ly: 690 },
  ];
  let ann = '';
  c.tech.annotations.forEach((t, i) => {
    const an = anchors[i];
    const right = an.lx > 500;
    ann += `<circle cx="${an.x.toFixed(0)}" cy="${an.y.toFixed(0)}" r="3.5" fill="#4b3a23"/>
      <path d="M${an.x.toFixed(0)} ${an.y.toFixed(0)} L${an.lx} ${an.ly}" fill="none" stroke="#4b3a23" stroke-width="0.9"/>
      <text x="${right ? an.lx - 6 : an.lx + 6}" y="${an.ly - 6}" font-family="'Space Mono',monospace" font-size="19" fill="#4b3a23" text-anchor="${right ? 'end' : 'start'}">${t}</text>`;
  });
  return `<rect x="0" y="0" width="1000" height="1000" fill="#efe7d2"/>
    <rect x="0" y="0" width="1000" height="1000" fill="url(#${id}-paper)"/>
    <defs><pattern id="${id}-paper" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#efe7d2"/><circle cx="1" cy="1" r="0.5" fill="#d8cdb0" opacity="0.5"/></pattern>
      <clipPath id="${id}-blob"><path d="${contourPath(a, 1, cx, cy, R)}"/></clipPath></defs>
    <rect x="40" y="40" width="920" height="920" fill="none" stroke="#4b3a23" stroke-width="1.5" stroke-opacity="0.5"/>
    <text x="120" y="144" font-family="'Space Mono',monospace" font-size="20" fill="#4b3a23" letter-spacing="3">HERBARIUM CALLOSUM · No.${String(c.originId).padStart(2, '0')}</text>
    <path d="${silhouette(c.silhouette)}" fill="none" stroke="#7a6748" stroke-width="3" stroke-opacity="0.46" transform="translate(-30 40) scale(0.86)" transform-origin="500 500"/>
    <g clip-path="url(#${id}-blob)">${hatch}</g>
    ${sats}${layersSvg}${crack}${ann}
    <text x="500" y="862" font-family="'Playfair Display',serif" font-style="italic" font-size="30" fill="#4b3a23" text-anchor="middle">${c.name.latin}</text>`;
}

function renderTopo(c: Callus, id: string): string {
  const a = c.anatomy, cx = 500, cy = 480, R = 210;
  // isolines = layers, with even spacing for a "map" feel
  const lines = Math.max(c.layers + 2, 5);
  let iso = '';
  for (let k = 0; k < lines; k++) {
    const s = 1 - (k / lines) * 0.82;
    const index = k % 2 === 0;
    iso += `<path d="${contourPath(a, s, cx, cy, R)}" fill="none" stroke="#3a3526" stroke-width="${index ? 2.2 : 1.1}" stroke-opacity="${index ? 0.9 : 0.55}"/>`;
    if (index && k > 0) {
      const lx = cx, ly = cy - R * s + 2;
      iso += `<text x="${lx}" y="${ly.toFixed(0)}" font-family="'Space Mono',monospace" font-size="13" fill="#3a3526" text-anchor="middle" opacity="0.8">${c.tech.height - k * c.tech.contourStep}</text>`;
    }
  }
  let sats = '';
  a.satellites.forEach((st) => {
    const sxp = cx + Math.cos(st.ang) * R * st.dist, syp = cy + Math.sin(st.ang) * R * st.dist;
    sats += `<path d="${contourPath(a, st.r, sxp, syp, R)}" fill="none" stroke="#3a3526" stroke-width="1.1" stroke-opacity="0.7"/><path d="${contourPath(a, st.r * 0.6, sxp, syp, R)}" fill="none" stroke="#3a3526" stroke-width="1" stroke-opacity="0.5"/>`;
  });
  // grid
  let grid = '';
  for (let g = 80; g < 960; g += 80) {
    grid += `<line x1="${g}" y1="40" x2="${g}" y2="960" stroke="#3a3526" stroke-width="0.5" stroke-opacity="0.12"/><line x1="40" y1="${g}" x2="960" y2="${g}" stroke="#3a3526" stroke-width="0.5" stroke-opacity="0.12"/>`;
  }
  // benchmark + height
  const bm = `<g transform="translate(${cx} ${cy})"><line x1="-16" y1="0" x2="16" y2="0" stroke="#9a2a1a" stroke-width="2"/><line x1="0" y1="-16" x2="0" y2="16" stroke="#9a2a1a" stroke-width="2"/><circle r="5" fill="none" stroke="#9a2a1a" stroke-width="2"/></g>`;
  const heightTag = `<text x="${cx + 22}" y="${cy + 4}" font-family="'Space Mono',monospace" font-size="20" fill="#9a2a1a">▲ ${c.tech.height} мм</text>`;
  // scale bar
  const scaleSvg = `<g transform="translate(64 912)"><rect x="0" y="0" width="60" height="9" fill="#3a3526"/><rect x="60" y="0" width="60" height="9" fill="none" stroke="#3a3526" stroke-width="1.5"/><text x="0" y="-8" font-family="'Space Mono',monospace" font-size="16" fill="#3a3526">0</text><text x="120" y="-8" font-family="'Space Mono',monospace" font-size="16" fill="#3a3526" text-anchor="middle">${c.tech.scaleBar} мм</text></g>`;
  const north = `<g transform="translate(900 110)"><path d="M0 -26 L9 16 L0 7 L-9 16 Z" fill="#3a3526"/><text x="0" y="38" font-family="'Space Mono',monospace" font-size="16" fill="#3a3526" text-anchor="middle">С</text></g>`;
  return `<rect x="0" y="0" width="1000" height="1000" fill="#e7e2d2"/>
    ${grid}
    <rect x="40" y="40" width="920" height="920" fill="none" stroke="#3a3526" stroke-width="1.5" stroke-opacity="0.6"/>
    <text x="120" y="144" font-family="'Space Mono',monospace" font-size="20" fill="#3a3526" letter-spacing="2">КАРТА РЕЛЬЕФА · h=${c.tech.contourStep} мм</text>
    <path d="${silhouette(c.silhouette)}" fill="none" stroke="#3a3526" stroke-width="2.6" stroke-dasharray="7 6" stroke-opacity="0.52" transform="scale(0.9)" transform-origin="500 500"/>
    ${sats}${iso}${bm}${heightTag}${scaleSvg}${north}`;
}

// star
function starPath(cx: number, cy: number, r: number, fill: string, stroke: string): string {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.42;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    d += (i === 0 ? 'M' : 'L') + (cx + Math.cos(a) * rad).toFixed(1) + ' ' + (cy + Math.sin(a) * rad).toFixed(1) + ' ';
  }
  return `<path d="${d}Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
}

// ribbon with motto
function ribbon(text: string, id: string, fill: string, stroke: string, textColor: string): string {
  return `<g transform="translate(0 838)">
    <path d="M150 0 L850 0 L820 56 L180 56 Z" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
    <path d="M150 0 L110 22 L150 44 Z" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
    <path d="M850 0 L890 22 L850 44 Z" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
    <text x="500" y="37" font-family="'Playfair Display',serif" font-size="26" fill="${textColor}" text-anchor="middle" letter-spacing="1">«${escapeXml(text)}»</text>
  </g>`;
}

export function renderArt(c: Callus, styleKey: string, idPrefix?: string): string {
  const id = idPrefix || ('c' + c.seed.toString(36));
  if (styleKey === 'botanical') return renderBotanical(c, id);
  if (styleKey === 'topo') return renderTopo(c, id);
  return renderHeraldry(c, id);
}

export function fullArtSVG(c: Callus, styleKey: string, idPrefix?: string): string {
  return `<svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block" xmlns="http://www.w3.org/2000/svg">${renderArt(c, styleKey, idPrefix)}</svg>`;
}

// ---------- Detailed baguette frame by rarity ----------
// stops: [highlight, metal, shadow, deep]; gem: [highlight, depth]
interface FrameTier {
  stops: [string, string, string, string];
  bead: string;
  gem0: string;
  gem1: string;
  rope: boolean;
  dentil: boolean;
  gems: number;
  crown: boolean;
}
const FRAME_TIERS: Record<string, FrameTier> = {
  common:    { stops: ['#d6cbb2', '#aa9f85', '#665d4b', '#39301f'], bead: '#c3b591', gem0: '#cdbf9e', gem1: '#7a6f55', rope: false, dentil: false, gems: 0, crown: false },
  uncommon:  { stops: ['#e2f4ea', '#86caa2', '#46815f', '#21412f'], bead: '#b3ddc4', gem0: '#bdebd2', gem1: '#1f8a5b', rope: true,  dentil: false, gems: 2, crown: false },
  heroic:    { stops: ['#eaf2ff', '#92b8ea', '#496a9f', '#243450'], bead: '#b6cff1', gem0: '#cfe2ff', gem1: '#1f4f9c', rope: false, dentil: true,  gems: 2, crown: false },
  legendary: { stops: ['#fff6d6', '#efcc64', '#9c7a22', '#523d0f'], bead: '#edd693', gem0: '#ffd9c0', gem1: '#9e1f12', rope: true,  dentil: true,  gems: 4, crown: false },
  mythic:    { stops: ['#fbe4ff', '#d094e6', '#7c3f96', '#3a1a4a'], bead: '#e6c98f', gem0: '#f0d4ff', gem1: '#6a2f96', rope: true,  dentil: true,  gems: 6, crown: true  },
};
const W_ = 1000;
function ringPath(o: number, w: number): string { return `M${o} ${o} H${W_ - o} V${W_ - o} H${o} Z M${o + w} ${o + w} V${W_ - o - w} H${W_ - o - w} V${o + w} Z`; }
function perimItems(inset: number, step: number): [number, number, number][] {
  const lo = inset, hi = W_ - inset, len = hi - lo, n = Math.max(3, Math.round(len / step)), s = len / n;
  const out: [number, number, number][] = [];
  for (let i = 0; i < n; i++) { const t = lo + s * (i + 0.5); out.push([t, lo, 0], [hi, t, 90], [t, hi, 180], [lo, t, 270]); }
  return out;
}
function beadCourse(inset: number, r: number, step: number, col: string, edge: string): string { return perimItems(inset, step).map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${col}" stroke="${edge}" stroke-width="0.6"/>`).join(''); }
function dentilCourse(inset: number, col: string, edge: string): string { return perimItems(inset, 24).map(([x, y, a]) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a})"><rect x="-5" y="-6.5" width="10" height="13" fill="${col}" stroke="${edge}" stroke-width="0.6"/></g>`).join(''); }
function ropeCourse(inset: number, hi: string, lo: string): string { return perimItems(inset, 13).map(([x, y, a]) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a})"><path d="M-7 5 Q0 -6 7 5" fill="none" stroke="${hi}" stroke-width="2.6" stroke-linecap="round"/><path d="M-7 8 Q0 -2 7 8" fill="none" stroke="${lo}" stroke-width="1.6" stroke-linecap="round" stroke-opacity="0.55"/></g>`).join(''); }
function gemShape(cx: number, cy: number, r: number, id: string, T: FrameTier): string {
  let prongs = '';
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; prongs += `<circle cx="${(cx + Math.cos(a) * (r + 4)).toFixed(1)}" cy="${(cy + Math.sin(a) * (r + 4)).toFixed(1)}" r="1.5" fill="${T.stops[0]}"/>`; }
  return `<g><circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="${T.stops[3]}" stroke="${T.stops[0]}" stroke-width="1.3"/>${prongs}<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}-gem)"/><path d="M${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}" fill="rgba(255,255,255,.16)"/><ellipse cx="${(cx - r * 0.3).toFixed(1)}" cy="${(cy - r * 0.36).toFixed(1)}" rx="${(r * 0.4).toFixed(1)}" ry="${(r * 0.26).toFixed(1)}" fill="#fff" opacity="0.75"/></g>`;
}
function gemsLayout(T: FrameTier, id: string): string {
  if (!T.gems) return '';
  const c = 58, m = W_ / 2, R = 14; let g = gemShape(m, c, R, id, T) + gemShape(m, W_ - c, R, id, T);
  if (T.gems >= 4) g += gemShape(c, m, R, id, T) + gemShape(W_ - c, m, R, id, T);
  if (T.gems >= 6) g += gemShape(c, c, R + 1, id, T) + gemShape(W_ - c, c, R + 1, id, T) + gemShape(c, W_ - c, R + 1, id, T) + gemShape(W_ - c, W_ - c, R + 1, id, T);
  return g;
}
function cornerArt(rarityKey: string, T: FrameTier): string {
  const c = 58, scroll = rarityKey === 'heroic' || rarityKey === 'legendary' || rarityKey === 'mythic';
  const pts: [number, number, number][] = [[c, c, 0], [W_ - c, c, 90], [W_ - c, W_ - c, 180], [c, W_ - c, 270]];
  return pts.map(([x, y, a]) => {
    const inner = scroll
      ? `<path d="M-32 -7 C -32 -23 -18 -32 -2 -32 M-7 -32 C -23 -32 -32 -18 -32 -2" fill="none" stroke="${T.stops[0]}" stroke-width="2.4" stroke-opacity="0.9"/><path d="M-22 -10 C -22 -19 -14 -22 -8 -22" fill="none" stroke="${T.bead}" stroke-width="1.6"/>`
      : [0, 1, 2, 3, 4].map((i) => { const ang = i / 4 * (Math.PI / 2) + Math.PI; return `<circle cx="${(Math.cos(ang) * 15).toFixed(1)}" cy="${(Math.sin(ang) * 15).toFixed(1)}" r="3.4" fill="${T.bead}" stroke="${T.stops[3]}" stroke-width="0.6"/>`; }).join('');
    return `<g transform="translate(${x} ${y}) rotate(${a})">${inner}</g>`;
  }).join('');
}
function crownArt(id: string, T: FrameTier): string {
  const m = W_ / 2; let rays = '';
  for (let i = -2; i <= 2; i++) { const x = m + i * 17; rays += `<path d="M${x} 18 L${x - 8} 52 L${x + 8} 52 Z" fill="url(#${id}-m)" stroke="${T.stops[3]}" stroke-width="1"/>`; }
  return `<g>${rays}${gemShape(m, 30, 12, id, T)}</g>`;
}
export function renderFrame(rarityKey: string, id: string): string {
  const T = FRAME_TIERS[rarityKey] || FRAME_TIERS.common, s0 = T.stops;
  let s = `<defs>
    <linearGradient id="${id}-m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s0[0]}"/><stop offset="0.2" stop-color="${s0[1]}"/><stop offset="0.58" stop-color="${s0[2]}"/><stop offset="1" stop-color="${s0[3]}"/></linearGradient>
    <linearGradient id="${id}-mi" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${s0[0]}"/><stop offset="0.45" stop-color="${s0[1]}"/><stop offset="1" stop-color="${s0[3]}"/></linearGradient>
    <radialGradient id="${id}-gem" cx="0.36" cy="0.3" r="0.85"><stop offset="0" stop-color="#ffffff"/><stop offset="0.22" stop-color="${T.gem0}"/><stop offset="1" stop-color="${T.gem1}"/></radialGradient>
  </defs>`;
  s += `<path d="${ringPath(14, 90)}" fill="${s0[3]}" fill-rule="evenodd"/>`;
  s += `<path d="${ringPath(28, 56)}" fill="url(#${id}-m)" fill-rule="evenodd"/>`;
  s += `<path d="${ringPath(14, 13)}" fill="url(#${id}-mi)" fill-rule="evenodd"/>`;
  s += `<path d="${ringPath(85, 13)}" fill="url(#${id}-mi)" fill-rule="evenodd"/>`;
  s += `<rect x="14" y="14" width="${W_ - 28}" height="${W_ - 28}" fill="none" stroke="${s0[0]}" stroke-width="1.4" stroke-opacity="0.55"/>`;
  s += `<rect x="104" y="104" width="${W_ - 208}" height="${W_ - 208}" fill="none" stroke="${s0[3]}" stroke-width="2.2"/>`;
  s += beadCourse(26, 4.2, 17, T.bead, s0[3]);
  s += beadCourse(92, 3.2, 13, T.bead, s0[3]);
  if (T.rope) s += ropeCourse(42, s0[0], s0[3]);
  if (T.dentil) s += dentilCourse(70, T.bead, s0[3]);
  s += cornerArt(rarityKey, T);
  s += gemsLayout(T, id);
  if (T.crown) s += crownArt(id, T);
  return s;
}
export function fullFrameSVG(rarityKey: string, id?: string): string {
  return `<svg viewBox="0 0 1000 1000" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none" xmlns="http://www.w3.org/2000/svg">${renderFrame(rarityKey, id || 'fr')}</svg>`;
}

// ---------- Monogram "М" (house crest) ----------
export function renderMonogram(id?: string): string {
  const ip = id || 'mono';
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
    <defs>
      <linearGradient id="${ip}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf3ce"/><stop offset="0.42" stop-color="#e7c869"/><stop offset="0.7" stop-color="#caa23d"/><stop offset="1" stop-color="#9a7620"/></linearGradient>
      <radialGradient id="${ip}-bg" cx="0.5" cy="0.4" r="0.7"><stop offset="0" stop-color="#241c12"/><stop offset="1" stop-color="#100c07"/></radialGradient>
    </defs>
    <circle cx="50" cy="50" r="47" fill="url(#${ip}-bg)"/>
    <circle cx="50" cy="50" r="47" fill="none" stroke="url(#${ip}-g)" stroke-width="2.6"/>
    <circle cx="50" cy="50" r="42" fill="none" stroke="#caa23d" stroke-width="0.8" stroke-opacity="0.55"/>
    <circle cx="50" cy="50" r="39" fill="none" stroke="#caa23d" stroke-width="1.4" stroke-dasharray="0.6 4.2" stroke-opacity="0.6"/>
    <g fill="url(#${ip}-g)">
      <path d="M30 70 L30 34 L36 34 L50 56 L64 34 L70 34 L70 70 L63 70 L63 46 L52 63 L48 63 L37 46 L37 70 Z"/>
    </g>
    <path d="M30 70 L30 34 L36 34 L50 56 L64 34 L70 34 L70 70 L63 70 L63 46 L52 63 L48 63 L37 46 L37 70 Z" fill="none" stroke="#7c5f17" stroke-width="0.6" stroke-opacity="0.5"/>
    <path d="M50 14 l2.4 4.4 4.4 -2 -2 4.4 4.4 2.4 -4.4 2.4 2 4.4 -4.4 -2 -2.4 4.4 -2.4 -4.4 -4.4 2 2 -4.4 -4.4 -2.4 4.4 -2.4 -2 -4.4 4.4 2 Z" fill="url(#${ip}-g)" transform="translate(0 0) scale(0.42)" transform-origin="50 18" opacity="0.95"/>
    <path d="M36 82 Q50 89 64 82" fill="none" stroke="url(#${ip}-g)" stroke-width="1.6"/>
    <circle cx="33" cy="80" r="1.6" fill="#e7c869"/><circle cx="67" cy="80" r="1.6" fill="#e7c869"/>
  </svg>`;
}

// ---------- Certificate seal (rarity depends on cert) ----------
export function renderSeal(id: string, cert?: Cert): string {
  const ip = id || 'seal';
  const ct = cert || { title: 'ПОДЛИННИК', hi: '#fbeec0', mid: '#dcb74e', lo: '#9a7620', ink: '#3a2c10', idx: 1 } as Cert;
  let ticks = '';
  for (let i = 0; i < 72; i++) { const a = (i / 72) * Math.PI * 2; const r1 = 70, r2 = i % 2 ? 76 : 79; ticks += `<line x1="${(100 + Math.cos(a) * r1).toFixed(1)}" y1="${(100 + Math.sin(a) * r1).toFixed(1)}" x2="${(100 + Math.cos(a) * r2).toFixed(1)}" y2="${(100 + Math.sin(a) * r2).toFixed(1)}" stroke="${ct.lo}" stroke-width="1"/>`; }
  let star = '';
  const pts = ct.idx >= 3 ? 12 : 8;
  for (let i = 0; i < pts * 2; i++) { const a = -Math.PI / 2 + (i * Math.PI) / pts; const rr = i % 2 === 0 ? 30 : 13; star += (i === 0 ? 'M' : 'L') + (100 + Math.cos(a) * rr).toFixed(1) + ' ' + (100 + Math.sin(a) * rr).toFixed(1) + ' '; }
  const title = ct.title + ' · МОЗОЛЕУМ · ' + ct.title + ' · ';
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
    <defs>
      <radialGradient id="${ip}-g" cx="0.4" cy="0.34" r="0.85"><stop offset="0" stop-color="${ct.hi}"/><stop offset="0.5" stop-color="${ct.mid}"/><stop offset="1" stop-color="${ct.lo}"/></radialGradient>
      <path id="${ip}-arc" d="M100 100 m-58 0 a58 58 0 1 1 116 0 a58 58 0 1 1 -116 0" fill="none"/>
    </defs>
    <circle cx="100" cy="100" r="94" fill="#13100a" stroke="${ct.mid}" stroke-width="2"/>
    <circle cx="100" cy="100" r="86" fill="url(#${ip}-g)" stroke="${ct.lo}" stroke-width="2"/>
    ${ticks}
    <circle cx="100" cy="100" r="58" fill="none" stroke="${ct.lo}" stroke-width="1.5"/>
    <circle cx="100" cy="100" r="52" fill="#16120b"/>
    <path d="${star}Z" fill="url(#${ip}-g)" stroke="${ct.lo}" stroke-width="1"/>
    <text x="100" y="104" font-family="'Space Mono',monospace" font-size="13" font-weight="700" letter-spacing="1" fill="${ct.hi}" text-anchor="middle">${escapeXml(ct.title)}</text>
    <text font-family="'Space Mono',monospace" font-size="11.5" font-weight="700" letter-spacing="2.5" fill="${ct.ink}"><textPath href="#${ip}-arc" startOffset="1%">${escapeXml(title)}</textPath></text>
  </svg>`;
}

// ---------- Locator: which body part the callus is on ----------
const LOCATOR_ICON: Record<string, { d: string; m: [number, number] }> = {
  palm:    { d: 'M58 132 Q52 96 60 78 L64 44 Q65 36 73 36 Q80 36 81 44 L84 70 L88 38 Q89 30 97 30 Q104 30 105 38 L107 70 L111 40 Q112 32 120 32 Q127 32 128 40 L130 72 L136 54 Q139 46 146 49 Q153 52 150 60 L138 92 Q136 118 122 132 Q90 146 58 132 Z', m: [98, 96] },
  palms:   { d: 'M58 132 Q52 96 60 78 L64 44 Q65 36 73 36 Q80 36 81 44 L84 70 L88 38 Q89 30 97 30 Q104 30 105 38 L107 70 L111 40 Q112 32 120 32 Q127 32 128 40 L130 72 L136 54 Q139 46 146 49 Q153 52 150 60 L138 92 Q136 118 122 132 Q90 146 58 132 Z', m: [98, 96] },
  fingers: { d: 'M78 140 L76 56 Q76 38 92 38 Q108 38 108 58 L108 140 Z M118 140 L116 44 Q116 26 132 26 Q148 26 148 46 L148 140 Z', m: [92, 60] },
  thumb:   { d: 'M60 140 Q48 104 70 82 Q88 60 122 54 Q150 50 158 70 Q164 86 150 96 Q126 116 116 138 Z M96 96 Q116 78 140 72', m: [140, 74] },
  foot:    { d: 'M74 138 Q50 124 54 96 Q58 70 82 62 Q92 38 118 34 Q146 30 156 56 Q164 80 146 92 L136 116 Q130 138 110 142 Q92 146 74 138 Z', m: [120, 60] },
  face:    { d: 'M132 30 Q72 30 56 92 Q49 120 78 132 M62 78 L92 78 M70 110 Q92 122 120 118', m: [70, 60] },
};
export function renderLocator(c: Callus, _id?: string): string {
  const ic = LOCATOR_ICON[c.silhouette] || LOCATOR_ICON.palm;
  const loc = (c.loc || '').toUpperCase();
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
    <rect x="6" y="6" width="188" height="188" rx="10" fill="rgba(16,14,10,0.78)" stroke="rgba(212,175,55,0.5)" stroke-width="1.5"/>
    <text x="18" y="28" font-family="'Space Mono',monospace" font-size="11" letter-spacing="2" fill="#8a8170">ЛОКАЦИЯ</text>
    <g transform="translate(8 14) scale(0.86)">
      <path d="${ic.d}" fill="none" stroke="#caa23d" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${ic.m[0]}" cy="${ic.m[1]}" r="11" fill="none" stroke="#e05a45" stroke-width="2.5"/>
      <circle cx="${ic.m[0]}" cy="${ic.m[1]}" r="4" fill="#e05a45"/>
      <line x1="${ic.m[0] - 18}" y1="${ic.m[1]}" x2="${ic.m[0] - 6}" y2="${ic.m[1]}" stroke="#e05a45" stroke-width="2"/>
      <line x1="${ic.m[0] + 6}" y1="${ic.m[1]}" x2="${ic.m[0] + 18}" y2="${ic.m[1]}" stroke="#e05a45" stroke-width="2"/>
    </g>
    <text x="100" y="186" font-family="'Space Grotesk',sans-serif" font-size="15" font-weight="600" letter-spacing="0.5" fill="#efe7d4" text-anchor="middle">${escapeXml(loc)}</text>
  </svg>`;
}
export function fullLocatorSVG(c: Callus, id?: string): string {
  return renderLocator(c, id);
}

// ---------- Export card (for PNG) ----------
export function buildExportSVG(c: Callus, styleKey: string, signature?: string): string {
  const W = 1080, H = 1350;
  const r = c.rarity;
  const starsStr = '★★★★★'.slice(0, r.stars) + '☆☆☆☆☆'.slice(0, 5 - r.stars);
  const sig = signature ? `<text x="${W / 2}" y="1232" font-family="Georgia,serif" font-style="italic" font-size="26" fill="#9a9078" text-anchor="middle">— ${escapeXml(signature)}</text>` : '';
  const art = `<svg x="120" y="150" width="840" height="840" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet">${renderArt(c, styleKey, 'exp' + c.seed.toString(36))}</svg>`;
  const frame = `<svg x="120" y="150" width="840" height="840" viewBox="0 0 1000 1000" preserveAspectRatio="none">${renderFrame(c.rarity.key, 'expf')}</svg>`;
  const seal = `<svg x="836" y="834" width="150" height="150" viewBox="0 0 200 200">${renderSeal('exps', c.cert).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</svg>`;
  // Location nameplate on the frame's lower rail — matches the on-screen card.
  const loc = (c.loc || '').toUpperCase();
  const npW = 360, npH = 66, npX = (W - npW) / 2, npY = 150 + 840 - 96;
  const nameplate = `<g>
    <rect x="${npX}" y="${npY}" width="${npW}" height="${npH}" rx="7" fill="#1d160c" stroke="#caa23d" stroke-width="2"/>
    <rect x="${npX + 3}" y="${npY + 3}" width="${npW - 6}" height="${npH - 6}" rx="5" fill="none" stroke="rgba(255,236,180,0.18)" stroke-width="1"/>
    <text x="${W / 2}" y="${npY + 25}" font-family="'Space Mono',monospace" font-size="14" letter-spacing="4" fill="#b89a52" text-anchor="middle">ЛОКАЦИЯ</text>
    <text x="${W / 2}" y="${npY + 52}" font-family="Playfair Display,serif" font-weight="600" font-size="26" letter-spacing="1" fill="#f6ead0" text-anchor="middle">${escapeXml(loc)}</text>
  </g>`;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="#100f0d"/>
    <rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="#16130e" stroke="${r.color}" stroke-width="5" ${r.glow ? `filter="url(#exglow)"` : ''}/>
    <defs><filter id="exglow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <g>
      <line x1="306" y1="74" x2="454" y2="74" stroke="#caa23d" stroke-width="1" stroke-opacity="0.45"/>
      <line x1="626" y1="74" x2="774" y2="74" stroke="#caa23d" stroke-width="1" stroke-opacity="0.45"/>
      <path d="M454 74 l8 -6 8 6 -8 6 z" fill="#caa23d"/>
      <path d="M610 74 l8 -6 8 6 -8 6 z" fill="#caa23d"/>
      <svg x="500" y="34" width="80" height="80" viewBox="0 0 100 100">${renderMonogram('expm').replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</svg>
      <text x="${W / 2}" y="142" font-family="Georgia,'Times New Roman',serif" font-weight="bold" font-size="32" letter-spacing="9" fill="#e8c252" text-anchor="middle">МОЗОЛЕУМ</text>
    </g>
    <rect x="120" y="150" width="840" height="840" fill="#0d0c0a" stroke="${r.soft}" stroke-width="2"/>
    ${art}
    ${frame}
    ${nameplate}
    ${seal}
    <text x="${W / 2}" y="1058" font-family="Helvetica,Arial,sans-serif" font-size="26" letter-spacing="6" fill="${r.color}" text-anchor="middle">${r.label.toUpperCase()} · ${starsStr}</text>
    <text x="${W / 2}" y="1118" font-family="Georgia,serif" font-size="56" fill="#efe7d4" text-anchor="middle">«${escapeXml(c.name.folk)}»</text>
    <text x="${W / 2}" y="1158" font-family="Georgia,serif" font-style="italic" font-size="28" fill="#caa23d" text-anchor="middle">${escapeXml(c.name.latin)}</text>
    <text x="${W / 2}" y="1196" font-family="Helvetica,Arial,sans-serif" font-size="22" fill="#9a9078" text-anchor="middle">${escapeXml(c.stage)} · ${c.name.degree} ст. · в строю с ${c.name.year}</text>
    ${sig}
    <text x="${W / 2}" y="1300" font-family="Georgia,serif" font-style="italic" font-size="24" fill="#7a7468" text-anchor="middle">«${escapeXml(c.name.motto)}»</text>
  </svg>`;
}

export function escapeXml(s: unknown): string {
  return String(s).replace(/[<>&"']/g, (ch) => (({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' } as Record<string, string>)[ch]));
}
