import test from 'node:test';
import assert from 'node:assert/strict';
import {groundedReply} from './grounded-reply.js';
import {messageBlock,decodeSources,decodeReply} from './message-format.js';
const items=[{title:'Scrop 新作コーヒーゼリー',url:'https://news.google.com/rss/articles/example',source:'Example',publishedAt:'2026-09-12T00:00:00Z'}];
test('natural reply keeps sources separate',async()=>{
 const reply=await groundedReply({items,prompt:'咖啡新品呢',persona:'轻松说话',generate:async(_,verify)=>verify?'{"supported":true}':'那个咖啡冻有点想试诶。'});
 assert.equal(reply.content,'那个咖啡冻有点想试诶。');assert.equal(reply.sources.length,1);assert.ok(!reply.content.includes('https'));
});
test('unsupported drafts retry and safely fall back',async()=>{
 let drafts=0;const reply=await groundedReply({items,prompt:'新品',persona:'',generate:async(_,verify)=>{if(verify)return '{"supported":false}';drafts++;return '星巴克今天出了新款，我喝过，售价500日元。';}});
 assert.equal(drafts,2);assert.ok(!reply.content.includes('500'));assert.ok(reply.content.includes(items[0].title));
});
test('malformed verification never approves a draft',async()=>{
 const reply=await groundedReply({items:[],prompt:'新品',persona:'',generate:async()=> 'unsupported'});assert.match(reply.content,/没找到/);
});
test('sources survive Markdown round trip with a reply quote',()=>{
 const m={role:'assistant',content:'想试试',timestamp:'2026-09-12T00:00:00Z',sources:items,replyTo:{role:'user',content:'新品',timestamp:'2026-09-12T00:00:00Z'}};
 const raw=messageBlock(m);const body=raw.split('### Assistant\n\n')[1];const decoded=decodeReply(body);assert.equal(decoded.replyTo.content,'新品');const result=decodeSources(decoded.body);assert.deepEqual(result.sources,items);assert.match(result.body,/想试试/);
});
