export function nextSchedule(previous, user, now = Date.now(), random = Math.random, settings = { minMinutes: 10, maxMinutes: 30 }) {
  if (!user) return null;
  const key = `${user.timestamp}:${user.content}`;
  const timing = `${settings.minMinutes}:${settings.maxMinutes}`;
  if (previous?.key === key && previous.timing === timing) return previous;
  return { key, timing, due: Math.max(Date.parse(user.timestamp), now) + (settings.minMinutes + random() * (settings.maxMinutes - settings.minMinutes)) * 60000, attempted: false };
}
export function quietHours(now = new Date(), settings = { quietStart: '23:00', quietEnd: '09:00' }) {
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
  const { quietStart: start, quietEnd: end } = settings;
  if (start === end) return false;
  return start < end ? time >= start && time < end : time >= start || time < end;
}
