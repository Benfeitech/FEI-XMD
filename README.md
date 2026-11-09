# FEI XMD — WhatsApp Bot by Benfei Tech

FEI XMD is a modular WhatsApp automation project developed by **Benfei Tech**. This repository is the clean public-release codebase and uses the normal **@whiskeysockets/baileys** npm package. It does not install or import the KaluLabs Baileys fork used by the separate FEI-XMD-MAIN and FEI-XMD-MINI repositories.

## Project status

The runtime foundation and the first **72 commands** are in place across the first seven menu sections. Commands are loaded recursively from the commands/ directory and use a shared context compatible with the normal WhiskeySockets Baileys v7 package.

### First seven menu sections

| Menu title | Commands |
| --- | --- |
| General | menu, help, ping, alive, owner, support, time, date, version, jid, whoami |
| AI Chat | ai, ask, gpt, chatgpt, mathgpt, deepseek, translate, summarize, fable5, qwen, deepseek2 |
| AI Media | flux, pollination, tts, tts2, tts3, tts4, tts5 |
| News Desk | news, aljazeera, cnn, bbc, guardian, npr, nytimes, foxnews, skynews, dw, punchnews |
| Group Tools | welcome, goodbye, groupinfo, groupjid, getgcpp, groupcount, groupstats, admins, tagall, link, groupname, groupdesc, close, open |
| Downloads | aio, fb, twitter, instagram, ytmp4, tiktok, play2, ytsearch, video |
| Fun Games | calc, poll, coinflip, dice, 8ball, choose, trivia, riddle, activity |

### Public-release exclusions

This batch deliberately leaves out commands that could expose private group activity, create unnecessary moderation risk, or reveal infrastructure controls. Examples include participant removal/addition/promotion/demotion, invite-link reset, live-presence surveillance, group conversation history and summaries, Meta AI participant automation, and owner/session administration.

Group-setting commands are restricted to group admins (and the bot owner where applicable). Group invite-link retrieval is admin-only. The all-member mention command is admin-only and capped at 150 participants.

## Requirements

- Node.js 20.9 or newer
- npm
- A WhatsApp account to link to FEI XMD

## Install and run

1. Clone this repository.
2. Install dependencies with npm install.
3. Copy .env.example to .env and configure the owner number and any optional settings.
4. Start the local runtime with npm start or npm run local.
5. Enter the WhatsApp number with country code when prompted. The terminal displays a pairing code; enter it from WhatsApp under Linked devices.
6. Keep the process running while the bot is connected.

For non-interactive hosts, set PAIRING_NUMBER in the host environment. Never commit a real .env file, WhatsApp authentication folder, database URL, provider key, or session credentials.

### Optional download provider configuration

The NabeesTech all-in-one downloader can use NABEES_API_KEY from the host environment. Leave it blank when the provider does not require a key. The Ikyyxd YouTube audio search and the configured YouTube search endpoint do not require a credential in the source code. Do not add live API keys to this repository.

## Architecture

- index.js — application entry point.
- local.js — interactive local pairing and graceful shutdown.
- config/ — bot identity, owner settings and menu presentation.
- handlers/command-loader.js — recursive command discovery, validation, alias registration and command parsing.
- commands/ — modular commands for the first seven menu sections.
- lib/whatsapp-runtime.js — normal WhiskeySockets Baileys authentication, socket creation, pairing, reconnection, message intake and command dispatch.
- lib/session-manager.js — lifecycle management for isolated local session runtimes.
- lib/message-utils.js — safe message unwrapping, text extraction and WhatsApp JID helpers.
- lib/owner-utils.js — owner-number normalization and checks.
- lib/menu.js — category and explicit-name menu rendering.
- lib/api-client.js — bounded JSON requests to allowlisted AI/media API providers, URL validation and response formatting.
- lib/youtube-play.js — Ikyyxd YouTube audio lookup.
- lib/group-greetings.js — separate per-group welcome/goodbye settings; no chat-history storage.
- lib/math-expression.js — a small expression parser for the calculator (no eval).
- lib/state-store.js — atomic JSON state persistence.
- lib/database.js — optional PostgreSQL pool factory for future database-backed features.
- test/ — Node.js built-in test suite for core utilities, command registration, news feed parsing and calculator safety.

The runtime processes fresh notify message events only. It does not replay historical append events as commands. AI, news and media commands depend on external provider availability and may be unavailable when those services change or go offline.

## Command module contract

Every command module exports a default object containing a name, category, description, optional aliases and an async run(ctx) function. The command loader rejects malformed definitions and duplicate command names or aliases. See commands/README.md for the full command context.

## Baileys compatibility

The project pins the normal WhiskeySockets package version 7.0.0-rc14. Runtime integrations must use the installed npm package's public API. Do not copy fork-only methods, event assumptions or patches from the other FEI XMD repositories.

## Checks

Run these commands locally:

~~~bash
npm run check
npm test
~~~

GitHub Actions runs these checks for pushes and pull requests targeting main.

## Project links

- Developer: https://benfeitech.com
- Official FEI XMD pairing portal: https://fei-xmd.benfeilab.com
- GitHub: https://github.com/Benfeitech/FEI-XMD
- WhatsApp channel: https://whatsapp.com/channel/0029VbCwtVY65yDBVR9uhJ02
- YouTube: https://www.youtube.com/@benfeitech
- Telegram: https://t.me/benfeitech

---
⚡ *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴇɴꜰᴇɪ ᴛᴇᴄʜ*
