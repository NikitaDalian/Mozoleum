import Anthropic from '@anthropic-ai/sdk';

const API_KEY = process.env.ANTHROPIC_API_KEY || '';
const MODEL = process.env.MOTTO_MODEL || 'claude-haiku-4-5-20251001';

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: API_KEY });
  return client;
}

export function mottoEnrichmentEnabled(): boolean {
  return !!API_KEY;
}

function cleanMotto(raw: string): string {
  return String(raw)
    .trim()
    .replace(/^[«"'\s]+|[»"'.\s]+$/g, '')
    .split('\n')[0]
    .slice(0, 60);
}

/**
 * Ask the LLM for one absurd, pompous heraldic motto for a given callus name.
 * Returns null when no key is configured or on any failure — the caller then
 * keeps the deterministic curated motto, so the site never breaks.
 */
export async function generateMotto(folk: string): Promise<string | null> {
  const anthropic = getClient();
  if (!anthropic) return null;
  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 40,
      messages: [
        {
          role: 'user',
          content:
            'Придумай ОДИН короткий абсурдно-пафосный геральдический девиз ' +
            '(3–6 слов, по-русски, без кавычек и пояснений) для шуточной ' +
            'почётной мозоли под названием «' + folk + '».',
        },
      ],
    });
    const block = msg.content.find((b) => b.type === 'text') as
      | { type: 'text'; text: string }
      | undefined;
    if (!block || !block.text) return null;
    const motto = cleanMotto(block.text);
    return motto || null;
  } catch (err) {
    console.error('[motto] enrichment failed:', err);
    return null;
  }
}
