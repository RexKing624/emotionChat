export function createMessageTracker(startedAt = Date.now()) {
  const seen = new Set();
  let initialized = false;
  let latest = startedAt;
  return messages => {
    let arrived = 0;
    for (const message of messages) {
      if (message.role !== 'assistant' || !message.timestamp) continue;
      const stamp = Date.parse(message.timestamp);
      const key = `${message.timestamp}:${message.content}`;
      if (initialized && !seen.has(key) && stamp > latest) arrived += 1;
      seen.add(key);
    }
    for (const message of messages) {
      if (message.role === 'assistant') latest = Math.max(latest, Date.parse(message.timestamp) || 0);
    }
    initialized = true;
    return arrived;
  };
}

export function createMessageSound() {
  let context;
  const background = () => document.visibilityState === 'hidden' || !document.hasFocus();
  async function unlock() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      context ||= new AudioContext();
      if (context.state === 'suspended') await context.resume();
    } catch { /* Browsers may deny audio until a user gesture. */ }
  }
  async function play() {
    if (!background() || !context) return;
    try {
      if (context.state === 'suspended') await context.resume();
      // Recheck after resume: never play a delayed alert on returning to the page.
      if (!background() || context.state !== 'running') return;
      const now = context.currentTime;
      for (const [offset, frequency] of [[0, 740], [0.12, 988]]) {
        const oscillator = context.createOscillator();
        const volume = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        volume.gain.setValueAtTime(0, now + offset);
        volume.gain.linearRampToValueAtTime(0.09, now + offset + 0.015);
        volume.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.22);
        oscillator.connect(volume); volume.connect(context.destination);
        oscillator.start(now + offset); oscillator.stop(now + offset + 0.24);
        oscillator.onended = () => { oscillator.disconnect(); volume.disconnect(); };
      }
    } catch { /* Notification failure must not interrupt chat. */ }
  }
  function mount() {
    document.addEventListener('pointerdown', unlock, { passive: true });
    document.addEventListener('keydown', unlock);
  }
  function dispose() {
    document.removeEventListener('pointerdown', unlock);
    document.removeEventListener('keydown', unlock);
    context?.close().catch(() => {});
  }
  return { mount, dispose, play };
}
