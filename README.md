# aiChat

这是一个本地 Ollama + Express + Vue3 聊天环境，现在已接入：

- 模型：`qwen3:14b`
- exskill：`/Documents/skills/XXXX`
- 后端接口：`POST /api/chat`
- 对话存档：`archive/XXXX.md`

## 启动

先确认 Ollama 正在运行：

```bash
ollama serve
```

如果模型不在，拉取：

```bash
ollama pull qwen3:14b
```

启动聊天项目：

```bash
mac-ai-1-ollama-2-qwen3
npm run dev
```

打开：

```text
http://127.0.0.1:5173
```

## 环境变量

- `PORT`: 后端端口，默认 `3000`
- `OLLAMA_URL`: Ollama API 地址，默认 `http://127.0.0.1:11434`
- `OLLAMA_MODEL`: 模型名，默认 `qwen3:14b`
- `EXSKILL_DIR`: skill 目录，默认 `/Documents/skills/XXXXX` 可以用exSkills的方式蒸馏你想要”复活“的对象
- `CHAT_ARCHIVE_PATH`: Markdown 存档路径，默认 `archive/elephui_chat_archive.md`

## API 测试

```bash
curl -X POST http://127.0.0.1:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"你现在在干嘛"}'
```

## 说明

后端会在每次请求时把 `elephui_full` 的 `SKILL.md`、`persona.md`、`memories.md` 和 IG 摘要注入为 system prompt。聊天记录会自动追加到 Markdown 存档里，方便之后继续修正 persona 或回看对话。
