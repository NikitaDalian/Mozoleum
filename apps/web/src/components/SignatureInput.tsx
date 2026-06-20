import { useState } from 'react';

export function SignatureInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focus, setFocus] = useState(false);
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      placeholder="напр.: из коллекции И. Петрова"
      maxLength={42}
      style={{
        background: '#0e0d0b',
        color: '#efe7d4',
        border: '1px solid ' + (focus ? '#d4af37' : 'rgba(212,175,55,.22)'),
        borderRadius: 5,
        padding: '11px 12px',
        fontFamily: "'Space Grotesk'",
        fontSize: 13.5,
        outline: 'none',
      }}
    />
  );
}
