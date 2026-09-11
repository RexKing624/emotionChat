import { cleanModelReply } from './message-format.js';
const normalize = text => cleanModelReply(text).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const grams = text => new Set(Array.from({ length: Math.max(0, text.length - 2) }, (_, i) => text.slice(i, i + 3)));
export function isRepetitive(candidate, history) {
  const text = normalize(candidate);
  if (!text) return false;
  const a = grams(text);
  return history.filter(m => m.role === 'assistant').slice(-16).some(message => {
    const old = normalize(message.content);
    if (text === old) return true;
    if (Math.min(text.length, old.length) < 12) return false;
    if (text.includes(old) || old.includes(text)) return true;
    const b = grams(old);
    let overlap = 0;
    for (const gram of a) if (b.has(gram)) overlap++;
    return 2 * overlap / (a.size + b.size) >= 0.48 || overlap / Math.min(a.size, b.size) >= 0.7;
  });
}
