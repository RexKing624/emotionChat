<template>
  <main class="shell" @pointerdown="dismissMessageActions">
    <section class="chat">
      <header class="topbar">
        <div>
          <button class="eyebrow object-back" @click="$emit('back')">← EmotionChat</button>
          <h1><button class="chat-name" :aria-label="t.historyTitle" @click="historyPanel.open()">{{ settings.name }}</button></h1>
        </div>
        <button class="settings-toggle" type="button" :aria-label="t.settings" @click="openSettings">☰</button>
      </header>

      <div ref="messageList" class="messages">
        <p v-if="initializing">{{ t.historyLoading }}</p>
        <article
          v-for="(message, index) in messages"
          :key="index"
          :data-message-index="index"
          class="message"
          :class="[message.role, { 'touch-actions-open': activeMessage === index }]"
          @pointerdown="startMessagePress($event, index)"
          @pointermove="moveMessagePress"
          @pointerup="cancelMessagePress"
          @pointercancel="cancelMessagePress"
          @contextmenu="messageContextMenu($event)"
          tabindex="0"
        >
          <div v-if="message.timestamp" class="message-tools">
            <button type="button" :title="t.reply" :aria-label="t.reply" :disabled="loading || deleting" @click="replyToMessage(message)"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M9 5 3 11l6 6M3 11h10c5 0 8 3 8 8" stroke-linecap="round" stroke-linejoin="round" /></svg></button>
            <button type="button" :title="t.deleteMessage" :aria-label="t.deleteMessage" :disabled="loading || deleting" @click="deleteChatMessage(message, index)"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 10v8M14 10v8" stroke-linecap="round" stroke-linejoin="round" /></svg></button>
          </div>
          <div v-if="message.replyTo" class="message-quote"><span>{{ t.replyingTo.replace('{name}', message.replyTo.role === 'user' ? t.you : settings.name) }}</span><p>{{ message.replyTo.content }}</p></div>
          <div class="message-heading">
            <span class="role">{{ message.role === 'user' ? t.you : settings.name }}</span>
            <time v-if="message.timestamp" :datetime="message.timestamp">{{ formatTime(message.timestamp) }}</time>
          </div>
          <p>{{ message.content }}</p>
          <details v-if="message.sources?.length" class="message-sources" @pointerdown.stop>
            <summary>{{ {zh:'查看来源',ja:'出典を見る',en:'View sources'}[language] }}</summary>
            <a v-for="source in message.sources" :key="source.url" :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.title }}<small>{{ source.source }} · {{ source.publishedAt?.slice(0,10) }}</small></a>
          </details>
        </article>

        <article v-if="loading && showTyping" class="message assistant typing-message" role="status" :aria-label="t.typing">
          <span class="role">{{ settings.name }}</span>
          <div class="typing-dots" aria-hidden="true"><span></span><span></span><span></span></div>
        </article>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <form class="composer" @submit.prevent="sendMessage">
        <div v-if="replyTarget" class="reply-preview"><div><strong>{{ t.replyingTo.replace('{name}', replyTarget.role === 'user' ? t.you : settings.name) }}</strong><p>{{ replyTarget.content }}</p></div><button type="button" :aria-label="t.cancelReply" @click="replyTarget = null">×</button></div>
        <textarea
          ref="composerInput"
          @input="resizeComposer"
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
    <HistoryPanel ref="historyPanel" :messages="messages" :name="settings.name" :t="t" :language="language" :loading="loading" @changed="loadHistory()" @jump="jumpToMessage" />
    <dialog ref="settingsDialog" class="settings-dialog" @pointerdown="backdropStart" @click="backdropClose($event, saving)" @close="settingsOpen = false">
      <form @submit.prevent="saveSettings" class="settings-form">
        <div class="settings-title"><h2 ref="settingsHeading" tabindex="-1" autofocus>{{ t.settings }}</h2><div class="settings-meta"><button type="button" class="delete-chat" :disabled="loading || saving" @click="removeChat">{{ chatText.remove }}</button><span class="model-status" :class="modelHealth.status" role="status">{{ modelHealth.model }} · {{ t[modelHealth.status] }}</span></div><small class="settings-memory" :title="memoryName">{{ memoryName }}</small></div>
        <div class="settings-fields">
        <label>{{ t.name }}<input v-model="draft.name" maxlength="40" required /></label>
        <fieldset class="reality-settings">
          <legend class="proactive-heading"><span>{{ realityText.title }}</span><button type="button" class="reality-switch" role="switch" :aria-label="realityText.title" :aria-checked="settings.realityEnabled" :class="{ enabled: settings.realityEnabled }" :disabled="saving" @click="saveReality({ realityEnabled: !settings.realityEnabled })"><span></span></button></legend>
          <p>{{ realityText.hint }}</p>
          <label class="reality-label" for="reality-intensity"><span>{{ realityText.intensity }}</span><output>{{ draft.realityIntensity ?? 3 }}</output></label>
          <input id="reality-intensity" type="range" min="0" max="8" step="1" v-model.number="draft.realityIntensity" :disabled="!settings.realityEnabled || saving" @change="saveReality({ realityIntensity: draft.realityIntensity })" />
          <div class="reality-scale"><span>{{ realityText.low }}</span><span>{{ realityText.high }}</span></div>
          <p>{{ realityText.note }}</p>
        </fieldset>
        <fieldset><legend class="proactive-heading"><span>{{ t.proactive }}</span><span class="quiet-controls"><small class="quiet-tip" :title="settings.proactiveEnabled ? chatText.quietTip : chatText.activeTip">{{ settings.proactiveEnabled ? chatText.quietTip : chatText.activeTip }}</small><button type="button" class="quiet-toggle" :class="{ active: !settings.proactiveEnabled }" :aria-pressed="!settings.proactiveEnabled" :disabled="saving" @click="toggleProactive">{{ settings.proactiveEnabled ? t.silent : t.silentActive }}</button></span></legend>
          <p>{{ settings.proactiveEnabled ? t.proactiveHint : t.silentHint }}</p>
          <div class="settings-row">
            <label>{{ t.min }}<input type="number" :disabled="!settings.proactiveEnabled" v-model.number="draft.minMinutes" min="1" max="1440" required /></label>
            <label>{{ t.max }}<input type="number" :disabled="!settings.proactiveEnabled" v-model.number="draft.maxMinutes" min="1" max="1440" required /></label>
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
        </div>
        <div class="settings-actions">
          <button type="button" class="secondary" @click="settingsDialog.close()" :disabled="saving">{{ t.cancel }}</button>
          <button type="submit" :disabled="saving">{{ saving ? t.saving : t.save }}</button>
        </div>
      </form>
    </dialog>
  </main>
</template>

<script setup>
import { createLocalEnvironment } from './localEnvironment.js';
import { apiFetch as fetch } from './api.js';
import { computed, nextTick, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue';
import { backdropStart, backdropClose } from './dialogBackdrop.js';
import { createTabNotification } from './tabNotification.js';
import { createMessageTracker, createMessageSound } from './messageSound.js';
import HistoryPanel from './HistoryPanel.vue';
import { translations } from './i18n.js';

const props = defineProps({ interfaceLanguage: { type: String, default: '' } });
const historyPanel = ref(null);
async function jumpToMessage(index) {
  await nextTick();
  const element = messageList.value?.querySelector(`[data-message-index="${index}"]`);
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  element?.animate([{ outline: '2px solid #1f6feb' }, { outline: '2px solid transparent' }], { duration: 1800 });
}
const replyTarget = ref(null), composerInput = ref(null), deleting = ref(false);
const activeMessage = ref(null);
let pressTimer, pressPoint;
function cancelMessagePress() { clearTimeout(pressTimer); pressPoint = null; }
function startMessagePress(event, index) {
  if (event.pointerType === 'mouse' || event.target.closest('button')) return;
  cancelMessagePress();
  pressPoint = { x: event.clientX, y: event.clientY };
  pressTimer = setTimeout(() => { activeMessage.value = index; pressPoint = null; }, 500);
}
function moveMessagePress(event) {
  if (pressPoint && Math.hypot(event.clientX - pressPoint.x, event.clientY - pressPoint.y) > 10) cancelMessagePress();
}
function messageContextMenu(event) {
  if (window.matchMedia('(hover: none)').matches) event.preventDefault();
}
function dismissMessageActions(event) {
  if (!event.target.closest('.touch-actions-open')) activeMessage.value = null;
}

function resizeComposer() {
  const element = composerInput.value;
  if (!element) return;
  if (!window.matchMedia('(max-width: 640px)').matches) { element.style.height = ''; return; }
  element.style.height = '44px';
  element.style.height = `${Math.min(120, Math.max(44, element.scrollHeight))}px`;
}
async function replyToMessage(message) {
  activeMessage.value = null;
  replyTarget.value = { role: message.role, timestamp: message.timestamp, content: message.content };
  await nextTick();
  composerInput.value?.focus();
}
async function deleteChatMessage(message, index) {
  if (deleting.value || loading.value) return;
  if (!window.confirm(t.value.deleteConfirm)) return;
  activeMessage.value = null;
  deleting.value = true;
  try {
    const response = await fetch('/api/history/delete-message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ index, role: message.role, timestamp: message.timestamp, content: message.content }) });
    if (!response.ok) throw new Error();
    if (replyTarget.value?.timestamp === message.timestamp && replyTarget.value?.content === message.content) replyTarget.value = null;
    await loadHistory();
  } catch { error.value = t.value.historyActionError; }
  finally { deleting.value = false; }
}
const input = ref('');
const loading = ref(false);
const showTyping = ref(false);
let typingTimer;
const initializing = ref(true);
const error = ref('');
const messages = ref([]);
const settings = ref({ realityEnabled: false, realityIntensity: 3, proactiveEnabled: true, language: 'zh', name: 'Assistant', minMinutes: 10, maxMinutes: 30, quietStart: '23:00', quietEnd: '09:00' });
const draft = ref({ ...settings.value });
const settingsDialog = ref(null);
const settingsHeading = ref(null);
const settingsOpen = ref(false);
const settingsError = ref('');
const saving = ref(false);
const language = computed(() => props.interfaceLanguage || (settingsOpen.value ? draft.value.language : settings.value.language) || 'zh');
const t = computed(() => translations[language.value] || translations.zh);
watchEffect(() => {
  document.title = `${settings.value.name} · EmotionChat`;
  document.documentElement.lang = { zh: 'zh-CN', ja: 'ja', en: 'en' }[language.value];
});
const emit = defineEmits(['back']);
const memoryName = ref('');
const chatText=computed(()=>({zh:{activeTip:'点这里，恢复主动',quietTip:'点这里，让 TA 安静',remove:'删除对话',confirm:'删除这个对话？记录会保留，可验证密码后恢复；回忆文件不变。'},ja:{activeTip:'タップで会話を再開',quietTip:'タップでおやすみ',remove:'会話を削除',confirm:'会話を非表示にしますか？パスコードで復元できます。記憶は変更しません。'},en:{activeTip:'Tap to resume chats',quietTip:'Tap to pause chats',remove:'Delete chat',confirm:'Hide this chat? Restore it with your passcode later. Memory files stay unchanged.'}}[language.value]));
async function removeChat(){if(!window.confirm(chatText.value.confirm))return;saving.value=true;try{const response=await fetch('/api/delete',{method:'POST'});if(!response.ok)throw Error();settingsDialog.value.close();emit('back');}catch{error.value=t.value.chatError;}finally{saving.value=false;}}
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
  settingsHeading.value?.focus({ preventScroll: true });
}
const realityText = computed(() => ({
 zh: {title:'关注现实动态',hint:'根据人物兴趣，了解近期真实消息。',intensity:'探索强度',low:'0 · 按需查询',high:'8 · 广泛探索',note:'联网查询通用兴趣词，不发送私人资料。调整后自动保存。'},
 ja: {title:'最近の話題を探す',hint:'キャラクターの興味から最近の情報を探します。',intensity:'探索レベル',low:'0 · 必要な時だけ',high:'8 · 幅広く探索',note:'一般的な検索語のみ送信。個人資料は送信せず、自動保存します。'},
 en: {title:'Follow real-world updates',hint:'Find recent news based on the character’s interests.',intensity:'Exploration level',low:'0 · On demand',high:'8 · Explore broadly',note:'Searches use general interests, not private details. Changes save automatically.'}
}[language.value]));
async function saveReality(patch) {
 if (saving.value) return;
 saving.value = true; settingsError.value = '';
 try {
  const response = await fetch('/api/settings', {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...settings.value,...patch})});
  const data = await response.json(); if (!response.ok) throw new Error('Save failed');
  settings.value = data;
  draft.value.realityEnabled = data.realityEnabled;
  draft.value.realityIntensity = data.realityIntensity;
 } catch {
  draft.value.realityEnabled = settings.value.realityEnabled;
  draft.value.realityIntensity = settings.value.realityIntensity;
  settingsError.value = t.value.saveError;
 } finally { saving.value = false; }
}
async function toggleProactive() {
  if (saving.value) return;
  const previous = settings.value.proactiveEnabled;
  const enabled = !previous;
  saving.value = true;
  settingsError.value = '';
  settings.value = { ...settings.value, proactiveEnabled: enabled };
  draft.value.proactiveEnabled = enabled;
  try {
    const response = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings.value) });
    const data = await response.json();
    if (!response.ok) throw new Error('Save failed');
    settings.value = data;
  } catch {
    settings.value = { ...settings.value, proactiveEnabled: previous };
    draft.value.proactiveEnabled = previous;
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
const canSend = computed(() => input.value.trim().length > 0 && !loading.value && !deleting.value && !initializing.value);
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
const trackIncoming = createMessageTracker();
const messageSound = createMessageSound();
const tabNotification = createTabNotification(() => language.value);
async function loadHistory(background = false) {
  const snapshot = JSON.stringify(messages.value);
  const response = await fetch('/api/history', { cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(t.value.historyError);
  if (background && (loading.value || snapshot !== JSON.stringify(messages.value))) return;
  memoryName.value = data.memoryName || '';
  if (data.settings && !saving.value) settings.value = data.settings;
  const incoming = trackIncoming(data.messages || []);
  if (incoming) { messageSound.play(); tabNotification.receive(incoming); }
  if (background && JSON.stringify(data.messages) === snapshot) return;
  messages.value = data.exists ? data.messages : [{ role: 'assistant', content: '我在。你说。' }];
  await scrollToBottom();
}
const localEnvironment = createLocalEnvironment();
watch(() => settings.value.realityEnabled, enabled => { localEnvironment.refresh(Boolean(enabled)); });
let environmentTimer;
let historyTimer;
onUnmounted(() => { localEnvironment.dispose(); clearInterval(environmentTimer); tabNotification.dispose(); messageSound.dispose(); clearInterval(historyTimer); clearTimeout(typingTimer); cancelMessagePress(); });
onMounted(async () => {
  localEnvironment.refresh(false);
  environmentTimer=setInterval(()=>localEnvironment.refresh(Boolean(settings.value.realityEnabled)),25*60*1000);
  messageSound.mount();
  tabNotification.mount();
  historyTimer = setInterval(() => {
    if (settingsOpen.value) refreshModelHealth();
    if (!loading.value && !initializing.value) loadHistory(true).catch(() => {});
  }, 5000);
  try { await loadHistory(); initializing.value = false; await nextTick(); resizeComposer(); }
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
  const replyTo = replyTarget.value ? { ...replyTarget.value } : undefined;
  messages.value.push({ role: 'user', content, timestamp: new Date().toISOString(), ...(replyTo ? { replyTo } : {}) });
  replyTarget.value = null;
  input.value = '';
  nextTick(resizeComposer);
  loading.value = true;
  showTyping.value = false;
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    if (loading.value) {
      showTyping.value = true;
      scrollToBottom();
    }
  }, 1000 + Math.floor(Math.random() * 9001));
  await scrollToBottom();
  try {
    const response = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: content, replyTo })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(t.value.chatError);
  } catch (err) { error.value = t.value.chatError; }
  finally {
    clearTimeout(typingTimer);
    showTyping.value = false;
    try { await loadHistory(); } catch (err) { error.value = error.value || t.value.historyError; }
    loading.value = false;
    await scrollToBottom();
  }
}
</script>
