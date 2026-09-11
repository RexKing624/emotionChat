import { promises as fs } from 'node:fs';
import path from 'node:path';
import { serializeMessages } from './message-format.js';
const idFor = name => Buffer.from(name).toString('base64url');
export async function listMemories(objectsRoot) {
  let dirs;try{dirs=await fs.readdir(objectsRoot,{withFileTypes:true});}catch(e){if(e.code==='ENOENT')return [];throw e;}
  const items=[];
  for(const dir of dirs){
    if(!dir.isDirectory()||dir.name.startsWith('.'))continue;
    const theme=path.join(objectsRoot,dir.name),nested=path.join(theme,'skill','emotionchat');let directory=theme;
    try{if((await fs.stat(nested)).isDirectory())directory=nested;}catch(e){if(e.code!=='ENOENT')throw e;}
    items.push({id:idFor(dir.name),name:dir.name,directory,theme});
  }
  return items;
}
async function readIndex(runtimeRoot){try{return JSON.parse(await fs.readFile(path.join(runtimeRoot,'chat-index.json'),'utf8'));}catch(e){if(e.code==='ENOENT')return {};throw e;}}
export async function listProfiles(objectsRoot, archiveRoot, runtimeRoot) {
  const memories=await listMemories(objectsRoot),index=await readIndex(runtimeRoot);
  let files;try{files=await fs.readdir(archiveRoot,{withFileTypes:true});}catch(e){if(e.code==='ENOENT')return [];throw e;}
  return files.filter(f=>f.isFile()&&f.name.endsWith('.md')).map(f=>{
    const name=f.name.slice(0,-3),memory=memories.find(m=>m.name===index[name]);
    return {id:idFor(name),name,directory:memory?.directory,theme:memory?.theme,memoryName:memory?.name,archive:path.join(archiveRoot,f.name),runtime:path.join(runtimeRoot,idFor(name))};
  });
}
export async function startProfile(objectsRoot, archiveRoot, runtimeRoot, input) {
  const name=typeof input?.name==='string'?input.name.trim():'';
  if(!name||name.length>40||name.startsWith('.')||/[\\/<>:"|?*\x00-\x1f]/.test(name))throw Object.assign(new Error('invalid_name'),{status:400});
  const memory=(await listMemories(objectsRoot)).find(m=>m.id===input.memoryId);
  if(!memory)throw Object.assign(new Error('memory_missing'),{status:400});
  await fs.mkdir(archiveRoot,{recursive:true});await fs.mkdir(runtimeRoot,{recursive:true});
  const archive=path.join(archiveRoot,name+'.md');
  try{await fs.writeFile(archive,serializeMessages([{role:'assistant',content:'我在。你说。',timestamp:new Date().toISOString()}]),{flag:'wx'});}catch(e){if(e.code==='EEXIST')throw Object.assign(new Error('name_exists'),{status:409});throw e;}
  try{const index=await readIndex(runtimeRoot);index[name]=memory.name;const file=path.join(runtimeRoot,'chat-index.json');await fs.writeFile(file+'.tmp',JSON.stringify(index,null,2));await fs.rename(file+'.tmp',file);}
  catch(e){await fs.unlink(archive);throw e;}
  return {id:idFor(name),name};
}
