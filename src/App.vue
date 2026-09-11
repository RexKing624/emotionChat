<template>
  <main class="shell">
    <section class="chat">
      <header class="topbar">
        <div>
          <p class="eyebrow">EmotionChat</p>
          <h1>{{ settings.name }}</h1>
        </div>
        <button class="settings-toggle" type="button" :aria-label="t.settings" @click="openSettings">☰</button>
      </header>

      <div ref="messageList" class="messages">
        <p v-if="initializing">{{ t.historyLoading }}</p>
        <article
          v-for="(message, index) in messages"
          :key="index"
          class="message"
          :class="message.role"
        >
          <div class="message-heading">
            <span class="role">{{ message.role === 'user' ? t.you : settings.name }}</span>
            <time v-if="message.timestamp" :datetime="message.timestamp">{{ formatTime(message.timestamp) }}</time>
          </div>
          <p>{{ message.content }}</p>
        </article>

        <article v-if="loading" class="message assistant typing-message" role="status" :aria-label="t.typing">
          <span class="role">{{ settings.name }}</span>
          <div class="typing-dots" aria-hidden="true"><span></span><span></span><span></span></div>
        </article>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <form class="composer" @submit.prevent="sendMessage">
        <textarea
          v-model="input"
          :placeholder="t.placeholder.replace('{name}', settings.name)"
          rows="3"
          @keydown.enter.exact="onEnter"
          :disabled="initializing"
        />
        <button type="submit" :disabled="!canSend">
          {{ t.send }}
        </button>
      </form>
    </section>
    <dialog ref="settingsDialog" class="settings-dialog" @close="settingsOpen = false">
      <form @submit.prevent="saveSettings" class="settings-form">
        <div class="settings-title"><h2>{{ t.settings }}</h2><span class="model-status" :class="modelHealth.status" role="status">{{ modelHealth.model }} · {{ t[modelHealth.status] }}</span></div>
        <label>{{ t.name }}<input v-model="draft.name" maxlength="40" required /></label>
        <fieldset><legend>{{ t.language }}</legend>
          <div class="language-buttons" role="group" :aria-label="t.language">
            <button v-for="option in languageOptions" :key="option.value" type="button" :aria-pressed="language === option.value" :class="{ selected: language === option.value }" :disabled="saving" @click="applyLanguage(option.value)">{{ option.label }}</button>
          </div>
        </fieldset>
        <p>{{ t.languageHint }}</p>
        <fieldset><legend>{{ t.proactive }}</legend>
          <p>{{ t.proactiveHint }}</p>
          <div class="settings-row">
            <label>{{ t.min }}<input type="number" v-model.number="draft.minMinutes" min="1" max="1440" required /></label>
            <label>{{ t.max }}<input type="number" v-model.number="draft.maxMinutes" min="1" max="1440" required /></label>
          </div>
        </fieldset>
        <fieldset><legend>{{ t.quiet }}</legend>
          <div class="settings-row">
            <label>{{ t.start }}<input type="time" v-model="draft.quietStart" required /></label>
            <label>{{ t.end }}<input type="time" v-model="draft.quietEnd" required /></label>
          </div>
          <p>{{ t.quietHint }}</p>
        </fieldset>
        <p v-if="settingsError" class="settings-error" role="alert">{{ settingsError }}</p>
        <div class="settings-actions">
          <button type="button" class="secondary" @click="settingsDialog.close()" :disabled="saving">{{ t.cancel }}</button>
          <button type="submit" :disabled="saving">{{ saving ? t.saving : t.save }}</button>
        </div>
      </form>
    </dialog>
  </main>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watchEffect } from 'vue';
import { translations } from './i18n.js';

const input = ref('');
const loading = ref(false);
const initializing = ref(true);
const error = ref('');
const messages = ref([]);
const settings = ref({ language: 'zh', name: 'Assistant', minMinutes: 10, maxMinutes: 30, quietStart: '23:00', quietEnd: '09:00' });
const draft = ref({ ...settings.value });
const settingsDialog = ref(null);
const settingsOpen = ref(false);
const settingsError = ref('');
const saving = ref(false);
const language = computed(() => (settingsOpen.value ? draft.value.language : settings.value.language) || 'zh');
const t = computed(() => translations[language.value] || translations.zh);
watchEffect(() => {
  document.title = `${settings.value.name} · EmotionChat`;
  document.documentElement.lang = { zh: 'zh-CN', ja: 'ja', en: 'en' }[language.value];
});
const modelHealth = ref({ model: '', status: 'checking' });
let healthBusy = false;
async function refreshModelHealth() {
  if (healthBusy) return;
  healthBusy = true;
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    modelHealth.value = { model: data.model || '', status: ['ready', 'missing', 'offline'].includes(data.status) ? data.status : 'offline' };
  } catch { modelHealth.value.status = 'offline'; }
  finally { healthBusy = false; }
}
function openSettings() {
  modelHealth.value.status = 'checking';
  refreshModelHealth();
  draft.value = { ...settings.value };
  settingsError.value = '';
  settingsOpen.value = true;
  settingsDialog.value.showModal();
}
const languageOptions = [{ value: 'zh', label: '中文' }, { value: 'ja', label: '日本語' }, { value: 'en', label: 'English' }];
async function applyLanguage(value) {
  if (saving.value || value === settings.value.language) return;
  const previous = settings.value.language;
  saving.value = true;
  settingsError.value = '';
  settings.value = { ...settings.value, language: value };
  draft.value.language = value;
  try {
    // Save only the language change, preserving other unsaved form edits.
    const response = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings.value) });
    const data = await response.json();
    if (!response.ok) throw new Error('Save failed');
    settings.value = data;
  } catch {
    settings.value = { ...settings.value, language: previous };
    draft.value.language = previous;
    settingsError.value = t.value.saveError;
  } finally { saving.value = false; }
}
async function saveSettings() {
  if (!draft.value.name.trim() || draft.value.name.trim().length > 40) { settingsError.value = t.value.nameError; return; }
  if (![draft.value.minMinutes, draft.value.maxMinutes].every(n => Number.isInteger(n) && n >= 1 && n <= 1440) || draft.value.minMinutes > draft.value.maxMinutes) { settingsError.value = t.value.rangeError; return; }
  saving.value = true;
  settingsError.value = '';
  try {
    const response = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft.value) });
    const data = await response.json();
    if (!response.ok) throw new Error(t.value.saveError);
    settings.value = data;
    settingsDialog.value.close();
  } catch (error) { settingsError.value = t.value.saveError; }
  finally { saving.value = false; }
}
const messageList = ref(null);
const canSend = computed(() => input.value.trim().length > 0 && !loading.value && !initializing.value);
const formatTime = value => {
  const date = new Date(value);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad = number => String(number).padStart(2, '0');
  return `${pad(date.getDate())}/${months[date.getMonth()]}/${date.getFullYear()},${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
async function scrollToBottom() {
  await nextTick();
  messageList.value?.scrollTo({ top: messageList.value.scrollHeight, behavior: 'smooth' });
}
async function loadHistory(background = false) {
  const snapshot = JSON.stringify(messages.value);
  const response = await fetch('/api/history', { cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(t.value.historyError);
  if (background && (loading.value || snapshot !== JSON.stringify(messages.value))) return;
  if (data.settings && !saving.value) settings.value = data.settings;
  if (background && JSON.stringify(data.messages) === snapshot) return;
  messages.value = data.exists ? data.messages : [{ role: 'assistant', content: '我在。你说。' }];
  await scrollToBottom();
}
let historyTimer;
onUnmounted(() => clearInterval(historyTimer));
onMounted(async () => {
  historyTimer = setInterval(() => {
    if (settingsOpen.value) refreshModelHealth();
    if (!loading.value && !initializing.value) loadHistory(true).catch(() => {});
  }, 5000);
  try { await loadHistory(); initializing.value = false; }
  catch (err) { error.value = t.value.historyError; }
});
function onEnter(event) {
  if (event.isComposing) return;
  event.preventDefault();
  sendMessage();
}
async function sendMessage() {
  if (!canSend.value) return;
  error.value = '';
  const content = input.value.trim();
  messages.value.push({ role: 'user', content, timestamp: new Date().toISOString() });
  input.value = '';
  loading.value = true;
  await scrollToBottom();
  try {
    const response = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: content })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(t.value.chatError);
  } catch (err) { error.value = t.value.chatError; }
  finally {
    try { await loadHistory(); } catch (err) { error.value = error.value || t.value.historyError; }
    loading.value = false;
    await scrollToBottom();
  }
}
</script>
