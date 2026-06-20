import { useState, type CSSProperties, type ReactNode, type MouseEventHandler } from 'react';

interface FxButtonProps {
  base: CSSProperties;
  hover?: CSSProperties;
  active?: CSSProperties;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children?: ReactNode;
  title?: string;
  type?: 'button' | 'submit';
  'aria-label'?: string;
}

/**
 * Button that merges hover/active style deltas onto a base inline style —
 * a faithful port of the prototype's style-hover / style-active attributes.
 */
export function FxButton({ base, hover, active, onClick, children, title, type = 'button', ...rest }: FxButtonProps) {
  const [h, setH] = useState(false);
  const [a, setA] = useState(false);
  const style: CSSProperties = { ...base, ...(h && hover ? hover : {}), ...(a && active ? active : {}) };
  return (
    <button
      type={type}
      title={title}
      aria-label={rest['aria-label']}
      style={style}
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => {
        setH(false);
        setA(false);
      }}
      onPointerDown={() => setA(true)}
      onPointerUp={() => setA(false)}
      onPointerCancel={() => setA(false)}
    >
      {children}
    </button>
  );
}
