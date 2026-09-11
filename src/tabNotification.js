export function createTabNotification(language = () => 'zh') {
  let unread = 0;
  const background = () => document.visibilityState === 'hidden' || !document.hasFocus();
  function render() {
    const label = { zh: '新消息', ja: '新着メッセージ', en: 'New message' }[language()] || 'New message';
    document.title = unread ? `(${unread}) ${label} · EmotionChat` : 'EmotionChat';
    document.getElementById('app-favicon')?.setAttribute('href', unread ? '/favicon-unread.svg' : '/favicon.svg');
  }
  function clear() { if (!background()) { unread = 0; render(); } }
  return {
    receive(count) { if (background()) { unread += count; render(); } },
    mount() { window.addEventListener('focus', clear); document.addEventListener('visibilitychange', clear); },
    dispose() { window.removeEventListener('focus', clear); document.removeEventListener('visibilitychange', clear); unread = 0; render(); }
  };
}
