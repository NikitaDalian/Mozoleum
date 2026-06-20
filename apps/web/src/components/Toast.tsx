import type { MozoleumStore } from '../state/useMozoleum';

export function Toast({ store }: { store: MozoleumStore }) {
  if (!store.toast.visible) return null;
  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 34,
        zIndex: 90,
        background: '#1b1711',
        border: '1px solid rgba(212,175,55,.45)',
        color: '#f3e7c8',
        padding: '13px 22px',
        borderRadius: 999,
        fontFamily: "'Space Grotesk'",
        fontSize: 13.5,
        boxShadow: '0 14px 40px rgba(0,0,0,.5)',
        transform: 'translateX(-50%)',
        whiteSpace: 'nowrap',
      }}
    >
      {store.toast.msg}
    </div>
  );
}
