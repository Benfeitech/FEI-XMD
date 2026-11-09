# FEI XMD — WhatsApp Bot by Benfei Tech

FEI XMD is a modular WhatsApp automation project developed by **Benfei Tech**. This repository is the clean public-release codebase and uses the normal **@whiskeysockets/baileys** npm package. It does not install or import the KaluLabs Baileys fork used by the separate FEI-XMD-MAIN and FEI-XMD-MINI repositories.

## Project status

This commit establishes the application foundation before command modules are added. It includes the WhatsApp connection lifecycle, local pairing flow, modular command loader, configuration, persistent JSON state, optional PostgreSQL access, session manager, and automated tests. No feature command modules have been added yet.

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

For non-interactive hosts, set PAIRING_NUMBER in the host environment. Never commit a real .env file, WhatsApp authentication folder, database URL, or session credentials.

## Architecture

- index.js — application entry point.
- local.js — interactive local pairing and graceful shutdown.
- config/ — bot identity and presentation settings.
- handlers/command-loader.js — recursive command discovery, validation, alias registration, and command parsing.
- lib/whatsapp-runtime.js — standard WhiskeySockets Baileys auth, socket creation, pairing, reconnection, message intake, and command dispatch.
- lib/session-manager.js — lifecycle management for isolated local session runtimes.
- lib/message-utils.js — safe message unwrapping, text extraction, and WhatsApp JID helpers.
- lib/owner-utils.js — owner-number normalization and checks.
- lib/menu.js — menu rendering from registered command definitions.
- lib/state-store.js — atomic JSON state persistence.
- lib/database.js — optional PostgreSQL pool factory for future database-backed features.
- commands/ — command modules will be introduced in a later development step.
- test/ — Node.js built-in test suite for core utilities.

The runtime deliberately processes fresh notify message events only. It does not replay historical append events as commands.

## Command module contract

Every command module exports a default object containing a name, category, description, optional aliases, and an async run function. The command loader rejects malformed definitions and duplicate command names or aliases. See commands/README.md for the module contract and context provided to each command.

## Baileys compatibility

The project pins the published WhiskeySockets package version 7.0.0-rc14. Baileys v7 introduced breaking changes, so runtime integrations must be written against the installed npm package and its public exports. Do not copy fork-only methods, event assumptions, or patches from the other FEI XMD repositories.

## Checks

Run npm run check for JavaScript syntax checks and npm test for the automated tests.

## Project links

- Developer: https://benfeitech.com
- Official FEI XMD pairing portal: https://fei-xmd.benfeilab.com
- GitHub: https://github.com/Benfeitech/FEI-XMD
- WhatsApp channel: https://whatsapp.com/channel/0029VbCwtVY65yDBVR9uhJ02
- YouTube: https://www.youtube.com/@benfeitech
- Telegram: https://t.me/benfeitech

---
⚡ *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴇɴꜰᴇɪ ᴛᴇᴄʜ*
