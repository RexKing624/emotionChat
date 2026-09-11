<template>
  <dialog ref="dialog" class="history-dialog">
    <header class="history-header"><h2>{{ t.historyTitle }}</h2><button type="button" @click="dialog.close()" :aria-label="t.close">×</button></header>
    <div class="calendar-nav"><button @click="moveMonth(-1)" :aria-label="t.previousMonth">‹</button><strong>{{ monthLabel }}</strong><button @click="moveMonth(1)" :aria-label="t.nextMonth">›</button></div>
    <div class="calendar-grid">
      <span v-for="day in weekdays" :key="day" class="weekday">{{ day }}</span>
      <span v-for="n in offset" :key="'blank'+n"></span>
      <button v-for="day in days" :key="day" :disabled="!available.has(dayKey(day))" :class="{ chosen: selected === dayKey(day), today: dayKey(day) === today }" @click="selectDay(day)">{{ day }}</button>
    </div>
    <div class="history-filter"><span>{{ selected || t.allDates }}</span><button @click="selected = ''; confirmClear = false">{{ t.allDates }}</button></div>
    <input class="history-search" type="search" v-model="query" :placeholder="t.searchHistory" :aria-label="t.searchHistory" />
    <p class="history-count">{{ t.resultCount.replace('{count}', filtered.length) }}</p>
    <div class="history-results">
      <div class="history-result-row" v-for="message in filtered" :key="message.index">
        <button class="history-result" @click="jump(message.index)"><span><strong>{{ message.role === 'user' ? t.you : name }}</strong><time>{{ new Date(message.timestamp).toLocaleString(locale) }}</time></span><p>{{ message.content }}</p></button>
        <button class="delete-message" :disabled="busy || loading" @click="deleteMessage(message)">{{ t.deleteMessage }}</button>
      </div>
      <p v-if="!filtered.length">{{ t.noResults }}</p>
    </div>
    <p v-if="error" role="alert" class="settings-error">{{ error }}</p>
    <footer class="history-cleanup">
      <p v-if="confirmClear">{{ t.clearConfirm }}</p>
      <button class="clear-history" :disabled="busy || loading || !records.length" @click="confirmClear ? clearHistory() : confirmClear = true">{{ confirmClear ? t.confirmClear : t.clearHistory }}</button>
      <button v-if="confirmClear" :disabled="busy" @click="confirmClear = false">{{ t.cancel }}</button>
      <button v-if="canRestore" :disabled="busy || loading" @click="restoreHistory">{{ t.restoreHistory }}</button>
    </footer>
  </dialog>
</template>
<script setup>
import { computed, ref } from 'vue';
const props = defineProps({ messages: Array, name: String, t: Object, language: String, loading: Boolean });
const emit = defineEmits(['jump', 'changed']);
const dialog = ref(null), query = ref(''), selected = ref(''), confirmClear = ref(false), busy = ref(false), error = ref(''), canRestore = ref(false);
const month = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
const locale = computed(() => ({zh:'zh-CN',ja:'ja-JP',en:'en-US'}[props.language]));
const dateKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const today = dateKey(new Date());
const records = computed(() => props.messages.map((m,index)=>({...m,index})).filter(m=>m.timestamp));
const available = computed(()=>new Set(records.value.map(m=>dateKey(new Date(m.timestamp)))));
const monthLabel = computed(()=>month.value.toLocaleDateString(locale.value,{year:'numeric',month:'long'}));
const weekdays = computed(()=>Array.from({length:7},(_,i)=>new Date(2026,0,4+i).toLocaleDateString(locale.value,{weekday:'short'})));
const offset = computed(()=>month.value.getDay());
const days = computed(()=>new Date(month.value.getFullYear(),month.value.getMonth()+1,0).getDate());
const dayKey = day=>dateKey(new Date(month.value.getFullYear(),month.value.getMonth(),day));
const filtered = computed(()=>records.value.filter(m=>(!selected.value || dateKey(new Date(m.timestamp))===selected.value)&&m.content.toLocaleLowerCase().includes(query.value.trim().toLocaleLowerCase())));
function moveMonth(n){month.value=new Date(month.value.getFullYear(),month.value.getMonth()+n,1);}
function selectDay(day){selected.value=dayKey(day);confirmClear.value=false;}
function jump(index){dialog.value.close();emit('jump',index);}
async function open(){
 query.value='';selected.value='';confirmClear.value=false;error.value='';
 const last=records.value.at(-1);const date=last?new Date(last.timestamp):new Date();month.value=new Date(date.getFullYear(),date.getMonth(),1);
 dialog.value.showModal();
 try{const r=await fetch('/api/history/backup');if(!r.ok)throw Error();canRestore.value=(await r.json()).available;}catch{canRestore.value=false;}
}
async function mutate(action){
 busy.value=true;error.value='';
 try{const r=await fetch(`/api/history/${action}`,{method:'POST'});if(!r.ok)throw Error();canRestore.value=(await r.json()).available;confirmClear.value=false;emit('changed');}
 catch{error.value=props.t.historyActionError;}finally{busy.value=false;}
}
async function deleteMessage(message) {
 busy.value=true;error.value='';
 try {
  const r=await fetch('/api/history/delete-message',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(message)});
  if(!r.ok)throw Error();
  canRestore.value=true;emit('changed');
 }catch{error.value=props.t.historyActionError;emit('changed');}finally{busy.value=false;}
}
const clearHistory=()=>mutate('clear'),restoreHistory=()=>mutate('restore');
defineExpose({open});
</script>
