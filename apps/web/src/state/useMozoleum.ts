import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildCallus,
  fullArtSVG,
  fullFrameSVG,
  renderSeal,
  rollSeed,
  type Callus,
  type StyleKey,
} from '@mozoleum/engine';
import { ls, lsRaw, save } from '../lib/storage';
import { ease } from '../lib/anim';
import { fetchMotto } from '../lib/api';
import { getCardBlob, fileSafeName } from '../lib/card';

export type Screen = 'intro' | 'generator' | 'hall';

export interface Config {
  originId: number;
  seed: number;
  styleKey: StyleKey;
}

export interface Celebrate {
  cheer: string;
  color: string;
  idx: number;
}

export interface CollectionLot {
  k: string;
  o: number;
  s: number;
  sy: StyleKey;
  folk: string;
  rk: string;
  rl: string;
  stars: number;
}

const STYLE_KEYS: StyleKey[] = ['heraldry', 'botanical', 'topo'];
function randomStyle(): StyleKey {
  return STYLE_KEYS[Math.floor(Math.random() * 3)];
}
function randomOriginId(): number {
  return 1 + Math.floor(Math.random() * 40);
}

export function useMozoleum() {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>('intro');
  const [introProgress, setIntroProgress] = useState(0);

  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);

  const [callus, setCallus] = useState<Callus | null>(null);
  const [config, setConfig] = useState<Config>({
    originId: randomOriginId(),
    seed: rollSeed(),
    styleKey: 'heraldry',
  });

  const [celebrate, setCelebrate] = useState<Celebrate | null>(null);
  const [celebrateProgress, setCelebrateProgress] = useState(0);

  const [balance, setBalance] = useState<number>(() => ls('balance', 500));
  const [count, setCount] = useState<number>(() => ls('count', 0));
  const [unlocks, setUnlocks] = useState<string[]>(() => ls('unlocks', []));
  const [signature, setSignature] = useState<string>(() => ls('sig', ''));
  const [collection, setCollection] = useState<CollectionLot[]>(() => ls('collection', []));

  const [shopOpen, setShopOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; msg: string }>({ visible: false, msg: '' });

  const [artKey, setArtKey] = useState(0);
  const [fxPhase, setFxPhase] = useState(0);
  const [revealFx, setRevealFx] = useState(0);

  // ── Refs for latest values inside async callbacks ─────────────────────────
  const configRef = useRef(config);
  configRef.current = config;
  const callusRef = useRef(callus);
  callusRef.current = callus;
  const balanceRef = useRef(balance);
  balanceRef.current = balance;
  const screenRef = useRef(screen);
  screenRef.current = screen;

  // ── rAF animation registry ────────────────────────────────────────────────
  const rafs = useRef<Record<string, number>>({});
  const toastT = useRef<number | undefined>(undefined);

  const animate = useCallback(
    (key: string, dur: number, setter: (p: number) => void, done?: () => void) => {
      if (rafs.current[key]) cancelAnimationFrame(rafs.current[key]);
      const start = performance.now();
      const tick = () => {
        const p = Math.min(1, (performance.now() - start) / dur);
        setter(p);
        if (p < 1) {
          rafs.current[key] = requestAnimationFrame(tick);
        } else {
          delete rafs.current[key];
          done?.();
        }
      };
      rafs.current[key] = requestAnimationFrame(tick);
    },
    [],
  );

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    if (toastT.current) clearTimeout(toastT.current);
    setToast({ visible: true, msg });
    toastT.current = window.setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2600);
  }, []);

  const earn = useCallback(
    (amount: number, msg?: string) => {
      setBalance((b) => {
        const nb = b + amount;
        save('balance', nb);
        balanceRef.current = nb;
        return nb;
      });
      if (msg) showToast(msg);
    },
    [showToast],
  );

  // ── FX perimeter loop ──────────────────────────────────────────────────────
  const startFx = useCallback(() => {
    if (rafs.current.fx) cancelAnimationFrame(rafs.current.fx);
    delete rafs.current.fx;
    const c = callusRef.current;
    if (!c || screenRef.current !== 'generator') return;
    const periods: Record<string, number> = {
      common: 5200,
      uncommon: 4400,
      heroic: 3400,
      legendary: 2600,
      mythic: 2000,
    };
    const start = performance.now();
    const period = periods[c.rarity.key] || 4000;
    const tick = () => {
      setFxPhase(((performance.now() - start) % period) / period);
      rafs.current.fx = requestAnimationFrame(tick);
    };
    rafs.current.fx = requestAnimationFrame(tick);
  }, []);

  const stopFx = useCallback(() => {
    if (rafs.current.fx) cancelAnimationFrame(rafs.current.fx);
    delete rafs.current.fx;
    setFxPhase(0);
  }, []);

  // ── LLM motto enrichment ────────────────────────────────────────────────────
  const maybeEnrich = useCallback((c: Callus) => {
    const seed = c.seed;
    fetchMotto(c.name.folk).then((motto) => {
      if (!motto) return;
      setCallus((cur) =>
        cur && cur.seed === seed ? { ...cur, name: { ...cur.name, motto } } : cur,
      );
    });
  }, []);

  // ── Collection ──────────────────────────────────────────────────────────────
  const addToCollection = useCallback((c: Callus) => {
    setCollection((prev) => {
      const key = c.originId + '-' + c.seed;
      let col = prev.filter((x) => x.k !== key);
      col.unshift({
        k: key,
        o: c.originId,
        s: c.seed,
        sy: configRef.current.styleKey,
        folk: c.name.folk,
        rk: c.rarity.key,
        rl: c.rarity.label,
        stars: c.rarity.stars,
      });
      col = col.slice(0, 48);
      save('collection', col);
      return col;
    });
  }, []);

  // ── Celebration ─────────────────────────────────────────────────────────────
  const triggerCelebrate = useCallback(
    (rarity: Callus['rarity']) => {
      const dur = rarity.idx >= 3 ? 2400 : 1800;
      setCelebrate({ cheer: rarity.cheer || '', color: rarity.color, idx: rarity.idx });
      setCelebrateProgress(0);
      animate('cel', dur, setCelebrateProgress, () => setCelebrate(null));
    },
    [animate],
  );

  const dismissCelebrate = useCallback(() => {
    if (rafs.current.cel) cancelAnimationFrame(rafs.current.cel);
    delete rafs.current.cel;
    setCelebrate(null);
  }, []);

  // ── Generation ──────────────────────────────────────────────────────────────
  const afterGenerate = useCallback(
    (c: Callus, reason: string) => {
      setCount((n) => {
        const nn = n + 1;
        save('count', nn);
        return nn;
      });
      save('cfg', configRef.current);
      addToCollection(c);
      if (reason === 'reroll') earn(2);
      if (!ls('first', false)) {
        save('first', true);
        earn(50, 'Первая мозоль: +50 ₥');
      }
      if (c.rarity.idx >= 2) {
        triggerCelebrate(c.rarity);
        setRevealFx(1);
        animate('rv', 480, (p) => setRevealFx(1 - ease(p)));
      }
      startFx();
      maybeEnrich(c);
    },
    [addToCollection, earn, triggerCelebrate, animate, startFx, maybeEnrich],
  );

  const doGenerate = useCallback(
    (cfg: Config, reason: string) => {
      const built = buildCallus({ originId: cfg.originId, seed: cfg.seed });
      if (reason === 'silent') {
        setCallus(built);
        callusRef.current = built;
        setArtKey((k) => k + 1);
        maybeEnrich(built);
        return;
      }
      const dur = reason === 'init' ? 820 : 720;
      stopFx();
      setGenerating(true);
      // On a narrow (stacked) layout the showcase is above the controls, so a
      // user-triggered roll plays off-screen. Scroll it into view so the
      // "Лепка мозоли" animation + reveal are actually seen.
      if (
        (reason === 'reroll' || reason === 'random' || reason === 'param') &&
        typeof window !== 'undefined' &&
        window.innerWidth < 900
      ) {
        setTimeout(
          () => document.getElementById('mz-showcase')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
          0,
        );
      }
      setGenProgress(0);
      setCelebrate(null);
      setRevealFx(0);
      animate('gen', dur, setGenProgress, () => {
        setCallus(built);
        callusRef.current = built;
        setGenerating(false);
        setArtKey((k) => k + 1);
        afterGenerate(built, reason);
      });
    },
    [animate, stopFx, afterGenerate, maybeEnrich],
  );

  const patch = useCallback(
    (part: Partial<Config>, reason: string) => {
      const next = { ...configRef.current, ...part };
      configRef.current = next;
      setConfig(next);
      doGenerate(next, reason);
    },
    [doGenerate],
  );

  // ── Public actions ───────────────────────────────────────────────────────────
  const reroll = useCallback(() => patch({ seed: rollSeed() }, 'reroll'), [patch]);
  const randomAll = useCallback(
    () => patch({ originId: randomOriginId(), seed: rollSeed(), styleKey: randomStyle() }, 'random'),
    [patch],
  );
  const onOrigin = useCallback((id: number) => patch({ originId: id }, 'param'), [patch]);

  const selectStyle = useCallback((key: StyleKey) => {
    setConfig((prev) => {
      const next = { ...prev, styleKey: key };
      configRef.current = next;
      save('cfg', next);
      return next;
    });
    setArtKey((k) => k + 1);
  }, []);

  const runIntro = useCallback(() => {
    setIntroProgress(0);
    animate('intro', 1700, setIntroProgress);
  }, [animate]);

  const skipIntro = useCallback(() => {
    if (rafs.current.intro) cancelAnimationFrame(rafs.current.intro);
    delete rafs.current.intro;
    setIntroProgress(1);
  }, []);

  const gotoGenerator = useCallback(() => {
    setScreen('generator');
    screenRef.current = 'generator';
    setShareOpen(false);
    startFx();
    if (!callusRef.current) doGenerate(configRef.current, 'init');
  }, [doGenerate, startFx]);

  const gotoHall = useCallback(() => {
    stopFx();
    setScreen('hall');
    screenRef.current = 'hall';
  }, [stopFx]);

  const gotoIntro = useCallback(() => {
    stopFx();
    setScreen('intro');
    screenRef.current = 'intro';
    runIntro();
  }, [stopFx, runIntro]);

  const loadLot = useCallback(
    (lot: CollectionLot) => {
      const next: Config = { originId: lot.o, seed: lot.s, styleKey: lot.sy || 'heraldry' };
      configRef.current = next;
      setConfig(next);
      setScreen('generator');
      screenRef.current = 'generator';
      doGenerate(next, 'init');
    },
    [doGenerate],
  );

  // ── Shop ─────────────────────────────────────────────────────────────────────
  const openShop = useCallback(() => setShopOpen(true), []);
  const closeShop = useCallback(() => setShopOpen(false), []);
  const buy = useCallback(
    (key: string, price: number, label: string) => {
      if (unlocks.includes(key)) return;
      if (balanceRef.current < price) {
        showToast('Не хватает Мозобаксов — перекатывайте ещё!');
        return;
      }
      setBalance((b) => {
        const nb = b - price;
        save('balance', nb);
        balanceRef.current = nb;
        return nb;
      });
      setUnlocks((prev) => {
        const next = [...prev, key];
        save('unlocks', next);
        return next;
      });
      showToast('Стиль «' + label + '» зарезервирован за вами!');
    },
    [unlocks, showToast],
  );

  // ── Share ─────────────────────────────────────────────────────────────────────
  const openShare = useCallback(() => setShareOpen(true), []);
  const closeShare = useCallback(() => setShareOpen(false), []);

  const onSig = useCallback((value: string) => {
    save('sig', value);
    setSignature(value);
  }, []);

  const shareLink = useCallback(() => {
    const cfg = configRef.current;
    return location.origin + location.pathname + '#o=' + cfg.originId + '&s=' + cfg.seed + '&sy=' + cfg.styleKey;
  }, []);
  const shareText = useCallback(() => {
    const c = callusRef.current;
    return c
      ? 'Мне выпала почётная мозоль «' + c.name.folk + '» (' + c.rarity.label + ') в МОЗОЛЕУМе. Зацени и страдай с честью:'
      : 'Зацени МОЗОЛЕУМ:';
  }, []);

  const shareTelegram = useCallback(() => {
    window.open(
      'https://t.me/share/url?url=' + encodeURIComponent(shareLink()) + '&text=' + encodeURIComponent(shareText()),
      '_blank',
    );
    showToast('Открываю Telegram…');
  }, [shareLink, shareText, showToast]);

  const shareWhatsApp = useCallback(() => {
    window.open('https://wa.me/?text=' + encodeURIComponent(shareText() + ' ' + shareLink()), '_blank');
    showToast('Открываю WhatsApp…');
  }, [shareLink, shareText, showToast]);

  const copyLink = useCallback(() => {
    const t = shareText() + ' ' + shareLink();
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(t).then(
        () => showToast('Ссылка скопирована'),
        () => showToast(shareLink()),
      );
    } else {
      showToast(shareLink());
    }
  }, [shareText, shareLink, showToast]);

  const download = useCallback(async () => {
    const c = callusRef.current;
    if (!c) return;
    try {
      const b = await getCardBlob(c, configRef.current.styleKey, signature);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = fileSafeName(c.name.folk) + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      showToast('Карточка скачана');
    } catch {
      showToast('Не удалось собрать карточку');
    }
  }, [signature, showToast]);

  const webShare = useCallback(async () => {
    const c = callusRef.current;
    if (!c) return;
    try {
      const blob = await getCardBlob(c, configRef.current.styleKey, signature);
      const file = new File([blob], 'mozoleum.png', { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText(), url: shareLink() });
      } else {
        await navigator.share({ text: shareText(), url: shareLink() });
      }
    } catch {
      /* user cancelled */
    }
  }, [signature, shareText, shareLink]);

  const hasWebShare = typeof navigator !== 'undefined' && !!navigator.share;

  // ── Mount: read hash, daily bonus, first generation ──────────────────────────
  useEffect(() => {
    let cfg: Config = { ...configRef.current };
    let startScreen: Screen = 'intro';
    const h = location.hash;
    const m = (k: string) => {
      const r = new RegExp(k + '=([^&]+)').exec(h);
      return r ? decodeURIComponent(r[1]) : null;
    };
    if (h && m('s')) {
      cfg.originId = Number(m('o')) || cfg.originId;
      cfg.seed = (Number(m('s')) >>> 0) || cfg.seed;
      cfg.styleKey = (m('sy') as StyleKey) || 'heraldry';
      startScreen = 'generator';
    } else {
      cfg.originId = randomOriginId();
      cfg.seed = rollSeed();
      cfg.styleKey = randomStyle();
    }

    if (lsRaw('balance') == null) {
      save('balance', 500);
      setBalance(500);
      balanceRef.current = 500;
    }
    const today = new Date().toISOString().slice(0, 10);
    if (ls<string | null>('lastday', null) !== today) {
      save('lastday', today);
      if (lsRaw('balance') != null) {
        const b = balanceRef.current + 30;
        save('balance', b);
        setBalance(b);
        balanceRef.current = b;
        setTimeout(() => showToast('Ежедневный заход: +30 ₥'), 1600);
      }
    }

    configRef.current = cfg;
    setConfig(cfg);
    setScreen(startScreen);
    screenRef.current = startScreen;
    setReady(true);
    doGenerate(cfg, startScreen === 'generator' ? 'init' : 'silent');
    if (startScreen === 'intro') runIntro();

    return () => {
      const map = rafs.current;
      Object.values(map).forEach((id) => cancelAnimationFrame(id));
      if (toastT.current) clearTimeout(toastT.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Memoized SVG strings (stable so FX ticks don't redraw the canvas) ────────
  const memoHtml = useMemo(() => {
    if (!callus) return { artHtml: '', frameHtml: '', sealHtml: '' };
    return {
      artHtml: fullArtSVG(callus, config.styleKey, 'live' + artKey),
      frameHtml: fullFrameSVG(callus.rarity.key, 'frlive' + artKey),
      sealHtml: renderSeal('sealLive' + artKey, callus.cert),
    };
  }, [callus, config.styleKey, artKey]);

  return {
    // state
    ready,
    screen,
    introProgress,
    generating,
    genProgress,
    callus,
    config,
    celebrate,
    celebrateProgress,
    balance,
    count,
    unlocks,
    signature,
    collection,
    shopOpen,
    shareOpen,
    toast,
    fxPhase,
    revealFx,
    hasWebShare,
    memoHtml,
    // actions
    reroll,
    randomAll,
    onOrigin,
    selectStyle,
    skipIntro,
    gotoGenerator,
    gotoHall,
    gotoIntro,
    loadLot,
    openShop,
    closeShop,
    buy,
    openShare,
    closeShare,
    onSig,
    shareTelegram,
    shareWhatsApp,
    copyLink,
    download,
    webShare,
    dismissCelebrate,
  };
}

export type MozoleumStore = ReturnType<typeof useMozoleum>;
