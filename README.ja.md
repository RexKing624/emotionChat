# EmotionChat

[中文](README.md) · [日本語](README.ja.md) · [English](README.en.md)

Ollama・Express・Vue 3 を使ったローカルチャットアプリです。人物設定、Markdown の履歴、キーワードによる記憶の検索、自発的なメッセージ、中国語・日本語・英語の画面表示に対応します。

## AI モデルはどこから来ますか？

EmotionChat 自体にはモデルやクラウドアカウントは含まれません。返信は、自分で起動した、または接続可能な **Ollama サービス**が生成します。Ollama API 専用で、一般のチャットサイトや OpenAI 互換 API には対応していません。

ルートの **`ai.config.js`** のアドレスだけを変更します。

```js
export default 'http://127.0.0.1:11434';
```

バックエンドと同じパソコンならこのまま使えます。別の端末なら `http://モデル端末のLAN_IP:11434` または解決可能なホスト名を指定してください。`/api/chat` を付けず、サービスのルートを入力します。バックエンドから接続できる必要があります。スマートフォンでは従来どおり EmotionChat の画面を開きます。変更後は `npm run dev` を再起動してください。

既定モデルは `qwen3.5:9b` です。モデル端末に Ollama をインストールして `ollama pull qwen3.5:9b` を実行してください。別のインストール済みモデルを使う場合は、任意の `local.config.json` の `OLLAMA_MODEL` を変更します。アドレスファイルだけではモデルはインストールされません。

接続先は `ai.config.js` のみから読み込みます。以前の `OLLAMA_URL` 環境変数と local.config.json の項目は使用しません。公開前に個人用アドレスをサンプルに戻してください。


## 2ステップ：記憶テーマを取り込み、モデルに接続

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


## 起動

Node.js 22 以降と、接続可能な Ollama が必要です。モデル側の端末で、例えば `ollama pull qwen3.5:9b` を実行してモデルを準備してください。

```sh
npm install
cp local.config.example.json local.config.json
npm run dev
```
`local.config.json` に任意のモデル名と非公開の人物資料フォルダーを設定します。環境変数はこのファイルより優先されます。

パソコンでは http://127.0.0.1:5174/ 、同じ LAN のスマートフォンでは `http://パソコンのLAN_IP:5174/` を開きます。バックエンドを起動したままにしてください。認証機能はないため、信頼できる LAN で使用してください。

## 設定

| 項目 | 既定値・用途 |
| --- | --- |
| `PORT` | `3000`。変更時は Vite のプロキシも変更 |
| `OLLAMA_MODEL` | `qwen3.5:9b` |
| `EXSKILL_DIR` | `Emotion/skill/emotionchat/` |
| `CHAT_ARCHIVE_PATH` | `archive/chat.md` |

人物フォルダーには `meta.json`、`SKILL.md`、`persona.md`、`memories.md`、任意で `knowledge/chats/ig_screenshots_summary.md` を配置できます。資料を変更した後はバックエンドを再起動してください。

## 機能

- 設定で相手の名前、表示言語、自発的な会話までの待ち時間、おやすみ時間を変更できます。表示言語は会話の言語に影響しません。
- 設定タイトルの右側に、モデルの利用可能・未インストール・オフライン状態を表示します。利用可能は接続とインストールを確認した状態で、生成中という意味ではありません。
- 日時付きメッセージを Markdown から復元します。日時は端末の現地時間で `01/Apr/2026,03:24` の形式です。
- 直近20件とキーワードが一致する過去の最大6件を参照します。1件につき最大4000文字で、意味検索ではありません。
- 既定の待ち時間は10〜30分、日本時間23:00〜09:00はおやすみ時間です。話題がなければ送信せず、返事がない間は連続送信しません。開始・終了が同じならおやすみ時間は無効です。
- 画面は5秒ごとに履歴を取得します。スマートフォンのロック画面通知には対応していません。

## 非公開データ

`archive/`、`Emotion/skill/emotionchat/`、`local.config.json` は Git の対象外です。設定と自発的会話のタイマーは履歴の隣に JSON で保存します。実際の会話、人物資料、個人設定をコミットしないでください。除外設定では過去の Git 履歴は消えないため、公開前に過去のコミットも確認してください。

## API とビルド

`GET /api/history`、`GET /api/health`、`GET /api/settings`、`PUT /api/settings`、`POST /api/chat`（JSON：`{"message":"こんにちは"}`）。

`npm run build` でフロントエンドをビルドします。開発画面は5174番ポートを使用し、ローカルのみで待ち受ける API にリクエストを転送します。
