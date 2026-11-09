# FEI XMD — WhatsApp Bot by Benfei Tech

FEI XMD is a modular WhatsApp automation project developed by **Benfei Tech**. This repository is the clean public-release codebase and uses the normal **@whiskeysockets/baileys** npm package. It does not install or import the KaluLabs Baileys fork used by the separate FEI-XMD-MAIN and FEI-XMD-MINI repositories.

## Project status

The runtime foundation and the first 29 feature commands are in place. The first three menu sections are **General**, **AI Chat**, and **AI Media**. Commands are loaded recursively from the commands/ directory and use a shared context compatible with the normal WhiskeySockets Baileys v7 package.

### First three menu sections

| Menu title | Commands |
| --- | --- |
| General | menu, help, ping, alive, owner, support, time, date, version, jid, whoami |
| AI Chat | ai, ask, gpt, chatgpt, mathgpt, deepseek, translate, summarize, fable5, qwen, deepseek2 |
| AI Media | flux, pollination, tts, tts2, tts3, tts4, tts5 |

Some reference features are deliberately not included in this batch: WormGPT, Sora video generation and voice-note transcription. Those require separate safety, provider or media-flow review.

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

For non-interactive hosts, set PAIRING_NUMBER in the host environment. Never commit a real .env file, WhatsApp authentication folder, database URL or session credentials.

## Architecture

- index.js — application entry point.
- local.js — interactive local pairing and graceful shutdown.
- config/ — bot identity, owner settings and menu presentation.
- handlers/command-loader.js — recursive command discovery, validation, alias registration and command parsing.
- commands/ — General, AI Chat and AI Media modules. Further menu sections will be introduced in later batches.
- lib/whatsapp-runtime.js — normal WhiskeySockets Baileys authentication, socket creation, pairing, reconnection, message intake and command dispatch.
- lib/session-manager.js — lifecycle management for isolated local session runtimes.
- lib/message-utils.js — safe message unwrapping, text extraction and WhatsApp JID helpers.
- lib/owner-utils.js — owner-number normalization and checks.
- lib/menu.js — menu rendering from registered command definitions.
- lib/api-client.js — bounded JSON requests to configured AI/media API providers and response formatting.
- lib/state-store.js — atomic JSON state persistence.
- lib/database.js — optional PostgreSQL pool factory for future database-backed features.
- test/ — Node.js built-in test suite for core utilities and command registration.

The runtime processes fresh notify message events only. It does not replay historical append events as commands. AI and media commands depend on external provider availability and may be unavailable when those services change or go offline.

## Command module contract

Every command module exports a default object containing a name, category, description, optional aliases and an async run(ctx) function. The command loader rejects malformed definitions and duplicate command names or aliases. See commands/README.md for the full command context.

## Baileys compatibility

The project pins the normal WhiskeySockets package version 7.0.0-rc14. Baileys v7 introduced breaking changes, so runtime integrations must be written against the installed npm package and its public exports. Do not copy fork-only methods, event assumptions or patches from the other FEI XMD repositories.

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
