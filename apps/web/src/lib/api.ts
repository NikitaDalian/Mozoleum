// Base URL for the МОЗОЛЕУМ API. Empty string = same origin (the server can
// serve both the static site and the API), with the Vite proxy handling /api
// in local dev.
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';

/**
 * Ask the backend for a fresh LLM motto. Returns null when the server has no
 * key configured or on any failure — callers keep the deterministic motto.
 */
export async function fetchMotto(folk: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/motto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folk }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { motto?: string | null };
    return data.motto ?? null;
  } catch {
    return null;
  }
}

/** Server-rendered PNG URL for a callus (used by share/download as a fallback). */
export function callusImageUrl(origin: number, seed: number, style: string, signature?: string): string {
  const q = new URLSearchParams({ origin: String(origin), seed: String(seed), style });
  if (signature) q.set('signature', signature);
  return `${API_BASE}/api/callus.png?${q.toString()}`;
}
