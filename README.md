# EmotionChat

[中文](#中文) · [日本語](#日本語) · [English](#english)

## 中文

一个基于 Vue 3、Express 和 Ollama 的本地 AI 聊天应用。导入人物设定与回忆，连接自己的模型，即可聊天。角色不仅回应消息，也会结合共同回忆、最近的对话和自身性格，主动发起新的话题。使用本机模型时，资料无需发送给云端模型。

### 核心体验：角色会主动找你

EmotionChat 会在你停止发消息后，从设定的时间范围内随机选择一个时刻，让角色主动开启对话。内容由 AI 当时生成，可以延续尚未结束的话题、联想共同回忆，也可以按照人物性格轻松问候或换一个切入点。

如果你没有回应，角色会等待更长时间后再次尝试，并避免重复上一条主动消息。每个聊天都有独立的等待范围和安静时段；“安静”可以立即停止主动消息，重新开启后会重新计算时间。新聊天只有在你先发送过一条消息后，才会激活主动对话。

### 可选体验：把现实动态带进聊天

在设置中开启 **“关注现实动态”**（默认关闭），角色可以从人物与回忆资料中匹配兴趣，获取近期资讯并在合适时带入对话。当前支持咖啡、摄影、艺术、音乐、读书、美食甜品、电影、户外和游戏；这是预设关键词匹配，不是任意主题的通用搜索。你明确询问的类别可以超出人物原有兴趣，“新品呢”等追问也会尝试接续前文话题。

- **探索强度 0–8**：0 只按需查询，1–8 逐步增加后台更新频率和每次搜索的类别、素材数量，不改变主动发消息的间隔。开关即时保存，滑块松手后自动保存。
- **自然表达与来源**：明确查询近期资讯时，默认选一条用人物语气回应，来源折叠在消息下方的“查看来源”。生成后由本地模型核对事实，失败会重试，再失败则回退到简短原文。详细查询可提供多条。当前只获取新闻标题、来源和报道日期，不读取全文；报道日期不等于上市日期，模型核对也不保证完全准确。
- **自动时间与天气**：每次生成可参考系统当前时间和设备时区。天气随此开关启用，不受探索强度影响：优先浏览器定位，失败后用公网 IP 估算位置；都失败就不提供天气，不需要填写地址，也不使用人物地址兜底。首次可能出现定位授权弹窗；局域网 HTTP 可能无法使用浏览器定位，IP 估算也可能受 VPN 影响。天气最多缓存 30 分钟，位置会过期，只有话题合适时才带入。

**联网范围**：Google News 接收通用兴趣词与匹配城市；IP 定位由用户浏览器访问 ipapi.co，天气由后端用保留两位小数的近似坐标请求 Open-Meteo。这些服务不接收人物原文或聊天全文。开启后会访问外部服务，不能视为完全离线；关闭后仍可正常本地聊天。

资讯单独保存在 `runtime/聊天ID/reality.md`，带获取时间、来源和使用标记，不改写 `emotion/`。位置与天气只暂存在内存，不作为定位记录写入文件；角色实际说出的天气内容会随聊天保存。普通查询的来源元数据保存在聊天 MD 中，重新打开后仍能查看。搜索失败或缺少相关资料时，不保证能回答新品细节。

### 连接 AI 模型

准备 Node.js 22+ 和一个已启动、已安装模型的 Ollama 服务。

1. 在 `ai.config.js` 中填写 **Ollama 服务地址**，例如：

   ```js
   export default 'http://127.0.0.1:11434';
   ```

   模型与后端在同一台电脑时使用这个地址；在另一台电脑时，换成那台电脑的局域网 IP。不要加 `/api/chat`。

2. 确认 **模型名称**。默认使用 `qwen3.5:9b`；如果你安装的是其他模型，在 `local.config.json` 中设置：

   ```json
   { "OLLAMA_MODEL": "你的已安装模型名称" }
   ```

   文件不存在时可先创建它；首次启动也会自动生成默认配置。已有文件只修改对应字段，保留其他设置。地址和模型名称必须与你的 Ollama 服务一致，修改后重启后端。

### 启动

在项目目录执行：

```sh
npm install
npm run dev
```

打开 `http://127.0.0.1:5174/`，设置六位密码，再选择回忆并新建聊天。

### 解锁、回忆与聊天

首次打开网页，用数字键盘设置并确认六位数字总密码，之后解锁再选择聊天。中日英界面均可切换，也支持电脑数字键盘输入。

1. 在 `emotion/` 下为每个回忆模型放一个子文件夹。可以用 [ex-skill](https://github.com/perkfly/ex-skill) 或其他方法整理、蒸馏资料。示例提供 [Mika 完整案例](emotion/Mika_Demo/) 和 [Minimal 最小案例](emotion/Minimal/)。

   ⭐ **不需要 ex-skill，也不需要微信聊天记录。** 可以自己写，或让 AI 根据口述、笔记整理 `persona.md`（性格、说话习惯和关系）与 `memories.md`（希望记住的事情）。将两个文件放进 `emotion/对象名字/` 就能开始，其他文件可选，之后再逐步补充。
2. 点击“新建聊天”，输入聊天名字，再选择一个回忆模型。
3. 点击“开始”才创建 `chats/聊天名字.md`。首句固定为“我在。你说。”，发出第一条消息后才调用 AI。
4. 聊天选择页对应 `chats/` 中的 MD 文件。多个不同名字的聊天可以使用同一回忆模型；重名不会覆盖已有记录。

```text
emotion/
  Minimal/
    persona.md
    memories.md
  Mika_Demo/
    SKILL.md
    persona.md
    memories.md
    conversations.md
    meta.json
chats/
  聊天名字.md
runtime/
  chat-index.json
  …各聊天的设置、主动计划、资讯 reality.md 和备份
```

也可以把 SKILL.md、persona.md、memories.md 直接放在回忆子目录。可选加载 meta.json、conversations.md 和指定的 knowledge/chats/ig_screenshots_summary.md。原始图片、PDF、聊天导出需要先整理成 Markdown；不会递归解析全部素材。修改已有回忆后重启后端，新增回忆文件夹后重新打开“新建聊天”即可。

**回忆只读**：聊天操作只改变聊天记录与运行数据，不修改 `emotion/` 中的资料。搜索、单条删除、清空与恢复针对当前聊天；删除前有确认并保留备份。设置、回忆绑定和备份位于 `runtime/`，`chats/` 直接存放 MD。

模型上下文包括人物与指定回忆文件，以及最近20条聊天和最多6条关键词匹配的较早消息，每条聊天最多8000字符。根级导入回忆和对话摘要有24000字符上限；这不是完整语义搜索。普通回复和主动消息会检查重复内容，尽量减少固定结尾，但不保证每次都不重复。

### 可选配置与常见问题

<details>
<summary>换模型、连接另一台电脑、手机访问或连接失败</summary>

- **换模型**：在自动生成的 `local.config.json` 中，将 `OLLAMA_MODEL` 改为已安装的模型名。
- **模型在另一台电脑**：将 `ai.config.js` 改为 `export default 'http://模型电脑局域网IP:11434';`，并确保 Ollama 允许局域网连接。填写服务根地址，不加 `/api/chat`；修改后重启后端。
- **手机访问**：连接同一可信局域网，打开 `http://电脑局域网IP:5174/`。手机不用安装模型；网页和后端需保持运行。
- **模型未安装**：检查 `OLLAMA_MODEL` 是否与已下载的模型名一致。
- **模型离线**：确认 Ollama 已启动、地址可达。`127.0.0.1` 指运行后端的电脑，不是另一台模型电脑。

本项目不附带模型，目前使用 Ollama API，不支持任意聊天网站或 OpenAI 兼容接口。

</details>

### 设置与隐私

- 在聊天选择页切换界面语言；设置中可调整名字、现实动态、主动聊天间隔和安静时段。界面语言不会强制改变对话语言。
- 主动消息按最短至最长时间随机等待；未回复时，下次范围为“最短×2+2”至最长分钟，上界不足时采用计算后的最短值。安静时段按日本时间，开始结束相同表示关闭。尚未发送第一条消息的聊天不会主动发言。
- 点击“安静”立即关闭主动聊天，重新开启时重新计算等待时间。打开过的聊天可在后台继续按自己的计划运行。
- 每条消息带时间戳，显示格式 `01/Apr/2026,03:24`，使用设备本地时间。支持引用回复、记录查询和手机长按操作。
- 后台收到新消息时标签显示未读数和红点，回到页面清除；交互解锁音频后可播放提示音。浏览器后台节流或手机锁屏可能延迟提示，不提供系统推送。
- 设置标题下显示当前回忆文件夹名。“删除对话”只把聊天 MD 顶部标记设为 `deleted:true`，不删除正文或回忆。聊天列表旁的“恢复对话”使用数字键盘重新验证原密码，恢复为 `deleted:false`。
- 密码仅以带随机盐的 scrypt 哈希保存到与 ai.config.js 同级的 `auth.config.json`。五次失败后等待30秒，会话最长12小时，后端重启后重新解锁。
- 密码保护网页和 API 访问，不加密磁盘文件。当前使用局域网 HTTP，请仅在可信网络使用。不要公开 auth.config.json、local.config.json、私人模型地址、emotion 素材、chats 或 runtime 数据。

可选配置：`OLLAMA_MODEL`（模型名）、`MEMORIES_DIR`（默认 ./emotion）、`CHAT_RECORDS_DIR`（默认 ./chats）、`PORT`（默认3000）；环境变量优先。模型服务地址只读取 ai.config.js。旧版目录不会自动转换，升级前请备份资料。

验证：`npm run build`；后端测试：`node --test server/*.test.js`。

## 日本語

Vue 3、Express、Ollama を使うローカルAIチャットです。人物設定と記憶を読み込み、自分のモデルに接続します。キャラクターは返信するだけでなく、共有した記憶、最近の会話、人物らしい性格をもとに、自分から新しい話題を始めます。端末内のモデルなら、資料をクラウドAIへ送る必要はありません。

### 中心となる体験：キャラクターから話しかける

メッセージを送らなくなったあと、設定した範囲からランダムな時刻を選び、AIがその場で会話を始めます。終わっていない話題を続けたり、共有した記憶を思い出したり、人物らしい軽い挨拶や別の話題を送ったりできます。

返事がない場合は、前回より長く待ってから別のメッセージを試し、直前の内容を繰り返さないようにします。待ち時間とおやすみ時間はチャットごとに独立しています。「おやすみ」で自発メッセージを止め、再開すると待ち時間を計算し直します。新しいチャットは、ユーザーが最初のメッセージを送ったあとに自発会話が有効になります。

### 任意機能：最近の話題を会話に取り入れる

設定の **「最近の話題を探す」** は既定でオフです。有効にすると人物・記憶資料のキーワードから興味を拾い、最近の記事を会話の材料にします。対応分野はコーヒー、写真、アート、音楽、読書、グルメ・スイーツ、映画、アウトドア、ゲームです。任意のテーマを検索する汎用検索ではありません。ユーザーが尋ねた分野も検索でき、「新作は？」などは直前の話題を引き継ぐようにします。

- **探索レベル 0–8**：0 は必要なときだけ検索し、1–8 はバックグラウンド更新の頻度と分野・記事数を増やします。自発メッセージの間隔とは別です。スイッチは即時、スライダーは操作終了時に自動保存します。
- **話し方と出典**：最近の情報を明示的に尋ねた場合、通常は1件をキャラクターの口調で伝え、出典は「出典を見る」に折りたたみます。ローカルモデルで事実確認し、不合格なら再生成、それでも失敗したら短い原文に戻します。詳細な質問では複数件を扱えます。取得するのは見出し・出典・記事公開日だけで、全文は読みません。公開日と商品発売日は異なり、モデルによる確認も完全ではありません。
- **時刻と天気**：生成時にはシステム時刻と端末のタイムゾーンを参照できます。天気はこのスイッチに連動し、探索レベルには依存しません。ブラウザの位置情報を優先し、取得できなければ公開 IP から推定します。両方失敗したら天気は使わず、住所入力も人物の住所への切り替えも行いません。初回は位置情報の許可が出る場合があります。LAN の HTTP では位置情報が使えないことがあり、IP 推定は VPN の影響を受けます。天気は最大30分キャッシュし、位置情報も期限切れになります。

**外部通信**：Google News には一般的な興味の検索語と都市名を送ります。ユーザーのブラウザが ipapi.co にアクセスし、バックエンドが小数点以下2桁の概略座標で Open-Meteo を利用します。人物資料や会話全文は送りません。有効時は完全オフラインではなく、無効でもローカルチャットは利用できます。

記事は `runtime/チャットID/reality.md` に取得時刻・出典・利用マーク付きで保存し、`emotion/` は変更しません。位置と天気はメモリ内のみで保持しますが、返信として話した天気はチャット履歴に残ります。通常の検索返信の出典はチャット MD に保存され、再表示できます。検索失敗や資料不足の場合、新商品の詳細を確認できないことがあります。

### AI モデルに接続

Node.js 22+ と、モデルをインストールして起動済みの Ollama を用意します。

1. `ai.config.js` に **Ollama の接続先**を設定します。

   ```js
   export default 'http://127.0.0.1:11434';
   ```

   バックエンドと同じパソコンならこのアドレスを使い、別のパソコンならそのLAN IPに変更します。`/api/chat` は付けません。

2. **モデル名**を確認します。既定は `qwen3.5:9b` です。別のモデルを使う場合、`local.config.json` に設定します。

   ```json
   { "OLLAMA_MODEL": "インストール済みのモデル名" }
   ```

   ファイルは手動作成でき、初回起動でも既定設定が自動生成されます。既存ファイルは該当項目だけ変更してください。接続先とモデル名を実際の Ollama に合わせ、変更後は再起動します。

### 起動

プロジェクトのフォルダーで実行します。

```sh
npm install
npm run dev
```

`http://127.0.0.1:5174/` を開き、6桁のパスコードを設定して、記憶を選び新しいチャットを作成します。

### 記憶とチャット

初回に共通の6桁パスコードを2回入力して設定します。解除後にチャットを選択できます。

- `emotion/` のサブフォルダーごとに記憶モデルを配置します。[ex-skill](https://github.com/perkfly/ex-skill) などで整理した資料を使えます。[Mika の詳細例](emotion/Mika_Demo/) と [Minimal の最小例](emotion/Minimal/) を用意しています。

  ⭐ **ex-skill や WeChat の履歴は必須ではありません。** 自分で書くか、メモや口述を AI で整理し、`persona.md`（性格・話し方・関係）と `memories.md`（覚えてほしいこと）を `emotion/相手の名前/` に置くだけで始められます。他のファイルは任意で、後から追加できます。

- 「新しいチャット」で名前と記憶モデルを選び、「開始」で `chats/チャット名.md` を作成します。冒頭は「我在。你说。」で、ユーザーの最初の送信後にAIが応答します。
- 同じ記憶モデルで複数のチャットを作れます。同名のファイルは上書きしません。チャット一覧は chats 内のMDに対応します。
- `emotion/` は読み取り専用です。検索・削除・クリア・復元は現在のチャット履歴のみを対象にします。設定、記憶との対応、計画、バックアップは runtime に保存します。

人物設定はサブフォルダー直下、または skill/emotionchat/ の SKILL.md と persona.md に配置できます。memories.md、conversations.md、任意の meta.json と指定IG要約も参照します。全資料の再帰検索や生画像/PDFの自動解析はありません。既存の記憶を編集したら再起動してください。

人物・記憶資料とは別に、直近20件とキーワード一致の過去最大6件（各8000文字まで）を参照します。ルートの記憶と会話要約には24000文字制限があります。意味検索ではありません。応答と自発メッセージの重複を軽減しますが、完全には防げません。

### 任意設定とよくある質問

<details>
<summary>モデル変更・別端末への接続・スマートフォン・接続エラー</summary>

- **モデル変更**：自動生成される `local.config.json` の `OLLAMA_MODEL` にインストール済みのモデル名を設定します。
- **別端末のモデル**：`ai.config.js` を `export default 'http://モデル端末のLAN_IP:11434';` に変更し、Ollama 側でLAN接続を許可します。`/api/chat` は付けず、変更後はバックエンドを再起動します。
- **スマートフォン**：同じ信頼できるLANで `http://パソコンのLAN_IP:5174/` を開きます。モデルのインストールは不要です。アプリとバックエンドは起動したままにします。
- **未インストール**：`OLLAMA_MODEL` とダウンロード済みのモデル名を確認します。
- **オフライン**：Ollama の起動と接続先を確認します。`127.0.0.1` はバックエンドのパソコンを指します。

モデルは同梱されません。Ollama API を使用し、任意のチャットサイトや OpenAI 互換APIには対応していません。

</details>

### 設定と保護

画面言語はチャット選択画面で切り替えます。設定では表示名、最近の話題、自発メッセージ間隔、おやすみ時間を調整できます。最初の送信前は自発メッセージを送りません。返答がない場合は「最短×2+2」分から最長分の範囲で再度待機し、上限が小さければ計算後の下限を使用します。おやすみ時間は日本時間です。開いたチャットはバックエンド稼働中に自発メッセージを続けられます。

日時、引用返信、履歴検索、確認付き削除、モバイル長押しに対応します。バックグラウンドの新着はタブに未読数と赤い印を表示します。音はブラウザ操作後に利用可能で、ロック画面やバックグラウンドでは遅れる場合があります。システムプッシュ通知はありません。

設定には記憶フォルダー名も表示します。会話の削除は MD の deleted フラグだけを変更し、内容を残します。「会話を復元」で同じパスコードを再入力すると復元できます。

パスコードはソルト付き scrypt ハッシュのみを auth.config.json に保存します。5回失敗で30秒待機、セッションは最大12時間、再起動後は再解除が必要です。ディスクのMDは暗号化しません。信頼できるLANで使用し、パスコード設定、個人設定、記憶、履歴、runtime を公開しないでください。

設定は OLLAMA_MODEL、MEMORIES_DIR（./emotion）、CHAT_RECORDS_DIR（./chats）、PORT（3000）。環境変数が優先され、モデルURLは ai.config.js のみです。旧形式は自動移行しません。更新前にバックアップしてください。

検証：`npm run build`、`node --test server/*.test.js`。

## English

A local AI chat app built with Vue 3, Express and Ollama. Import personas and memories and connect your own model. Characters do more than reply: they use shared memories, recent conversation and their own personality to start new topics on their own. With an on-device model, private material need not be sent to a cloud AI service.

### Core experience: characters start conversations

After you stop sending messages, EmotionChat chooses a random time within your configured range and asks the AI to begin a conversation. It may continue an unfinished topic, recall a related shared memory, offer a light greeting in character, or approach you from a different angle.

If you do not respond, the character waits longer before trying again and avoids repeating the previous proactive message. Each chat has its own timing and quiet hours. Quiet mode stops proactive messages immediately; turning it off calculates a new wait. A new chat activates proactive conversation only after you send its first message.

### Optional: bring real-world updates into the conversation

Enable **Follow real-world updates** in settings (off by default). The app matches interests in persona and memory files to recent news. Supported categories are coffee, photography, art, music, books, food and desserts, film, outdoors and games. This uses predefined keywords, not unrestricted general search. Direct questions may introduce other supported interests, and short follow-ups such as “any new releases?” try to inherit the recent topic.

- **Exploration level 0–8**: 0 searches only on demand; 1–8 increase background refresh frequency and the number of categories and articles fetched. This does not change proactive message timing. The switch saves immediately; the slider saves when released.
- **In-character replies and sources**: explicit news requests normally use one article and show a collapsed “View sources” section. A local-model fact check retries unsupported drafts, then falls back to a short original excerpt if needed. Detailed requests may use several articles. Only headlines, sources and publication dates are retrieved, not full articles. Publication dates are not product release dates, and model-based checks are not infallible.
- **Automatic time and weather**: generation can use the system clock and device timezone. Weather follows this switch, independently of exploration level. Browser geolocation is tried first, then public-IP estimation. If both fail, weather is omitted; no address entry or persona-location fallback is used. A location permission prompt may appear. LAN HTTP can prevent browser geolocation, and VPNs can affect IP estimates. Weather is cached for up to 30 minutes; location also expires. It is used only when relevant to the conversation.

**External services**: Google News receives general interest keywords and a matched city. The user's browser contacts ipapi.co; the backend queries Open-Meteo with approximate coordinates rounded to two decimal places. Persona files and full conversations are not sent to these services. Enabling this feature means the app is no longer entirely offline; local chat still works with it disabled.

Articles, fetch times, sources and usage markers live separately in `runtime/chat-ID/reality.md`; `emotion/` stays unchanged. Location and weather are held only in memory, although weather mentioned in a reply becomes part of chat history. Sources for explicit lookup replies are stored in chat Markdown and survive reopening. Failed searches or insufficient evidence may leave product details unanswered.

### Connect an AI model

Prepare Node.js 22+ and a running Ollama service with a model already installed.

1. Set the **Ollama service address** in `ai.config.js`:

   ```js
   export default 'http://127.0.0.1:11434';
   ```

   Use this address when Ollama and the backend run on the same computer. For another computer, use its LAN IP instead. Do not append `/api/chat`.

2. Check the **model name**. The default is `qwen3.5:9b`. For another installed model, set this field in `local.config.json`:

   ```json
   { "OLLAMA_MODEL": "your-installed-model-name" }
   ```

   You can create this file yourself; first launch also creates defaults if it is missing. When editing an existing file, preserve other fields. Both the address and model name must match your Ollama service. Restart the backend after changes.

### Start the app

Run in the project folder:

```sh
npm install
npm run dev
```

Open `http://127.0.0.1:5174/`, set your six-digit passcode, then select a memory model and create a chat.

### Unlock, memories and chats

Set and confirm a shared six-digit passcode on first launch. Unlock to choose a chat. The keypad and interface support Chinese, Japanese and English, plus physical number keys.

1. Put each memory model in a subfolder of `emotion/`. Use [ex-skill](https://github.com/perkfly/ex-skill) or another distillation method. Two examples are included: [the full Mika example](emotion/Mika_Demo/) and [the minimal example](emotion/Minimal/).

   ⭐ **Neither ex-skill nor WeChat history is required.** Write the files yourself, or ask AI to organize your notes or spoken recollections into `persona.md` (personality, speaking style and relationship) and `memories.md` (things to remember). Put both in `emotion/person-name/` to get started. Other files are optional and can be added later.
2. Choose New chat, enter a chat name and select a memory model.
3. Start creates `chats/chat-name.md`, with the initial message “我在。你说。”. AI generation starts after the user's first message.
4. The chat picker corresponds to the MD files in chats. Multiple named chats may share a memory model. Duplicate names never overwrite existing chats.

Persona files may live directly in the memory folder or in skill/emotionchat/. Supported context includes SKILL.md, persona.md, memories.md, conversations.md, optional meta.json and the designated IG summary. Convert raw exports, images or PDFs into Markdown first; the app does not recursively process all files. Restart after editing loaded memories.

Memory files are read-only. Search, delete, clear and restore affect the current chat history. Settings, memory bindings, proactive schedules and backups live in runtime; chats contains the MD files directly.

Alongside persona and memory files, context includes the latest 20 chat messages and up to 6 older keyword matches, capped at 8000 characters per message. Root-level imported memory and conversation excerpts have 24000-character limits. This is not semantic search. Duplicate detection reduces repetitive replies and endings but cannot eliminate them completely.

### Optional configuration and troubleshooting

<details>
<summary>Change models, connect another computer, use a phone, or fix connection errors</summary>

- **Change models**: set `OLLAMA_MODEL` in the automatically created `local.config.json` to an installed model name.
- **Model on another computer**: set `ai.config.js` to `export default 'http://MODEL_COMPUTER_LAN_IP:11434';` and enable LAN connections in Ollama. Use the service root without `/api/chat`, then restart the backend.
- **Phone access**: join the same trusted LAN and open `http://COMPUTER_LAN_IP:5174/`. No model installation is needed on the phone. Keep the app and backend running.
- **Missing model**: check that `OLLAMA_MODEL` matches a downloaded model.
- **Offline model**: check that Ollama is running and reachable. `127.0.0.1` refers to the backend computer, not a separate model computer.

No model is bundled. The app uses the Ollama API, not arbitrary chat websites or OpenAI-compatible endpoints.

</details>

### Settings and privacy

Change interface language on the chat picker. Settings control display name, real-world updates, proactive timing and quiet hours. Proactive messages start only after the first user message. Unanswered follow-ups wait between minimum×2+2 minutes and the maximum, raising the upper bound if necessary. Quiet hours use Japan time. Opened chats may continue proactive messages while the backend runs.

Supports timestamps, quoted replies, history search, confirmed deletion and mobile long-press actions. Background arrivals update the tab's unread count and dot; audio needs a browser interaction to unlock. Background throttling or phone lock screens can delay alerts; system push is not provided.

Settings displays the memory folder name. Delete chat only sets a deleted flag in the MD; content and memories remain intact. Restore chats verifies the same passcode with the numeric keypad before clearing that flag.

Only a salted scrypt hash is stored in auth.config.json, beside ai.config.js. Five failed attempts trigger a 30-second cooldown; sessions last up to 12 hours and end on backend restart. The passcode protects app/API access, not files on disk. Use HTTP access only on a trusted LAN. Never publish passcode configuration, private endpoints, memory files, chats or runtime data.

Optional settings: OLLAMA_MODEL, MEMORIES_DIR (./emotion), CHAT_RECORDS_DIR (./chats), PORT (3000). Environment variables take precedence. The model URL comes only from ai.config.js. Legacy layouts are not migrated automatically; back up before upgrading.

Validation: `npm run build`; backend tests: `node --test server/*.test.js`.


Mika_Demo contains 1200 fictional, programmatically organized reference messages across 50 scenarios. It is synthetic format/example data, not a real conversation export.
