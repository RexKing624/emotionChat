# EmotionChat

[中文](README.md) · [日本語](README.ja.md) · [English](README.en.md)

本地 Ollama + Express + Vue 3 聊天应用。支持人物资料、Markdown 历史、相关回忆检索、主动聊天，以及中文、日文、英文界面。

## AI 模型来自哪里？地址在哪里填写？

EmotionChat 不附带 AI 模型，也不使用本项目提供的云端账号。回复由你自己运行或可访问的 **Ollama 服务**生成。当前接口支持 Ollama，不是任意聊天网站或 OpenAI 兼容接口。

打开根目录的 **`ai.config.js`**，只修改其中这一行地址：

```js
export default 'http://127.0.0.1:11434';
```

模型在当前电脑运行时使用上面的地址；在另一台电脑上运行时，填 `http://模型电脑的局域网IP:11434` 或可解析的主机名。填写服务根地址，不要加 `/api/chat`。手机仍然访问 EmotionChat 页面，模型地址应当能从后端所在电脑访问。修改后重启 `npm run dev`。

默认请求模型 `qwen3.5:9b`。请在模型电脑上安装 Ollama 并运行 `ollama pull qwen3.5:9b`。如果使用其他已安装模型，在可选的 `local.config.json` 中修改 `OLLAMA_MODEL`。地址和模型名称不同：`ai.config.js` 只设置地址，不能自动安装模型。

地址以 `ai.config.js` 为唯一来源。旧的 `OLLAMA_URL` 环境变量和 local.config.json 字段不再生效。公开提交前将私人地址恢复为示例地址。


## 两步开始：导入回忆主题，连接模型

1. 将一个回忆主题放进 `Emotion/`。可以使用 exskill 蒸馏，也可以用其他工具或自己整理，按下方文件结构放入 Markdown 文本。
2. 复制 `local.config.example.json` 为 `local.config.json`，在 `ai.config.js` 填写地址，并按需配置 `OLLAMA_MODEL`，执行下方启动命令即可聊天。

```text
Emotion/
  skill/emotionchat/
    SKILL.md             角色运行规则
    persona.md           人物设定、语气和关系
  memories.md            蒸馏后的共同回忆
  conversations.md       可选的历史对话摘录
  imports/               原始资料暂存（默认不读取）
archive/                 新对话自动保存到 chat.md
```

把蒸馏结果替换进模板即可，不需要修改代码。已有 exskill 中的 `memories.md` 可以放进 `Emotion/memories.md`，`SKILL.md` 和 `persona.md` 放进 skill 目录。原始微信导出、图片、PDF 等需先用其他工具整理成 Markdown；仅放进 imports 不会自动解析。修改资料后重启后端。

`Emotion/conversations.md` 用于模型回忆，不会自动显示为网页聊天气泡。网页显示的是 `archive/chat.md` 中由应用记录的对话。导入的 memories 和 conversations 各读取前 24000 字符，长资料请先蒸馏精简。

发布仓库时仅保留空白模板；替换成真实回忆后不要再次提交这些文件。本发布目录不包含私人配置、聊天记录或旧 Git 历史。


## 启动

需要 Node.js 22 或更高版本，以及可访问的 Ollama 服务。先在模型所在电脑安装所需模型，例如 `ollama pull qwen3.5:9b`。

```sh
npm install
cp local.config.example.json local.config.json
npm run dev
```
编辑 `local.config.json`，填写可选模型名称及本地人物目录。环境变量优先于本地配置。

电脑打开 http://127.0.0.1:5174/ 。手机连接同一局域网，打开 `http://电脑局域网IP:5174/`。后台需保持运行；仅在可信局域网使用，当前没有登录验证。

## 配置

| 项目 | 默认值 / 用途 |
| --- | --- |
| `PORT` | `3000`，后端端口；修改时同步调整 Vite 代理 |
| `OLLAMA_MODEL` | `qwen3.5:9b` |
| `EXSKILL_DIR` | `Emotion/skill/emotionchat/`，本地人物资料目录 |
| `CHAT_ARCHIVE_PATH` | `archive/chat.md` |

人物目录可提供 `meta.json`、`SKILL.md`、`persona.md`、`memories.md` 和可选的 `knowledge/chats/ig_screenshots_summary.md`。人物资料在后端启动时读取，修改后需重启。

## 使用

- 设置中修改显示名字、界面语言、主动聊天等待范围和安静时段。界面语言不会修改对话语言。
- 设置标题右侧显示当前配置模型的可用、未安装或离线状态；可用表示服务可达且模型已安装，不代表正在生成。
- 每条消息保存时间戳，网页恢复 Markdown 历史。日期显示为 `01/Apr/2026,03:24`，按设备本地时间。
- 回忆参考最近 20 条和关键词匹配的最多 6 条较早记录，每条上下文最多 4000 字符；不是完整语义搜索。
- 默认随机等待 10–30 分钟主动找话题，日本时间 23:00–09:00 安静。没有合适话题会跳过，未回应不连续发。时间相同表示关闭安静时段。
- 网页每 5 秒获取历史；手机锁屏不提供系统通知。

## 数据与开源

`archive/`、`Emotion/skill/emotionchat/`、`local.config.json` 均被 Git 忽略。设置和主动聊天计时状态保存在存档旁的 JSON 文件中。不要提交真实对话、人物资料或私有配置。忽略规则不会清除已有 Git 历史；发布前还应检查历史提交。

## 接口与构建

`GET /api/history`、`GET /api/health`、`GET /api/settings`、`PUT /api/settings`、`POST /api/chat`（JSON：`{"message":"你好"}`）。

运行 `npm run build` 验证前端构建。开发服务页面使用 5174 端口，API 只监听本机并由页面服务代理。
