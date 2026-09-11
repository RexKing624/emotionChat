import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createReality,parseFeed,publicTopics,intervalMs,relevantItem,resolveTopicPrompt,evidenceReply} from './reality.js';
import {defaults,validateSettings} from './settings.js';
const time=Date.parse('2026-09-12T01:00:00Z');
const rss=(date=new Date(time).toUTCString())=>`<rss><channel><item><title><![CDATA[季節のコーヒー &amp; 新作]]></title><link>https://news.google.com/rss/articles/example</link><pubDate>${date}</pubDate><source>Sample Coffee</source></item></channel></rss>`;
test('settings migrate, validate limits, and preserve zero',()=>{
 for(const value of [0,8])assert.equal(validateSettings({...defaults,realityIntensity:value}).realityIntensity,value);
 for(const value of [-1,9,1.5,'3'])assert.throws(()=>validateSettings({...defaults,realityIntensity:value}));
 assert.throws(()=>validateSettings({...defaults,realityEnabled:'true'}));
 const old={...defaults};delete old.realityEnabled;delete old.realityIntensity;assert.equal(validateSettings(old).realityEnabled,false);
});
test('public categories, negatives and stale feeds',()=>{
 assert.deepEqual(publicTopics('喜欢手冲'),[{id:'coffee',query:'コーヒー 新作'}]);
 assert.deepEqual(publicTopics('讨厌咖啡'),[]);
 assert.equal(parseFeed(rss('2020-01-01'),'coffee',time).length,0);
 assert.equal(parseFeed(rss(),'coffee',time)[0].title,'季節のコーヒー & 新作');
 assert.ok(intervalMs(8)<intervalMs(1));
});
test('disabled, demand-only, privacy, persistence, dedupe and expiry',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'reality-test-'));let prefs={realityEnabled:false,realityIntensity:0},clock=time,calls=[];
 const opts={file:path.join(dir,'reality.md'),persona:'秘密姓名ABC 東京 喜欢咖啡',settings:async()=>prefs,now:()=>clock,fetcher:async url=>{calls.push(String(url));return {ok:true,text:async()=>rss()};}};
 const app=createReality(opts);
 try{
  await app.refresh({prompt:'最近咖啡新品'});assert.equal(calls.length,0);
  prefs.realityEnabled=true;
  await app.refresh({background:true});assert.equal(calls.length,0);
  await app.refresh({prompt:'咖啡好喝'});assert.equal(calls.length,0);
  await app.refresh({prompt:'秘密对话ABC 最近咖啡新品'});assert.equal(calls.length,1);
  assert.ok(!decodeURIComponent(calls[0]).includes('ABC'));
  assert.ok(decodeURIComponent(calls[0]).includes('東京'));
  assert.equal(await app.context('心情不好'), '');
  assert.match(await app.context('咖啡'),/news.google.com/);
  assert.equal(await app.context('咖啡'),'');
  const reopened=createReality(opts);assert.equal(await reopened.context('咖啡'),'');reopened.dispose();
  assert.match(await readFile(opts.file,'utf8'),/offeredAt/);
  await app.refresh({prompt:'最近咖啡新品'});assert.equal(calls.length,1);
  clock+=15*86400000;assert.equal(await app.context('咖啡'),'');
  prefs.realityEnabled=false;assert.equal(await app.context('咖啡'),'');
 }finally{app.dispose();await rm(dir,{recursive:true,force:true});}
});
test('offline search is nonfatal and throttled',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'reality-offline-'));let calls=0;
 const app=createReality({file:path.join(dir,'reality.md'),persona:'coffee',settings:async()=>({realityEnabled:true,realityIntensity:8}),now:()=>time,fetcher:async()=>{calls++;throw Error('offline');}});
 try{await app.refresh({background:true});await app.refresh({background:true});assert.equal(calls,1);assert.equal(await app.context('coffee'),'');}finally{app.dispose();await rm(dir,{recursive:true,force:true});}
});

test('chat integration includes news, persists reply and leaves memory unchanged',async()=>{
 const {createChatApp}=await import('./chat-app.js');
 const {mkdir,writeFile}=await import('node:fs/promises');
 const dir=await mkdtemp(path.join(tmpdir(),'reality-chat-'));
 const memory=path.join(dir,'memory'),runtime=path.join(dir,'runtime');await mkdir(memory);await mkdir(runtime);
 await writeFile(path.join(memory,'persona.md'),'喜欢咖啡，住在東京。');
 await writeFile(path.join(runtime,'settings.json'),JSON.stringify({...defaults,realityEnabled:true,realityIntensity:0}));
 const original=globalThis.fetch;let messages;
 globalThis.fetch=async(url,options)=>{
  if(String(url).startsWith('https://news.google.com/'))return new Response(rss(new Date().toUTCString()));
  if(String(url).endsWith('/api/chat')){const payload=JSON.parse(options.body);messages=payload.messages;return Response.json({message:{content:payload.format==='json'?'{"supported":true}':'看到一条咖啡新品消息。'}});}
  return original(url,options);
 };
 const instance=createChatApp({directory:memory,archive:path.join(dir,'chat.md'),runtime});
 const server=instance.app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 try{
  const response=await original(`http://127.0.0.1:${server.address().port}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'最近咖啡有什么新品？'})});
  assert.equal(response.status,200);assert.ok(messages);
  const data=await response.json();assert.equal(data.reply,'看到一条咖啡新品消息。');assert.equal(data.messages[1].sources.length,1);
  assert.match(await readFile(path.join(dir,'chat.md'),'utf8'),/<!-- sources:/);
  assert.equal(await readFile(path.join(memory,'persona.md'),'utf8'),'喜欢咖啡，住在東京。');
 }finally{await instance.dispose();await new Promise(resolve=>server.close(resolve));globalThis.fetch=original;await rm(dir,{recursive:true,force:true});}
});

test('background photography must not block a new coffee question',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'reality-topic-'));let calls=[];
 const app=createReality({file:path.join(dir,'reality.md'),persona:'喜欢摄影，住在東京',settings:async()=>({realityEnabled:true,realityIntensity:8}),now:()=>time,fetcher:async url=>{calls.push(decodeURIComponent(String(url)));return new Response(rss());}});
 try{
  await app.refresh({background:true});
  await app.refresh({prompt:'最近有什么咖啡新品？'});
  assert.equal(calls.length,2);assert.ok(calls[1].includes('コーヒー'));
  await app.refresh({prompt:'最近有什么咖啡新品？'});assert.equal(calls.length,2);
 }finally{app.dispose();await rm(dir,{recursive:true,force:true});}
});


test('coffee relevance rejects game and merchandise but keeps product news',()=>{
 for(const title of ['東京のコーヒートーク パッケージ版 12月発売','STARBUCKS STAND by BEAMS CORE Collection 新登場','新作ゲーム Coffee Talk Tokyo']) assert.equal(relevantItem({topic:'coffee',title}),false);
 assert.equal(relevantItem({topic:'coffee',title:'Scrop コーヒーゼリー 9月10日より新発売'}),true);
});
test('short follow-ups inherit user topic, never assistant invented topic',()=>{
 const history=[{role:'user',content:'东京咖啡有什么推荐'},{role:'assistant',content:'游戏很好玩'}];
 assert.ok(publicTopics(resolveTopicPrompt('你看看新品呢 不要空谈',history)).some(t=>t.id==='coffee'));
 assert.equal(resolveTopicPrompt('今天很难过',history),'今天很难过');
 assert.equal(resolveTopicPrompt('最近有哪些电影',history),'最近有哪些电影');
});
test('empty evidence cannot turn into invented recommendations',()=>{
 const text=evidenceReply([]);assert.match(text,/没查到/);assert.ok(!text.includes('星巴克'));
});
