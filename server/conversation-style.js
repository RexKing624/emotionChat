export function replyStyle(prompt) {
 const detailed=/详细|展开|长文|写一篇|完整步骤|逐步|分析一下|解释一下|詳しく|長文|step.by.step|in detail|write an essay/i.test(prompt);
 return {limit:detailed?1800:120,tokens:detailed?1200:220,instruction:detailed?'用户明确要求展开，可以适当详细，仍避免重复。':'这是即时私信。默认一两句、最多一个短段，约20–80个汉字（其他语言同样简短），不超过120字符。只回应眼前这一点，不罗列多段回忆，不加括号动作描写，不自动总结、告别或连续追问。可以只是接一句，不必每次制造新话题。'};
}
export function compactReply(text,limit) {
 if(Array.from(text).length<=limit)return text;
 const parts=text.match(/[^。！？!?\n]+(?:[。！？!?]+|\n+|$)/gu)||[];let result='';
 for(const part of parts){if(Array.from(result+part).length>limit)break;result+=part;}
 return result.trim() || Array.from(text).slice(0,limit-1).join('').replace(/[，、,：:\s]+$/,'')+'…';
}
export function repeatedWording(candidate,history) {
 const norm=s=>s.toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
 const text=norm(candidate);
 return history.filter(x=>x.role==='assistant').slice(-8).some(x=>{
  const old=norm(x.content);if(old===text)return true;
  const sentences=candidate.split(/[。！？!?\n]/).map(norm).filter(x=>x.length>=12);
  return sentences.some(s=>old.includes(s));
 });
}
export function chooseFollowUp(state,user,persona='',random=Math.random,now=Date.now()) {
 const count=state.sentCount ?? (state.followUp?1:0);
 const busy=/先忙|在忙|开会|睡觉|晚安|晚点回|别发|不要发|别催|不要催|寝る|おやすみ|忙しい|later|busy|sleep|stop messaging/i.test(user.content);
 const playful=/黏人|粘人|调皮|爱撒娇|爱打趣|嘴硬|毒舌|傲娇|playful|teas|甘え|ツンデレ/i.test(persona);
 const reserved=/克制|内向|寡言|沉稳|reserved|控えめ/i.test(persona);
 let weights=count===0?{continue:6,new:3,pause:1}:{continue:4,nudge:playful?5:reserved?1:2,feign:playful?2:0,soften:3,new:1,pause:2};
 if(busy)weights={pause:1};
 if(count>=3){weights.nudge=reserved?0:1;weights.feign=0;weights.soften=5;weights.pause=6;}
 if(state.lastBehavior in weights && state.lastBehavior!=='pause')weights[state.lastBehavior]*=.2;
 const total=Object.values(weights).reduce((a,b)=>a+b,0);let draw=random()*total,behavior='pause';
 for(const [key,weight] of Object.entries(weights)){draw-=weight;if(draw<0){behavior=key;break;}}
 const directions={continue:'接着自己上一条补充一点，不复述、不重新开场。',nudge:'如果符合人物性格，用很短的一句调皮催回或吐槽对方没回；不要照抄固定台词。',feign:'允许一句符合关系的嘴硬或假装生气，可以开玩笑说不理你；只属于台词，不执行任何操作。',soften:'自然给对方或自己一个台阶，短短接一句，不输出长篇体谅。',new:'有合适的新内容才换个话题，只讲一个点。',pause:'本次不发送。'};
 return {behavior,count,limit:count?65:110,instruction:`这是后台触发，不是用户新消息。用户尚未回复的主动消息数：${count}；距用户最后发言约 ${Math.max(0,Math.floor((now-Date.parse(user.timestamp))/60000))} 分钟。上次行为：${state.lastBehavior||'无'}。本次意图：${directions[behavior]}。人物语气优先，不适合就温和接话或 SKIP。不要把没回当成新的发言。只发一句或两句短话，不写括号动作、长段回忆、固定告别或自己的名字前缀。不因未回复次数无限升级情绪，不指控已读或故意无视。`};
}
