<template>
  <main class="shell">
    <section class="chat">
      <header class="topbar">
        <div>
          <p class="eyebrow">Local Exskill</p>
          <h1>Elephui</h1>
        </div>
        <span class="status">qwen3:14b · 本地</span>
      </header>

      <div ref="messageList" class="messages">
        <article
          v-for="(message, index) in messages"
          :key="index"
          class="message"
          :class="message.role"
        >
          <span class="role">{{ message.role === 'user' ? '你' : 'Elephui' }}</span>
          <p>{{ message.content }}</p>
        </article>

        <article v-if="loading" class="message assistant">
          <span class="role">Elephui</span>
          <p>对方正在输入...</p>
        </article>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <form class="composer" @submit.prevent="sendMessage">
        <textarea
          v-model="input"
          placeholder="发消息给 elephui..."
          rows="3"
          @keydown.enter.exact.prevent="sendMessage"
        />
        <button type="submit" :disabled="!canSend">
          发送
        </button>
      </form>
    </section>
  </main>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue';

const input = ref('');
const loading = ref(false);
const error = ref('');
const messages = ref([
  {
    role: 'assistant',
    content: '我在。你说。'
  }
]);
const messageList = ref(null);

const canSend = computed(() => input.value.trim().length > 0 && !loading.value);

async function scrollToBottom() {
  await nextTick();
  messageList.value?.scrollTo({
    top: messageList.value.scrollHeight,
    behavior: 'smooth'
  });
}

async function sendMessage() {
  if (!canSend.value) return;

  error.value = '';
  const userMessage = { role: 'user', content: input.value.trim() };
  messages.value.push(userMessage);
  input.value = '';
  loading.value = true;
  await scrollToBottom();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.value
          .filter((message) => message.role === 'user' || message.role === 'assistant')
          .map(({ role, content }) => ({ role, content }))
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `请求失败：${response.status}`);
    }

    messages.value.push({
      role: 'assistant',
      content: data.reply || '嗯？刚刚那句我没接住。'
    });
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
}
</script>

