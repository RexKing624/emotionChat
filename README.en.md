# EmotionChat

[中文](README.md) · [日本語](README.ja.md) · [English](README.en.md)

A local chat application built with Ollama, Express and Vue 3. Includes persona context, Markdown history, keyword memory recall, proactive messages, and Chinese, Japanese and English interfaces.

## Where does the AI model come from?

EmotionChat does not include model weights or a hosted AI account. Replies come from an **Ollama service you run or can access**. This integration supports the Ollama API, not arbitrary chat websites or OpenAI-compatible endpoints.

Edit only the address in the root **`ai.config.js`** file:

```js
export default 'http://127.0.0.1:11434';
```

Use this address for Ollama on the backend computer. For another computer, use `http://MODEL_COMPUTER_LAN_IP:11434` or its resolvable hostname. Enter the service root without `/api/chat`. The backend must be able to reach it; phones still open the EmotionChat page. Restart `npm run dev` after editing.

The default model is `qwen3.5:9b`. Install Ollama on the model computer and run `ollama pull qwen3.5:9b`. To use another installed model, set `OLLAMA_MODEL` in optional `local.config.json`. The address file does not install model weights.

`ai.config.js` is the sole endpoint source. Legacy `OLLAMA_URL` environment variables and local.config.json fields are no longer used. Restore the example address before publishing private changes.


## Two steps: import a memory theme, connect a model

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


## Setup

Use Node.js 22+ and a reachable Ollama service. Install the configured model on the model host, for example `ollama pull qwen3.5:9b`.

```sh
npm install
cp local.config.example.json local.config.json
npm run dev
```
Edit `local.config.json` with your optional model name and private persona directory. Environment variables override this file.

Open http://127.0.0.1:5174/ on the computer, or `http://COMPUTER_LAN_IP:5174/` on a phone on the same network. Keep the backend running. Use a trusted LAN; authentication is not included.

## Configuration

| Key | Default / purpose |
| --- | --- |
| `PORT` | `3000`; update the Vite proxy if changed |
| `OLLAMA_MODEL` | `qwen3.5:9b` |
| `EXSKILL_DIR` | `Emotion/skill/emotionchat/` |
| `CHAT_ARCHIVE_PATH` | `archive/chat.md` |

The persona directory can contain `meta.json`, `SKILL.md`, `persona.md`, `memories.md`, and optional `knowledge/chats/ig_screenshots_summary.md`. Restart the backend after editing persona files.

## Features

- Settings control the display name, interface language, random proactive delay and quiet hours. Interface language does not change conversation language.
- Model status beside the settings title reports available, not installed or offline. Available means the service is reachable and the configured model is installed, not necessarily generating.
- Timestamped messages are restored from Markdown. Dates use device local time in `01/Apr/2026,03:24` format.
- Recall includes the latest 20 messages and up to 6 older keyword matches, capped at 4000 characters per message. This is not semantic search.
- Default proactive delay is 10–30 minutes, with quiet hours from 23:00 to 09:00 Japan time. A topic may be skipped; no repeated follow-ups without a user reply. Equal quiet-hour times disable quiet hours.
- The page polls history every 5 seconds. Phone lock-screen notifications are not supported.

## Private data

Git ignores `archive/`, `Emotion/skill/emotionchat/` and `local.config.json`. Settings and proactive timing are stored as JSON beside the archive. Never commit real conversations, persona material or private configuration. Ignore rules do not remove existing Git history; inspect previous commits before publishing.

## API and build

`GET /api/history`, `GET /api/health`, `GET /api/settings`, `PUT /api/settings`, and `POST /api/chat` with JSON `{"message":"Hello"}`.

Run `npm run build` to build the frontend. The development page uses port 5174 and proxies API requests to the loopback-only backend.
