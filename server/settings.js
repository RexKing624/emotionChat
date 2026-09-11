import { promises as fs } from 'node:fs';
import path from 'node:path';
export const defaults = { proactiveEnabled: true, language: 'zh', name: 'Assistant', minMinutes: 10, maxMinutes: 30, quietStart: '23:00', quietEnd: '09:00' };
export function validateSettings(value) {
  if (!value || typeof value.name !== 'string' || !value.name.trim() || value.name.trim().length > 40 || /[\r\n]/.test(value.name)) throw new Error('名字需为 1–40 个字符');
  if (![value.minMinutes, value.maxMinutes].every(n => Number.isInteger(n) && n >= 1 && n <= 1440) || value.minMinutes > value.maxMinutes) throw new Error('等待时间需为 1–1440 分钟，最短不能大于最长');
  if (![value.quietStart, value.quietEnd].every(t => typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t))) throw new Error('请选择有效的免打扰时间');
  const language = value.language ?? 'zh';
  if (!['zh', 'ja', 'en'].includes(language)) throw new Error('Unsupported interface language');
  const proactiveEnabled = value.proactiveEnabled ?? true;
  if (typeof proactiveEnabled !== 'boolean') throw new Error('Invalid proactive setting');
  return { proactiveResumedAt: Number.isFinite(value.proactiveResumedAt) ? value.proactiveResumedAt : 0, proactiveEnabled, language, name: value.name.trim(), minMinutes: value.minMinutes, maxMinutes: value.maxMinutes, quietStart: value.quietStart, quietEnd: value.quietEnd };
}
export async function readSettings(file) {
  try { return validateSettings(JSON.parse(await fs.readFile(file, 'utf8'))); }
  catch (error) { if (error.code === 'ENOENT') return { ...defaults }; throw error; }
}
export async function writeSettings(file, settings) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(settings, null, 2));
  await fs.rename(temporary, file);
}
