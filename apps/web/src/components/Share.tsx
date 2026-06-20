import { FxButton } from './FxButton';
import type { MozoleumStore } from '../state/useMozoleum';

export function Share({ store }: { store: MozoleumStore }) {
  if (!store.shareOpen) return null;
  return (
    <div onClick={store.closeShare} style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'rgba(8,7,6,.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#16130e', border: '1px solid rgba(212,175,55,.3)', borderRadius: 14, maxWidth: 420, width: '100%', padding: 26 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: '#f3e7c8' }}>Подарить страдальцу</div>
          <button onClick={store.closeShare} style={{ background: 'transparent', border: '1px solid rgba(212,175,55,.3)', color: '#d4af37', borderRadius: '50%', width: 34, height: 34, fontSize: 17, cursor: 'pointer', flex: 'none' }}>
            ✕
          </button>
        </div>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: '#8a8170', lineHeight: 1.6, margin: '10px 0 18px' }}>
          Уйдёт ссылка на этот экспонат + предложение скачать карточку-картинку, чтобы прикрепить в чат.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <FxButton
            onClick={store.shareTelegram}
            base={{ background: '#229ed9', color: '#fff', border: 'none', borderRadius: 9, padding: 14, fontFamily: "'Space Grotesk'", fontSize: 14, fontWeight: 600, cursor: 'pointer', letterSpacing: 0.5, transition: 'filter .15s ease' }}
            hover={{ filter: 'brightness(1.08)' }}
          >
            Telegram
          </FxButton>
          <FxButton
            onClick={store.shareWhatsApp}
            base={{ background: '#25d366', color: '#06351a', border: 'none', borderRadius: 9, padding: 14, fontFamily: "'Space Grotesk'", fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5, transition: 'filter .15s ease' }}
            hover={{ filter: 'brightness(1.06)' }}
          >
            WhatsApp
          </FxButton>
          <div style={{ display: 'flex', gap: 10 }}>
            <FxButton
              onClick={store.copyLink}
              base={{ flex: 1, background: 'transparent', color: '#e3d4a4', border: '1px solid rgba(212,175,55,.3)', borderRadius: 9, padding: 13, fontFamily: "'Space Grotesk'", fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background .15s ease' }}
              hover={{ background: 'rgba(212,175,55,.08)' }}
            >
              Копировать ссылку
            </FxButton>
            <FxButton
              onClick={store.download}
              base={{ flex: 1, background: 'transparent', color: '#e3d4a4', border: '1px solid rgba(212,175,55,.3)', borderRadius: 9, padding: 13, fontFamily: "'Space Grotesk'", fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background .15s ease' }}
              hover={{ background: 'rgba(212,175,55,.08)' }}
            >
              Скачать картинку
            </FxButton>
          </div>
          {store.hasWebShare && (
            <FxButton
              onClick={store.webShare}
              base={{ background: 'linear-gradient(180deg,#e8c252,#caa23d)', color: '#1a1208', border: 'none', borderRadius: 9, padding: 14, fontFamily: "'Space Grotesk'", fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5, transition: 'filter .15s ease' }}
              hover={{ filter: 'brightness(1.06)' }}
            >
              Поделиться картинкой…
            </FxButton>
          )}
        </div>
      </div>
    </div>
  );
}
