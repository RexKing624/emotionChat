import express from 'express';
import { listProfiles, listMemories, startProfile } from './profiles.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAccess } from './access.js';
import { createChatApp } from './chat-app.js';
import { readSettings, writeSettings } from './settings.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let config = {};
try { config = JSON.parse(await fs.readFile(path.join(root,'local.config.json'),'utf8')); } catch(e) { if(e.code !== 'ENOENT') throw e; }
const value = key => process.env[key] ?? config[key];
const objectsRoot = path.resolve(root, value('MEMORIES_DIR') || 'emotion');
const archiveRoot = path.resolve(root,value('CHAT_RECORDS_DIR') || 'chats');
const runtimeRoot = path.join(root,'runtime');
const profiles = () => listProfiles(objectsRoot,archiveRoot,runtimeRoot);
const app = express();
app.use(express.json({limit:'2mb'}));
app.use('/api',(req,res,next) => {
  res.set('Cache-Control','no-store');
  if (!['GET','HEAD'].includes(req.method) && req.get('X-EmotionChat') !== '1') return res.status(403).json({error:'invalid_request'});
  next();
});
const access = createAccess(path.join(root,'auth.config.json'));
app.use('/api/auth',access.router);
app.use('/api',access.guard);
const instances = new Map();
app.get('/api/objects',async (_req,res) => {
  try { res.json({objects:(await profiles()).map(({id,name})=>({id,name}))}); }
  catch { res.status(500).json({error:'objects_unavailable'}); }
});
app.get('/api/memories',async(_req,res)=>{
  try{res.json({objects:(await listMemories(objectsRoot)).map(({id,name})=>({id,name}))});}catch{res.status(500).json({error:'objects_unavailable'});}
});
let creationQueue = Promise.resolve();
app.post('/api/objects',(req,res)=>{
  const task=async()=>{try{res.status(201).json(await startProfile(objectsRoot,archiveRoot,runtimeRoot,req.body));}catch(e){res.status(e.status||500).json({error:e.status?e.message:'create_failed'});}};
  creationQueue=creationQueue.then(task,task);
});
app.use('/api/objects/:id',async(req,res,next)=>{
  try {
    const profile = (await profiles()).find(p => p.id === req.params.id);
    if (!profile || !profile.directory) return res.status(404).json({error:'object_missing'});
    if (!instances.has(profile.id)) {
      const settingsFile = path.join(profile.runtime,'settings.json');
      try { await fs.access(settingsFile); } catch(e) {
        if(e.code !== 'ENOENT') throw e;
        const settings = await readSettings(settingsFile);
        await writeSettings(settingsFile,{...settings,name:profile.name});
      }
      // Recheck after file I/O: concurrent history/health requests share one instance.
      if (!instances.has(profile.id)) instances.set(profile.id, createChatApp(profile));
    }
    req.url = '/api' + req.url;
    instances.get(profile.id).app(req,res,next);
  } catch { res.status(500).json({error:'object_unavailable'}); }
});
app.use('/api',(_req,res)=>res.status(404).json({error:'not_found'}));
app.listen(value('PORT') || 3000,'127.0.0.1',()=>console.log('EmotionChat backend ready (unlock required)'));
