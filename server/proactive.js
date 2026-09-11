export function nextSchedule(previous, user, now = Date.now(), random = Math.random, settings = { minMinutes: 10, maxMinutes: 30 }) {
  if (!user) return null;
  const key = `${user.timestamp}:${user.content}`;
  const timing = `${settings.minMinutes}:${settings.maxMinutes}`;
  const resumedAt = settings.proactiveResumedAt || 0;
  if (resumedAt && previous?.resumedAt !== resumedAt) {
    return { key, timing, resumedAt, attempted: false,
      due: Math.max(Date.parse(user.timestamp), resumedAt) + (settings.minMinutes + random() * (settings.maxMinutes - settings.minMinutes)) * 60000 };
  }
  if (previous?.key === key && previous.timing === timing) {
    // Upgrade older one-shot state once; persist the returned deadline.
    if (previous.attempted && previous.outcome === 'sent') return scheduleFollowUp(previous, settings, now, random);
    return previous;
  }
  if (previous?.key === key && (previous.followUp || previous.outcome === 'sent')) {
    return scheduleFollowUp({ ...previous, timing }, settings, now, random);
  }
  return { key, timing, resumedAt, due: Math.max(Date.parse(user.timestamp), now) + (settings.minMinutes + random() * (settings.maxMinutes - settings.minMinutes)) * 60000, attempted: false };
}
export function quietHours(now = new Date(), settings = { quietStart: '23:00', quietEnd: '09:00' }) {
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
  const { quietStart: start, quietEnd: end } = settings;
  if (start === end) return false;
  return start < end ? time >= start && time < end : time >= start || time < end;
}

export function scheduleFollowUp(previous, settings, now = Date.now(), random = Math.random) {
  const minimum = settings.minMinutes * 2 + 2;
  const maximum = Math.max(minimum, settings.maxMinutes);
  return { ...previous, timing: `${settings.minMinutes}:${settings.maxMinutes}`, attempted: false, followUp: true,
    due: now + (minimum + random() * (maximum - minimum)) * 60000 };
}
