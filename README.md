# EmotionChat

[中文](#中文) · [日本語](#日本語) · [English](#english)

## 中文

一个基于 Vue 3、Express 和 Ollama 的本地 AI 聊天应用。导入人物设定与回忆，连接自己的模型，即可聊天。使用本机模型时，资料无需发送给云端模型。

### 启动

需要 Node.js 22+ 和可访问的 Ollama 服务。

```sh
npm install
cp local.config.example.json local.config.json
npm run dev
```

在 `ai.config.js` 填写 Ollama 服务根地址，例如 `http://127.0.0.1:11434`，不要加 `/api/chat`。模型在其他电脑运行时填写该电脑的局域网地址；后端必须能够访问它。默认模型为 `qwen3.5:9b`，请在模型电脑执行 `ollama pull qwen3.5:9b`，或通过 `local.config.json` 的 `OLLAMA_MODEL` 指定已安装的模型。修改配置后重启后端。本项目不附带模型，不支持任意聊天网站或 OpenAI 兼容接口。

电脑访问 `http://127.0.0.1:5174/`；手机连接同一可信局域网，访问 `http://电脑局域网IP:5174/`。网页和后端都需保持运行。

### 解锁、回忆与聊天

首次打开网页，用数字键盘设置并确认六位数字总密码，之后解锁再选择聊天。中日英界面均可切换，也支持电脑数字键盘输入。

1. 在 `emotion/` 下为每个回忆模型放一个子文件夹。可以用 [ex-skill](https://github.com/perkfly/ex-skill) 或其他方法整理、蒸馏资料。`emotion/Example/` 是空白公共模板。
2. 点击“新建聊天”，输入聊天名字，再选择一个回忆模型。
3. 点击“开始”才创建 `chats/聊天名字.md`。首句固定为“我在。你说。”，发出第一条消息后才调用 AI。
4. 聊天选择页对应 `chats/` 中的 MD 文件。多个不同名字的聊天可以使用同一回忆模型；重名不会覆盖已有记录。

```text
emotion/
  Example/
    memories.md
    conversations.md
    skill/emotionchat/
      SKILL.md
      persona.md
chats/
  聊天名字.md
runtime/
  chat-index.json
  …各聊天的设置、主动计划和备份
```

也可以把 SKILL.md、persona.md、memories.md 直接放在回忆子目录。可选加载 meta.json、conversations.md 和指定的 knowledge/chats/ig_screenshots_summary.md。原始图片、PDF、聊天导出需要先整理成 Markdown；不会递归解析全部素材。修改已有回忆后重启后端，新增回忆文件夹后重新打开“新建聊天”即可。

**回忆只读**：聊天操作只改变聊天记录与运行数据，不修改 `emotion/` 中的资料。搜索、单条删除、清空与恢复针对当前聊天；删除前有确认并保留备份。设置、回忆绑定和备份位于 `runtime/`，`chats/` 直接存放 MD。

模型上下文包括人物与指定回忆文件，以及最近20条聊天和最多6条关键词匹配的较早消息，每条聊天最多8000字符。根级导入回忆和对话摘要有24000字符上限；这不是完整语义搜索。普通回复和主动消息会检查重复内容，尽量减少固定结尾，但不保证每次都不重复。

### 设置与隐私

- 可调整名字、界面语言、主动聊天间隔和安静时段。界面语言不会强制改变对话语言。
- 主动消息按最短至最长时间随机等待；未回复时，下次范围为“最短×2+2”至最长分钟，上界不足时采用计算后的最短值。安静时段按日本时间，开始结束相同表示关闭。尚未发送第一条消息的聊天不会主动发言。
- 点击“安静”立即关闭主动聊天，重新开启时重新计算等待时间。打开过的聊天可在后台继续按自己的计划运行。
- 每条消息带时间戳，显示格式 `01/Apr/2026,03:24`，使用设备本地时间。支持引用回复、记录查询和手机长按操作。
- 后台收到新消息时标签显示未读数和红点，回到页面清除；交互解锁音频后可播放提示音。浏览器后台节流或手机锁屏可能延迟提示，不提供系统推送。
- 密码仅以带随机盐的 scrypt 哈希保存到与 ai.config.js 同级的 `auth.config.json`。五次失败后等待30秒，会话最长12小时，后端重启后重新解锁。
- 密码保护网页和 API 访问，不加密磁盘文件。当前使用局域网 HTTP，请仅在可信网络使用。不要公开 auth.config.json、local.config.json、私人模型地址、emotion 素材、chats 或 runtime 数据。

可选配置：`OLLAMA_MODEL`（模型名）、`MEMORIES_DIR`（默认 ./emotion）、`CHAT_RECORDS_DIR`（默认 ./chats）、`PORT`（默认3000）；环境变量优先。模型服务地址只读取 ai.config.js。旧版目录不会自动转换，升级前请备份资料。

验证：`npm run build`；后端测试：`node --test server/access.test.js`。

## 日本語

Vue 3、Express、Ollama を使うローカルAIチャットです。人物設定と記憶を読み込み、自分のモデルに接続します。端末内のモデルなら、資料をクラウドAIへ送る必要はありません。

### 起動

Node.js 22+ と Ollama が必要です。

```sh
npm install
cp local.config.example.json local.config.json
npm run dev
```

`ai.config.js` に Ollama のルートURL（例：`http://127.0.0.1:11434`）を設定します。`/api/chat` は付けません。別の端末のモデルなら、そのLANアドレスを指定してください。既定モデルは `qwen3.5:9b`。モデル側で `ollama pull qwen3.5:9b` を実行するか、local.config.json の OLLAMA_MODEL にインストール済みモデル名を設定します。変更後は再起動してください。モデルは同梱しません。任意のチャットサイトや OpenAI 互換APIには対応しません。

パソコンは `http://127.0.0.1:5174/`、同じ信頼できるLANのスマートフォンは `http://パソコンのLAN_IP:5174/` を開きます。

### 記憶とチャット

初回に共通の6桁パスコードを2回入力して設定します。解除後にチャットを選択できます。

- `emotion/` のサブフォルダーごとに記憶モデルを配置します。[ex-skill](https://github.com/perkfly/ex-skill) などで整理した資料を使えます。Example は公開用の空白テンプレートです。
- 「新しいチャット」で名前と記憶モデルを選び、「開始」で `chats/チャット名.md` を作成します。冒頭は「我在。你说。」で、ユーザーの最初の送信後にAIが応答します。
- 同じ記憶モデルで複数のチャットを作れます。同名のファイルは上書きしません。チャット一覧は chats 内のMDに対応します。
- `emotion/` は読み取り専用です。検索・削除・クリア・復元は現在のチャット履歴のみを対象にします。設定、記憶との対応、計画、バックアップは runtime に保存します。

人物設定はサブフォルダー直下、または skill/emotionchat/ の SKILL.md と persona.md に配置できます。memories.md、conversations.md、任意の meta.json と指定IG要約も参照します。全資料の再帰検索や生画像/PDFの自動解析はありません。既存の記憶を編集したら再起動してください。

人物・記憶資料とは別に、直近20件とキーワード一致の過去最大6件（各8000文字まで）を参照します。ルートの記憶と会話要約には24000文字制限があります。意味検索ではありません。応答と自発メッセージの重複を軽減しますが、完全には防げません。

### 設定と保護

表示名、画面言語、自発メッセージ間隔、おやすみ時間を調整できます。最初の送信前は自発メッセージを送りません。返答がない場合は「最短×2+2」分から最長分の範囲で再度待機し、上限が小さければ計算後の下限を使用します。おやすみ時間は日本時間です。開いたチャットはバックエンド稼働中に自発メッセージを続けられます。

日時、引用返信、履歴検索、確認付き削除、モバイル長押しに対応します。バックグラウンドの新着はタブに未読数と赤い印を表示します。音はブラウザ操作後に利用可能で、ロック画面やバックグラウンドでは遅れる場合があります。システムプッシュ通知はありません。

パスコードはソルト付き scrypt ハッシュのみを auth.config.json に保存します。5回失敗で30秒待機、セッションは最大12時間、再起動後は再解除が必要です。ディスクのMDは暗号化しません。信頼できるLANで使用し、パスコード設定、個人設定、記憶、履歴、runtime を公開しないでください。

設定は OLLAMA_MODEL、MEMORIES_DIR（./emotion）、CHAT_RECORDS_DIR（./chats）、PORT（3000）。環境変数が優先され、モデルURLは ai.config.js のみです。旧形式は自動移行しません。更新前にバックアップしてください。

検証：`npm run build`、`node --test server/access.test.js`。

## English

A local AI chat app built with Vue 3, Express and Ollama. Import personas and memories and connect your own model. With an on-device model, private material need not be sent to a cloud AI service.

### Setup

Requires Node.js 22+ and a reachable Ollama service.

```sh
npm install
cp local.config.example.json local.config.json
npm run dev
```

Set the Ollama service root in `ai.config.js`, for example `http://127.0.0.1:11434`, without `/api/chat`. Use the model computer's LAN address for a remote local model. The default model is `qwen3.5:9b`: run `ollama pull qwen3.5:9b` on that computer or set OLLAMA_MODEL in local.config.json to an installed model. Restart after configuration changes. No model is bundled; arbitrary chat websites and OpenAI-compatible APIs are not supported.

Open `http://127.0.0.1:5174/` on your computer, or `http://COMPUTER_LAN_IP:5174/` on a phone on the same trusted LAN. Keep both frontend and backend running.

### Unlock, memories and chats

Set and confirm a shared six-digit passcode on first launch. Unlock to choose a chat. The keypad and interface support Chinese, Japanese and English, plus physical number keys.

1. Put each memory model in a subfolder of `emotion/`. Use [ex-skill](https://github.com/perkfly/ex-skill) or another distillation method. Example is a blank public template.
2. Choose New chat, enter a chat name and select a memory model.
3. Start creates `chats/chat-name.md`, with the initial message “我在。你说。”. AI generation starts after the user's first message.
4. The chat picker corresponds to the MD files in chats. Multiple named chats may share a memory model. Duplicate names never overwrite existing chats.

Persona files may live directly in the memory folder or in skill/emotionchat/. Supported context includes SKILL.md, persona.md, memories.md, conversations.md, optional meta.json and the designated IG summary. Convert raw exports, images or PDFs into Markdown first; the app does not recursively process all files. Restart after editing loaded memories.

Memory files are read-only. Search, delete, clear and restore affect the current chat history. Settings, memory bindings, proactive schedules and backups live in runtime; chats contains the MD files directly.

Alongside persona and memory files, context includes the latest 20 chat messages and up to 6 older keyword matches, capped at 8000 characters per message. Root-level imported memory and conversation excerpts have 24000-character limits. This is not semantic search. Duplicate detection reduces repetitive replies and endings but cannot eliminate them completely.

### Settings and privacy

Adjust display name, interface language, proactive timing and quiet hours. Proactive messages start only after the first user message. Unanswered follow-ups wait between minimum×2+2 minutes and the maximum, raising the upper bound if necessary. Quiet hours use Japan time. Opened chats may continue proactive messages while the backend runs.

Supports timestamps, quoted replies, history search, confirmed deletion and mobile long-press actions. Background arrivals update the tab's unread count and dot; audio needs a browser interaction to unlock. Background throttling or phone lock screens can delay alerts; system push is not provided.

Only a salted scrypt hash is stored in auth.config.json, beside ai.config.js. Five failed attempts trigger a 30-second cooldown; sessions last up to 12 hours and end on backend restart. The passcode protects app/API access, not files on disk. Use HTTP access only on a trusted LAN. Never publish passcode configuration, private endpoints, memory files, chats or runtime data.

Optional settings: OLLAMA_MODEL, MEMORIES_DIR (./emotion), CHAT_RECORDS_DIR (./chats), PORT (3000). Environment variables take precedence. The model URL comes only from ai.config.js. Legacy layouts are not migrated automatically; back up before upgrading.

Validation: `npm run build`; backend tests: `node --test server/access.test.js`.
