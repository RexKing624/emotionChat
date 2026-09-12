import test from 'node:test';
import assert from 'node:assert/strict';
import {replyStyle,compactReply,repeatedWording,chooseFollowUp} from './conversation-style.js';
import {nextSchedule,scheduleFollowUp} from './proactive.js';
const user={content:'在吗',timestamp:'2026-09-12T00:00:00Z'};
test('casual replies stay short and detailed requests can expand',()=>{
 assert.equal(replyStyle('你帮我写了不好？').limit,120);
 assert.ok(replyStyle('请详细解释一下').limit>120);
 assert.equal(compactReply('好呀。'+ '新的事情'.repeat(100),120),'好呀。');
 assert.ok(Array.from(compactReply('🙂'.repeat(200),120)).length<=120);
});
test('followups vary, preserve zero sent count and respect busy user',()=>{
 const kinds=new Set(Array.from({length:100},(_,i)=>chooseFollowUp({sentCount:1},user,'爱打趣，黏人',()=>i/100).behavior));
 for(const key of ['continue','nudge','feign','soften','new','pause'])assert.ok(kinds.has(key));
 assert.equal(chooseFollowUp({sentCount:0,followUp:true},user,'',()=>0).count,0);
 assert.equal(chooseFollowUp({sentCount:2},{...user,content:'在忙，晚点回'},'',()=>0).behavior,'pause');
 assert.ok(!Array.from({length:100},(_,i)=>chooseFollowUp({sentCount:8},user,'黏人',()=>i/100).behavior).includes('feign'));
});
test('reply resets followup state; waiting formula stays unchanged',()=>{
 const settings={minMinutes:1,maxMinutes:10};const previous={key:`${user.timestamp}:${user.content}`,timing:'1:10',sentCount:3,lastBehavior:'nudge'};
 const follow=scheduleFollowUp(previous,settings,0,()=>0);assert.equal(follow.due,4*60000);assert.equal(follow.sentCount,3);
 const reset=nextSchedule(follow,{...user,content:'来了'},1000,()=>0,settings);assert.equal(reset.sentCount,undefined);assert.equal(reset.lastBehavior,undefined);
});
test('same topic is allowed; copied sentences are rejected',()=>{
 const history=[{role:'assistant',content:'刚才那家咖啡店看起来真的挺有意思的。'}];
 assert.equal(repeatedWording('那家店你想去吗？',history),false);
 assert.equal(repeatedWording(history[0].content,history),true);
});
