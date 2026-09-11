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
    // Catch repeated sign-offs even when the rest of the answer is different.
    const sentences = value => cleanModelReply(value).split(/[。！？!?\n]+/u).map(normalize).filter(part => part.length >= 12);
    const previousSentences = sentences(message.content);
    if (sentences(candidate).some(part => previousSentences.includes(part))) return true;
    if (Math.min(text.length, old.length) < 12) return false;
    if (text.includes(old) || old.includes(text)) return true;
    const b = grams(old);
    let overlap = 0;
    for (const gram of a) if (b.has(gram)) overlap++;
    return 2 * overlap / (a.size + b.size) >= 0.48 || overlap / Math.min(a.size, b.size) >= 0.7;
  });
}

// Remove only long, repeatedly used endings; preserve the new body and short catchphrases.
export function trimRepeatedEnding(candidate, history) {
  const split = value => cleanModelReply(value).match(/[^。！？!?\n]+[。！？!?]*(?:\n+|$)?/gu) || [];
  const old = history.filter(m => m.role === 'assistant').slice(-16).map(m => new Set(split(m.content).map(normalize)));
  const parts = split(candidate);
  while (parts.length > 1) {
    const ending = normalize(parts.at(-1));
    if (ending.length < 12 || old.filter(sentences => sentences.has(ending)).length < 2) break;
    parts.pop();
  }
  return parts.join('').trim();
}
