const PREFIX = 'mozoleum_';

export function ls<T>(key: string, def: T): T {
  try {
    const v = localStorage.getItem(PREFIX + key);
    return v == null ? def : (JSON.parse(v) as T);
  } catch {
    return def;
  }
}

export function lsRaw(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function save<T>(key: string, v: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(v));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}
