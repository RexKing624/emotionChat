import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {mkdtemp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createAccess} from './access.js';
import {createChatApp} from './chat-app.js';
async function serve(app){const s=app.listen(0,'127.0.0.1');await new Promise(r=>s.once('listening',r));return {url:`http://127.0.0.1:${s.address().port}`,close:()=>new Promise(r=>s.close(r))};}
test('passcode setup, hashing, authentication, cooldown and locking',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'emotion-auth-'));const file=path.join(dir,'auth.json');
 const app=express();app.use(express.json());const access=createAccess(file);app.use('/auth',access.router);app.get('/private',access.guard,(_,res)=>res.json({ok:true}));
 const host=await serve(app);const request=(route,pin,cookie)=>fetch(host.url+route,{method:pin===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(cookie?{cookie}:{})},...(pin===undefined?{}:{body:JSON.stringify({pin})})});
 try{
  assert.equal((await request('/private')).status,401);
  assert.equal((await request('/auth/setup','123')).status,400);
  const setup=await request('/auth/setup','012345');assert.equal(setup.status,200);const cookie=setup.headers.get('set-cookie').split(';')[0];
  const disk=JSON.parse(await readFile(file));assert.equal(disk.algorithm,'scrypt');assert.equal(disk.hash.length,128);assert(!JSON.stringify(disk).includes('012345'));
  assert.equal((await request('/auth/setup','654321')).status,409);
  assert.equal((await request('/private',undefined,cookie)).status,200);
  await request('/auth/lock','',cookie);assert.equal((await request('/private',undefined,cookie)).status,401);
  const unlocked=await request('/auth/unlock','012345');assert.equal(unlocked.status,200);
  for(let i=0;i<5;i++)assert.equal((await request('/auth/unlock','999999')).status,401);
  assert.equal((await request('/auth/unlock','999999')).status,429);
 }finally{await host.close();await rm(dir,{recursive:true,force:true});}
});
test('profiles isolate history and settings',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'emotion-profiles-'));const instances=[];const hosts=[];
 try{
  for(const name of ['Alpha','Beta']){const directory=path.join(dir,name);await mkdir(directory);const archive=path.join(directory,'chat.md');await writeFile(archive,`# Archive\n\n## 2026-09-11T00:00:00.000Z\n### User\n${name} message\n`);const instance=createChatApp({directory,archive,name});instances.push(instance);hosts.push(await serve(instance.app));}
  for(let i=0;i<2;i++){const h=await(await fetch(hosts[i].url+'/api/history')).json();assert.equal(h.messages[0].content,['Alpha message','Beta message'][i]);}
  const settings=await(await fetch(hosts[0].url+'/api/settings')).json();await fetch(hosts[0].url+'/api/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...settings,name:'Changed'})});
  assert.equal((await(await fetch(hosts[1].url+'/api/settings')).json()).name,'Assistant');
 }finally{instances.forEach(i=>i.dispose());await Promise.all(hosts.map(h=>h.close()));await rm(dir,{recursive:true,force:true});}
});

test('named chats share a read-only memory and never overwrite each other',async()=>{
 const {listMemories,listProfiles,startProfile}=await import('./profiles.js');
 const dir=await mkdtemp(path.join(tmpdir(),'emotion-named-'));
 try{
  await mkdir(path.join(dir,'emotion','Example'),{recursive:true});
  const memoryFile=path.join(dir,'emotion','Example','memories.md');await writeFile(memoryFile,'Original memory');
  const [memory]=await listMemories(path.join(dir,'emotion'));
  for(const name of ['First','Second'])await startProfile(path.join(dir,'emotion'),path.join(dir,'chats'),path.join(dir,'runtime'),{name,memoryId:memory.id});
  const chats=await listProfiles(path.join(dir,'emotion'),path.join(dir,'chats'),path.join(dir,'runtime'));
  assert.equal(chats.length,2);assert.equal(chats[0].directory,chats[1].directory);assert.notEqual(chats[0].archive,chats[1].archive);
  assert.equal(path.dirname(chats[0].archive),path.join(dir,'chats'));
  const before=await readFile(chats[0].archive,'utf8');assert(before.includes('我在。你说。'));
  await assert.rejects(startProfile(path.join(dir,'emotion'),path.join(dir,'chats'),path.join(dir,'runtime'),{name:chats[0].name,memoryId:memory.id}));
  await assert.rejects(startProfile(path.join(dir,'emotion'),path.join(dir,'chats'),path.join(dir,'runtime'),{name:'../escape',memoryId:memory.id}));
  assert.equal(await readFile(chats[0].archive,'utf8'),before);assert.equal(await readFile(memoryFile,'utf8'),'Original memory');
 }finally{await rm(dir,{recursive:true,force:true});}
});
