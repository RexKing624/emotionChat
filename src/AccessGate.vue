<template>
  <Chat v-if="stage === 'chat'" :key="selected" @back="showObjects" />
  <main v-else class="access-shell">
    <section class="access-card" :class="{'object-card': stage === 'objects'}">
      <img class="access-logo" src="/favicon.svg" alt="" />
      <p class="access-brand">EmotionChat</p>
      <div class="access-languages"><button v-for="(label,key) in languages" :key="key" :class="{active:lang===key}" @click="lang=key">{{ label }}</button></div>
      <template v-if="stage === 'loading'"><h1>{{ t.loading }}</h1><button v-if="error" @click="init">{{ t.retry }}</button></template>
      <template v-else-if="stage === 'objects'">
        <h1>{{ t.choose }}</h1><p class="access-hint">{{ t.chooseHint }}</p>
        <div class="object-list"><button v-for="item in objects" :key="item.id" @click="enter(item.id)"><span class="object-avatar">{{ item.name.slice(0,1).toUpperCase() }}</span><span>{{ item.name }}</span><span class="object-arrow">→</span></button></div>
        <p v-if="!objects.length" class="access-hint">{{ t.empty }}</p>
        <button class="access-secondary" :disabled="busy" @click="openAdd">＋ {{ t.add }}</button>
        <form v-if="adding" class="add-object" @submit.prevent="createObject"><label>{{ t.name }}<input v-model="chatName" maxlength="40" required :disabled="busy" :placeholder="t.name" /></label><p class="access-hint">{{ t.pickMemory }}</p><div class="memory-options"><button type="button" v-for="item in memoryFolders" :key="item.id" :class="{chosen:newName===item.id}" @click="newName=item.id">{{ item.name }}<span v-if="newName===item.id"> ✓</span></button></div><p v-if="!memoryFolders.length" class="access-hint">{{ t.empty }}</p><button :disabled="busy || !newName || !chatName.trim()">{{ t.create }}</button><p class="access-hint">{{ t.addHint }}</p></form>
        <button class="access-secondary" :disabled="busy" @click="lock">{{ t.lock }}</button>
      </template>
      <template v-else>
        <h1>{{ stage === 'setup' ? (firstPin ? t.confirm : t.setup) : t.unlock }}</h1>
        <p class="access-hint">{{ stage === 'setup' ? t.setupHint : t.unlockHint }}</p>
        <div class="pin-dots" role="status" :aria-label="`${pin.length} / 6`"><span v-for="n in 6" :key="n" :class="{filled:pin.length>=n}"></span></div>
        <div class="pin-keypad"><button v-for="n in 9" :key="n" :disabled="busy" @click="digit(String(n))">{{ n }}</button><button class="pin-small" :disabled="busy" @click="reset">{{ firstPin ? t.back : t.clear }}</button><button :disabled="busy" @click="digit('0')">0</button><button class="pin-small" :disabled="busy" :aria-label="t.delete" @click="pin=pin.slice(0,-1)">⌫</button></div>
      </template>
      <p class="access-error" role="alert">{{ error || (busy ? t.wait : '') }}</p>
    </section>
  </main>
</template>
<script setup>
import {computed,onMounted,onUnmounted,ref,watch} from 'vue';
import Chat from './App.vue';
import {selectObject} from './api.js';
const languages={zh:'中文',ja:'日本語',en:'EN'};
const lang=ref(localStorage.getItem('emotion-access-language') || (navigator.language.startsWith('ja')?'ja':navigator.language.startsWith('zh')?'zh':'en'));
watch(lang,v=>localStorage.setItem('emotion-access-language',v));
const copy={
zh:{add:'新建聊天',name:'聊天名字',create:'开始',pickMemory:'选择 emotion 中的回忆文件夹',addHint:'创建 chats/聊天名字.md。回忆文件保持不变，同一回忆可用于多个聊天。',exists:'这个名字已有文件夹或存档，请换一个名字。',invalid:'名字请使用 1–40 个字符，不含路径或特殊符号。',loading:'正在连接',retry:'重试',choose:'选择聊天',chooseHint:'从一段熟悉的回忆开始。',empty:'还没有回忆对象。将对象文件夹放进 emotion/ 后重新打开此页。',lock:'锁定',setup:'设置六位密码',confirm:'再次输入密码',unlock:'输入密码',setupHint:'为你的回忆设置一个六位数字密码。',unlockHint:'解锁后，继续你们的对话。',back:'返回',clear:'清空',delete:'删除',wait:'请稍候…',wrong:'密码不正确，请重试。',mismatch:'两次密码不同，请重新设置。',later:'尝试次数过多，请等 30 秒。',failed:'连接失败，请重试。'},
ja:{add:'新しいチャット',name:'チャット名',create:'開始',pickMemory:'emotion の記憶フォルダーを選択',addHint:'chats/チャット名.md を作成します。同じ記憶で複数のチャットを作れます。',exists:'同名のフォルダーまたは履歴があります。',invalid:'パス記号を含まない1〜40文字の名前にしてください。',loading:'接続中',retry:'再試行',choose:'話す相手を選ぶ',chooseHint:'なじみのある記憶から、また会話を。',empty:'emotion/ に人物ごとのフォルダーを追加して、この画面を開き直してください。',lock:'ロック',setup:'6桁のパスコードを設定',confirm:'もう一度入力',unlock:'パスコードを入力',setupHint:'記憶を守る6桁の数字を設定します。',unlockHint:'ロックを解除して、会話の続きを。',back:'戻る',clear:'クリア',delete:'削除',wait:'お待ちください…',wrong:'パスコードが違います。',mismatch:'一致しません。設定し直してください。',later:'30秒待ってから再試行してください。',failed:'接続できません。再試行してください。'},
en:{add:'New chat',name:'Chat name',create:'Start',pickMemory:'Choose a memory folder in emotion',addHint:'Creates chats/chat-name.md. Multiple chats can share one memory profile; memory files stay unchanged.',exists:'This folder or archive already exists. Choose another name.',invalid:'Use 1–40 characters without path or special symbols.',loading:'Connecting',retry:'Try again',choose:'Choose someone to talk to',chooseHint:'Start with a familiar memory.',empty:'Add a folder for each person inside emotion/, then reopen this page.',lock:'Lock',setup:'Set a six-digit passcode',confirm:'Enter your passcode again',unlock:'Enter passcode',setupHint:'Choose six digits to protect your memories.',unlockHint:'Unlock to pick up your conversation.',back:'Back',clear:'Clear',delete:'Delete',wait:'Please wait…',wrong:'Incorrect passcode. Try again.',mismatch:'Passcodes differ. Please start again.',later:'Too many attempts. Wait 30 seconds.',failed:'Could not connect. Please try again.'}};
const t=computed(()=>copy[lang.value] || copy.en);
const adding=ref(false),newName=ref(''),chatName=ref(''),memoryFolders=ref([]);
async function openAdd(){adding.value=!adding.value;error.value='';newName.value='';chatName.value='';if(adding.value){try{memoryFolders.value=(await request('memories')).objects;}catch(e){if(e.status===401)locked();else error.value=t.value.failed;}}}
async function createObject(){busy.value=true;error.value='';try{const item=await request('objects',{name:chatName.value,memoryId:newName.value});adding.value=false;newName.value='';enter(item.id);}catch(e){if(e.status===401)locked();else error.value=e.status===409?t.value.exists:e.status===400?t.value.invalid:t.value.failed;}finally{busy.value=false;}}
const stage=ref('loading'),pin=ref(''),firstPin=ref(''),error=ref(''),busy=ref(false),objects=ref([]),selected=ref('');
async function request(url,body){const response=await window.fetch('/api/'+url,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','X-EmotionChat':'1'},...(body?{body:JSON.stringify(body)}:{})});const data=await response.json();if(!response.ok)throw Object.assign(new Error(data.error),{status:response.status});return data;}
async function init(){error.value='';try{const s=await request('auth/status');if(s.authenticated)await showObjects();else stage.value=s.configured?'unlock':'setup';}catch{error.value=t.value.failed;}}
async function showObjects(){stage.value='objects';selected.value='';selectObject('');error.value='';try{objects.value=(await request('objects')).objects;}catch(e){if(e.status===401)locked();else error.value=t.value.failed;}}
function enter(id){selected.value=id;selectObject(id);stage.value='chat';}
function locked(){adding.value=false;newName.value='';stage.value='unlock';objects.value=[];selected.value='';selectObject('');pin.value='';firstPin.value='';error.value='';document.title='EmotionChat';}
async function lock(){try{await request('auth/lock',{});locked();}catch{error.value=t.value.failed;}}
function reset(){pin.value='';firstPin.value='';error.value='';}
async function digit(n){if(busy.value || pin.value.length>=6)return;error.value='';pin.value+=n;if(pin.value.length!==6)return;
 if(stage.value==='setup'&&!firstPin.value){firstPin.value=pin.value;pin.value='';return;}
 if(stage.value==='setup'&&firstPin.value!==pin.value){reset();error.value=t.value.mismatch;return;}
 busy.value=true;try{await request('auth/'+(stage.value==='setup'?'setup':'unlock'),{pin:pin.value});pin.value='';firstPin.value='';await showObjects();}catch(e){pin.value='';error.value=e.status===429?t.value.later:e.status===401?t.value.wrong:t.value.failed;if(e.status===409){stage.value='unlock';firstPin.value='';}}finally{busy.value=false;}}
function key(e){if(!['setup','unlock'].includes(stage.value)||busy.value||e.metaKey||e.ctrlKey||e.altKey)return;if(/^\d$/.test(e.key)){e.preventDefault();digit(e.key);}else if(e.key==='Backspace'){e.preventDefault();pin.value=pin.value.slice(0,-1);}}
onMounted(()=>{init();window.addEventListener('keydown',key);window.addEventListener('emotion-locked',locked);});
onUnmounted(()=>{window.removeEventListener('keydown',key);window.removeEventListener('emotion-locked',locked);});
</script>
<style>
.memory-options{display:grid;gap:8px;max-height:24dvh;overflow:auto}.memory-options button{color:#37313f;padding:12px;text-align:left;border:1px solid #ddd;border-radius:12px;background:white;overflow-wrap:anywhere;cursor:pointer}.memory-options .chosen{color:#7255ac;border-color:#946bc4;background:#f1eaf8}

.add-object{text-align:left;margin:12px 0}.add-object label{font-size:13px;color:#777;display:grid;gap:8px}.add-object input{box-sizing:border-box;width:100%;min-width:0;border:1px solid #ddd1e9;border-radius:12px;padding:12px;font-size:16px}.add-object>button{width:100%;margin-top:10px;padding:12px;border:0;border-radius:12px;background:#eee9f8;color:#7255ac;cursor:pointer}

.access-shell{min-height:100dvh;display:grid;place-items:center;padding:24px;background:radial-gradient(ellipse at 15% 5%,#ece5fb,transparent 55%),radial-gradient(ellipse at 90% 85%,#f8e8ed,transparent 55%),#f5f6f8}
.access-card{width:min(100%,420px);text-align:center;padding:28px 32px 18px;border-radius:30px;background:#ffffffd9;box-shadow:0 20px 70px #33334d0d;border:1px solid #fff}
.access-logo{width:48px;height:48px}.access-brand{font-size:13px;letter-spacing:.08em;color:#777582;margin:6px 0 14px}.access-card h1{font-size:23px;margin:22px 0 6px;line-height:1.3}.access-hint{color:#7a7784;font-size:13px;line-height:1.7}.access-languages{display:flex;justify-content:center;gap:4px}.access-languages button,.access-secondary{border:0;background:transparent;color:#777;padding:7px 12px;font-size:12px;border-radius:12px;cursor:pointer}.access-languages .active{background:#eee9f8;color:#7255ac}.pin-dots{display:flex;gap:16px;justify-content:center;margin:30px 0}.pin-dots span{width:12px;height:12px;border:1.5px solid #b4a7c9;border-radius:50%}.pin-dots .filled{background:#946bc4;border-color:#946bc4}.pin-keypad{display:grid;grid-template-columns:repeat(3,1fr);gap:12px 18px;max-width:280px;margin:auto}.pin-keypad button{border:0;border-radius:50%;aspect-ratio:1;background:#eeedf3;color:#34313f;font-size:27px;cursor:pointer;touch-action:manipulation}.pin-keypad button:active{background:#dfd5ed}.pin-keypad .pin-small{font-size:13px;background:transparent}.access-error{min-height:22px;font-size:13px;color:#b34d61;margin:18px 0 0}.object-list{display:grid;gap:12px;margin:24px 0;max-height:50dvh;overflow:auto}.object-list button{display:flex;align-items:center;gap:12px;padding:16px;border:1px solid #eee9f3;background:white;border-radius:18px;text-align:left;font-size:16px;color:#37313f;cursor:pointer;overflow-wrap:anywhere}.object-avatar{display:grid;place-items:center;flex-shrink:0;width:40px;height:40px;border-radius:14px;background:#f2e9f6;color:#9b6bb5}.object-arrow{margin-left:auto}.object-back{border:0;background:transparent;padding:0;cursor:pointer}.access-card button:focus-visible{outline:2px solid #946bc4;outline-offset:3px}@media(max-height:720px){.access-shell{padding:12px}.access-card{padding:14px 24px}.access-logo{width:32px;height:32px}.access-card h1{margin-top:12px;font-size:20px}.pin-dots{margin:18px 0}.pin-keypad{max-width:228px;gap:8px 18px}.access-error{margin-top:8px}}
</style>
