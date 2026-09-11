# EmotionChat

[中文](#chinese) · [日本語](#japanese) · [English](#english)

<a id="chinese"></a>

## 中文

本地 Ollama + Express + Vue 3 聊天应用。支持人物资料、Markdown 历史、相关回忆检索、主动聊天，以及中文、日文、英文界面。

### AI 模型来自哪里？地址在哪里填写？

EmotionChat 不附带 AI 模型，也不使用本项目提供的云端账号。回复由你自己运行或可访问的 **Ollama 服务**生成。当前接口支持 Ollama，不是任意聊天网站或 OpenAI 兼容接口。

打开根目录的 **`ai.config.js`**，只修改其中这一行地址：

```js
export default 'http://127.0.0.1:11434';
```

模型在当前电脑运行时使用上面的地址；在另一台电脑上运行时，填 `http://模型电脑的局域网IP:11434` 或可解析的主机名。填写服务根地址，不要加 `/api/chat`。手机仍然访问 EmotionChat 页面，模型地址应当能从后端所在电脑访问。修改后重启 `npm run dev`。

默认请求模型 `qwen3.5:9b`。请在模型电脑上安装 Ollama 并运行 `ollama pull qwen3.5:9b`。如果使用其他已安装模型，在可选的 `local.config.json` 中修改 `OLLAMA_MODEL`。地址和模型名称不同：`ai.config.js` 只设置地址，不能自动安装模型。

地址以 `ai.config.js` 为唯一来源。旧的 `OLLAMA_URL` 环境变量和 local.config.json 字段不再生效。公开提交前将私人地址恢复为示例地址。


### 两步开始：导入回忆主题，连接模型

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


### 启动

需要 Node.js 22 或更高版本，以及可访问的 Ollama 服务。先在模型所在电脑安装所需模型，例如 `ollama pull qwen3.5:9b`。

```sh
npm install
cp local.config.example.json local.config.json
npm run dev
```
编辑 `local.config.json`，填写可选模型名称及本地人物目录。环境变量优先于本地配置。

电脑打开 http://127.0.0.1:5174/ 。手机连接同一局域网，打开 `http://电脑局域网IP:5174/`。后台需保持运行；仅在可信局域网使用，当前没有登录验证。

### 配置

| 项目 | 默认值 / 用途 |
| --- | --- |
| `PORT` | `3000`，后端端口；修改时同步调整 Vite 代理 |
| `OLLAMA_MODEL` | `qwen3.5:9b` |
| `EXSKILL_DIR` | `Emotion/skill/emotionchat/`，本地人物资料目录 |
| `CHAT_ARCHIVE_PATH` | `archive/chat.md` |

人物目录可提供 `meta.json`、`SKILL.md`、`persona.md`、`memories.md` 和可选的 `knowledge/chats/ig_screenshots_summary.md`。人物资料在后端启动时读取，修改后需重启。

### 使用

- 设置中修改显示名字、界面语言、主动聊天等待范围和安静时段。界面语言不会修改对话语言。
- 设置标题右侧显示当前配置模型的可用、未安装或离线状态；可用表示服务可达且模型已安装，不代表正在生成。
- 每条消息保存时间戳，网页恢复 Markdown 历史。日期显示为 `01/Apr/2026,03:24`，按设备本地时间。
- 回忆参考最近 20 条和关键词匹配的最多 6 条较早记录，每条上下文（含引用）最多 8000 字符；不是完整语义搜索。
- 默认随机等待 10–30 分钟主动找话题，日本时间 23:00–09:00 安静。没有合适话题会跳过，未回应时，后续按“最短 × 2 + 2”到最长分钟随机等待再发，下限超过上限时按下限等待。时间相同表示关闭安静时段。
- 网页每 5 秒获取历史；手机锁屏不提供系统通知。

### 数据与开源

`archive/`、`Emotion/skill/emotionchat/`、`local.config.json` 均被 Git 忽略。设置和主动聊天计时状态保存在存档旁的 JSON 文件中。不要提交真实对话、人物资料或私有配置。忽略规则不会清除已有 Git 历史；发布前还应检查历史提交。

### 接口与构建

`GET /api/history`、`GET /api/health`、`GET /api/settings`、`PUT /api/settings`、`POST /api/chat`（JSON：`{"message":"你好"}`）。

运行 `npm run build` 验证前端构建。开发服务页面使用 5174 端口，API 只监听本机并由页面服务代理。

---

<a id="japanese"></a>

## 日本語

Ollama・Express・Vue 3 を使ったローカルチャットアプリです。人物設定、Markdown の履歴、キーワードによる記憶の検索、自発的なメッセージ、中国語・日本語・英語の画面表示に対応します。

### AI モデルはどこから来ますか？

EmotionChat 自体にはモデルやクラウドアカウントは含まれません。返信は、自分で起動した、または接続可能な **Ollama サービス**が生成します。Ollama API 専用で、一般のチャットサイトや OpenAI 互換 API には対応していません。

ルートの **`ai.config.js`** のアドレスだけを変更します。

```js
export default 'http://127.0.0.1:11434';
```

バックエンドと同じパソコンならこのまま使えます。別の端末なら `http://モデル端末のLAN_IP:11434` または解決可能なホスト名を指定してください。`/api/chat` を付けず、サービスのルートを入力します。バックエンドから接続できる必要があります。スマートフォンでは従来どおり EmotionChat の画面を開きます。変更後は `npm run dev` を再起動してください。

既定モデルは `qwen3.5:9b` です。モデル端末に Ollama をインストールして `ollama pull qwen3.5:9b` を実行してください。別のインストール済みモデルを使う場合は、任意の `local.config.json` の `OLLAMA_MODEL` を変更します。アドレスファイルだけではモデルはインストールされません。

接続先は `ai.config.js` のみから読み込みます。以前の `OLLAMA_URL` 環境変数と local.config.json の項目は使用しません。公開前に個人用アドレスをサンプルに戻してください。


### 2ステップ：記憶テーマを取り込み、モデルに接続

1. 1つの記憶テーマを `Emotion/` に配置します。exskill、別のツール、または手作業で整理した Markdown を使えます。
2. `local.config.example.json` を `local.config.json` にコピーし、`ai.config.js` の接続先と必要に応じて `OLLAMA_MODEL` を設定して、以下の起動コマンドを実行します。

```text
Emotion/
  skill/emotionchat/
    SKILL.md             役割の動作ルール
    persona.md           人物像・口調・関係
  memories.md            整理済みの共有記憶
  conversations.md       任意の過去の会話抜粋
  imports/               元資料の一時置き場（自動では読み込まない）
archive/                 新しい会話は chat.md に自動保存
```

テンプレートを自分の資料に置き換えるだけで、コード変更は不要です。既存 exskill の memories.md は Emotion/ に、SKILL.md と persona.md は skill フォルダーに配置してください。チャットの生データ、画像、PDF は別のツールで Markdown に整理する必要があります。資料を変更したら再起動してください。

取り込んだ会話はモデルの参考資料であり、画面の吹き出しにはなりません。画面には archive/chat.md の履歴が表示されます。取り込む memories と conversations は各先頭24000文字までなので、長い資料は先に要約してください。

公開するのは空のテンプレートだけにしてください。個人資料を入力した後はコミットしないでください。この公開用フォルダーには個人設定・実際の会話・過去の Git 履歴を含めていません。


### 起動

Node.js 22 以降と、接続可能な Ollama が必要です。モデル側の端末で、例えば `ollama pull qwen3.5:9b` を実行してモデルを準備してください。

```sh
npm install
cp local.config.example.json local.config.json
npm run dev
```
`local.config.json` に任意のモデル名と非公開の人物資料フォルダーを設定します。環境変数はこのファイルより優先されます。

パソコンでは http://127.0.0.1:5174/ 、同じ LAN のスマートフォンでは `http://パソコンのLAN_IP:5174/` を開きます。バックエンドを起動したままにしてください。認証機能はないため、信頼できる LAN で使用してください。

### 設定

| 項目 | 既定値・用途 |
| --- | --- |
| `PORT` | `3000`。変更時は Vite のプロキシも変更 |
| `OLLAMA_MODEL` | `qwen3.5:9b` |
| `EXSKILL_DIR` | `Emotion/skill/emotionchat/` |
| `CHAT_ARCHIVE_PATH` | `archive/chat.md` |

人物フォルダーには `meta.json`、`SKILL.md`、`persona.md`、`memories.md`、任意で `knowledge/chats/ig_screenshots_summary.md` を配置できます。資料を変更した後はバックエンドを再起動してください。

### 機能

- 設定で相手の名前、表示言語、自発的な会話までの待ち時間、おやすみ時間を変更できます。表示言語は会話の言語に影響しません。
- 設定タイトルの右側に、モデルの利用可能・未インストール・オフライン状態を表示します。利用可能は接続とインストールを確認した状態で、生成中という意味ではありません。
- 日時付きメッセージを Markdown から復元します。日時は端末の現地時間で `01/Apr/2026,03:24` の形式です。
- 直近20件とキーワードが一致する過去の最大6件を参照します。引用を含めて1件につき最大8000文字で、意味検索ではありません。
- 既定の待ち時間は10〜30分、日本時間23:00〜09:00はおやすみ時間です。話題がなければ送信せず、返事がなければ「最短×2＋2」〜最長分待って再度送信します（下限が上限を超える場合は下限を使用）。開始・終了が同じならおやすみ時間は無効です。
- 画面は5秒ごとに履歴を取得します。スマートフォンのロック画面通知には対応していません。

### 非公開データ

`archive/`、`Emotion/skill/emotionchat/`、`local.config.json` は Git の対象外です。設定と自発的会話のタイマーは履歴の隣に JSON で保存します。実際の会話、人物資料、個人設定をコミットしないでください。除外設定では過去の Git 履歴は消えないため、公開前に過去のコミットも確認してください。

### API とビルド

`GET /api/history`、`GET /api/health`、`GET /api/settings`、`PUT /api/settings`、`POST /api/chat`（JSON：`{"message":"こんにちは"}`）。

`npm run build` でフロントエンドをビルドします。開発画面は5174番ポートを使用し、ローカルのみで待ち受ける API にリクエストを転送します。

---

<a id="english"></a>

## English

A local chat application built with Ollama, Express and Vue 3. Includes persona context, Markdown history, keyword memory recall, proactive messages, and Chinese, Japanese and English interfaces.

### Where does the AI model come from?

EmotionChat does not include model weights or a hosted AI account. Replies come from an **Ollama service you run or can access**. This integration supports the Ollama API, not arbitrary chat websites or OpenAI-compatible endpoints.

Edit only the address in the root **`ai.config.js`** file:

```js
export default 'http://127.0.0.1:11434';
```

Use this address for Ollama on the backend computer. For another computer, use `http://MODEL_COMPUTER_LAN_IP:11434` or its resolvable hostname. Enter the service root without `/api/chat`. The backend must be able to reach it; phones still open the EmotionChat page. Restart `npm run dev` after editing.

The default model is `qwen3.5:9b`. Install Ollama on the model computer and run `ollama pull qwen3.5:9b`. To use another installed model, set `OLLAMA_MODEL` in optional `local.config.json`. The address file does not install model weights.

`ai.config.js` is the sole endpoint source. Legacy `OLLAMA_URL` environment variables and local.config.json fields are no longer used. Restore the example address before publishing private changes.


### Two steps: import a memory theme, connect a model

1. Put one memory theme in `Emotion/`. Distill it with exskill, another tool, or by hand, and place the Markdown text in the structure below.
2. Copy `local.config.example.json` to `local.config.json`, set the address in `ai.config.js` and optionally `OLLAMA_MODEL`, and run the setup commands below.

```text
Emotion/
  skill/emotionchat/
    SKILL.md             Persona behavior rules
    persona.md           Voice, character and relationship
  memories.md            Distilled shared memories
  conversations.md       Optional conversation excerpts
  imports/               Raw source staging (not read automatically)
archive/                 New chats saved automatically to chat.md
```

Replace the templates; no code changes are needed. From an existing exskill, put memories.md in Emotion/ and SKILL.md and persona.md in the skill folder. Raw chat exports, images and PDFs must first be converted into distilled Markdown with another tool. Restart after changing the theme.

Imported conversations are model context, not chat bubbles. The page displays live history from archive/chat.md. Imported memories and conversation excerpts are each limited to the first 24000 characters; summarize longer material first.

Publish only blank templates. Do not commit these files after filling them with private material. This release folder contains no private configuration, conversations or old Git history.


### Setup

Use Node.js 22+ and a reachable Ollama service. Install the configured model on the model host, for example `ollama pull qwen3.5:9b`.

```sh
npm install
cp local.config.example.json local.config.json
npm run dev
```
Edit `local.config.json` with your optional model name and private persona directory. Environment variables override this file.

Open http://127.0.0.1:5174/ on the computer, or `http://COMPUTER_LAN_IP:5174/` on a phone on the same network. Keep the backend running. Use a trusted LAN; authentication is not included.

### Configuration

| Key | Default / purpose |
| --- | --- |
| `PORT` | `3000`; update the Vite proxy if changed |
| `OLLAMA_MODEL` | `qwen3.5:9b` |
| `EXSKILL_DIR` | `Emotion/skill/emotionchat/` |
| `CHAT_ARCHIVE_PATH` | `archive/chat.md` |

The persona directory can contain `meta.json`, `SKILL.md`, `persona.md`, `memories.md`, and optional `knowledge/chats/ig_screenshots_summary.md`. Restart the backend after editing persona files.

### Features

- Settings control the display name, interface language, random proactive delay and quiet hours. Interface language does not change conversation language.
- Model status beside the settings title reports available, not installed or offline. Available means the service is reachable and the configured model is installed, not necessarily generating.
- Timestamped messages are restored from Markdown. Dates use device local time in `01/Apr/2026,03:24` format.
- Recall includes the latest 20 messages and up to 6 older keyword matches, capped at 8000 characters per message including quoted context. This is not semantic search.
- Default proactive delay is 10–30 minutes, with quiet hours from 23:00 to 09:00 Japan time. A topic may be skipped; unanswered proactive messages repeat after a random delay from minimum × 2 + 2 to maximum minutes (clamped to the lower bound if inverted). Equal quiet-hour times disable quiet hours.
- The page polls history every 5 seconds. Phone lock-screen notifications are not supported.

### Private data

Git ignores `archive/`, `Emotion/skill/emotionchat/` and `local.config.json`. Settings and proactive timing are stored as JSON beside the archive. Never commit real conversations, persona material or private configuration. Ignore rules do not remove existing Git history; inspect previous commits before publishing.

### API and build

`GET /api/history`, `GET /api/health`, `GET /api/settings`, `PUT /api/settings`, and `POST /api/chat` with JSON `{"message":"Hello"}`.

Run `npm run build` to build the frontend. The development page uses port 5174 and proxies API requests to the loopback-only backend.


## 最新交互 / Interaction updates / 操作の更新

- 中文：支持引用回复及可恢复删除；手机长按消息显示操作，删除需确认。手机版适配安全区和紧凑输入栏。关闭“安静中”会从切换时刻按最短到最长重新计时，后续未回复使用上述延长区间。后台收到 AI 新消息时播放提示音，前台及旧记录不响；需先与页面交互解锁音频，手机后台或锁屏可能限制播放。
- English: Quoted replies and recoverable deletion are supported. Long-press messages on mobile; deletion requires confirmation. Mobile layout uses safe areas and a compact composer. Leaving Quiet mode restarts the initial random timer from the switch time; unanswered follow-ups use the longer range above. New AI messages sound only in the background after audio is unlocked by interaction. Mobile background or lock-screen restrictions may prevent playback.
- 日本語：引用返信と復元可能な削除に対応。スマートフォンでは長押しで操作を表示し、削除前に確認します。セーフエリアとコンパクトな入力欄に対応。「おやすみ中」を解除すると、その時点から通常の待ち時間を再計算します。未返信時は上記の延長時間で再送します。背景で新しいAIメッセージを受信すると通知音が鳴ります。事前の画面操作が必要で、端末のバックグラウンド・ロック制限により再生されない場合があります。
