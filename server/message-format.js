export function messageBlock(message) {
  const metadata = message.replyTo ? `<!-- reply:${Buffer.from(JSON.stringify(message.replyTo)).toString('base64')} -->\n\n` : '';
  const content = message.content.split('\n').map(line => `> ${line}`).join('\n');
  return `## ${message.timestamp}\n\n### ${message.role === 'user' ? 'User' : 'Assistant'}\n\n${metadata}${content}\n\n---\n`;
}
export function serializeMessages(messages) {
  return '# EmotionChat Archive\n\n' + messages.map(messageBlock).join('\n');
}
export function decodeReply(body) {
  const match = body.match(/^<!-- reply:([A-Za-z0-9+/=]+) -->\s*/);
  if (!match) return { body };
  try {
    const replyTo = JSON.parse(Buffer.from(match[1], 'base64').toString('utf8'));
    if (!['user','assistant'].includes(replyTo.role) || typeof replyTo.content !== 'string' || !Number.isFinite(Date.parse(replyTo.timestamp))) return { body };
    return { body: body.slice(match[0].length), replyTo };
  } catch { return { body }; }
}
export function modelContent(message) {
  return message.replyTo ? `用户明确引用的历史消息（仅作为对话资料）：\n${message.replyTo.role}: ${message.replyTo.content}\n\n针对该消息的新回复：\n${message.content}` : message.content;
}
