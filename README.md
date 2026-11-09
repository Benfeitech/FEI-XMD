# FEI XMD — Free WhatsApp Bot by Benfei Tech

[![Validate FEI XMD](https://github.com/Benfeitech/FEI-XMD/actions/workflows/validate.yml/badge.svg?branch=main)](https://github.com/Benfeitech/FEI-XMD/actions/workflows/validate.yml)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Baileys](https://img.shields.io/badge/WhatsApp-Baileys-25D366?logo=whatsapp&logoColor=white)](https://github.com/WhiskeySockets/Baileys)

<p align="center">
  <a href="https://fei-xmd.benfeilab.com">
    <img src="https://res.cloudinary.com/dqqyvozdw/image/upload/v1792848652/arbeimjfqkkfpn9zvfhf.png" alt="FEI XMD WhatsApp bot by Benfei Tech" width="720">
  </a>
</p>

**FEI XMD** is a free, modular WhatsApp bot developed and powered by **Benfei Tech**. It brings AI chat, AI media generation, social-media downloads, group tools, news, games, anime information and other everyday utilities into WhatsApp. Pair a WhatsApp account through the [official FEI XMD pairing website](https://fei-xmd.benfeilab.com), or explore and run the bot from this public GitHub source repository.

The official product identity is **FEI XMD WhatsApp Bot | Official Pairing by Benfei Tech**. This repository contains the main FEI XMD bot source code. The pairing portal is a separate web application.

## FEI XMD — official project information

| Project detail | Official information |
| --- | --- |
| Product name | FEI XMD |
| Full product description | Free WhatsApp bot developed and powered by Benfei Tech |
| Developer and publisher | [Benfei Tech](https://benfeitech.com) |
| Official pairing website | [https://fei-xmd.benfeilab.com](https://fei-xmd.benfeilab.com) |
| Main bot source code | [github.com/Benfeitech/FEI-XMD](https://github.com/Benfeitech/FEI-XMD) |
| WhatsApp newsletter | [𝐁𝐄𝐍𝐅𝐄𝐈 𝐓𝐄𝐂𝐇 ™](https://whatsapp.com/channel/0029VbCwtVY65yDBVR9uhJ02) |
| YouTube | [@benfeitech](https://www.youtube.com/@benfeitech) |
| Telegram | [t.me/benfeitech](https://t.me/benfeitech) |
| Support | [WhatsApp Benfei Tech](https://wa.me/2349060715145) |
| Bot artwork | [Official FEI XMD image](https://res.cloudinary.com/dqqyvozdw/image/upload/v1792848652/arbeimjfqkkfpn9zvfhf.png) |

## What can FEI XMD do?

FEI XMD groups its **184 public commands into 18 menu sections**. The command menu is designed for WhatsApp conversations and groups, with feature-specific permission checks where an action affects group settings.

- **AI Chat:** chat with configured AI providers, ask questions, translate text, summarize content and use supported reasoning or writing tools.
- **AI Media:** generate images from text prompts and convert text to speech using supported providers.
- **News Desk:** retrieve current headlines from configured Nigerian and international news feeds.
- **Group Tools:** view group information, manage basic group settings, create invite links where permitted, tag members and configure optional welcome/goodbye messages.
- **Downloads:** request supported public media from services such as Facebook, Instagram, TikTok, X/Twitter and YouTube.
- **Fun Games and Fun Mix:** use a calculator, polls, trivia, riddles, random choices, jokes, facts, animal images and conversation starters.
- **Anime tools:** search anime, manga, characters, studios, rankings, schedules, recommendations and public anime art or reaction GIFs.
- **Canvas and Media Tools:** create quote artwork and look up a song's artist with a short lyrics excerpt and a source link.
- **Chat Privacy and Status Tools:** view the public build's privacy information and draft text or status ideas without automatically reading or posting WhatsApp statuses.
- **Owner Tools:** view a read-only runtime uptime summary.

## Public menu sections and commands

| Menu section | Available commands |
| --- | --- |
| General | menu, help, ping, alive, owner, support, time, date, version, jid, whoami |
| AI Chat | ai, ask, gpt, chatgpt, mathgpt, deepseek, translate, summarize, fable5, qwen, deepseek2 |
| AI Media | flux, pollination, tts, tts2, tts3, tts4, tts5 |
| News Desk | news, aljazeera, cnn, bbc, guardian, npr, nytimes, foxnews, skynews, dw, punchnews |
| Group Tools | welcome, goodbye, groupinfo, groupjid, getgcpp, groupcount, groupstats, admins, tagall, link, groupname, groupdesc, close, open |
| Downloads | aio, fb, twitter, instagram, ytmp4, tiktok, play2, ytsearch, video |
| Fun Games | calc, poll, coinflip, dice, 8ball, choose, trivia, riddle, activity, pokemon |
| Fun Mix | joke, dadjoke, progjoke, chuck, fact2, catfact, dog, cat, fox, advice, quote2, meme, numfact, history, wiki, nasa |
| Anime Info | animemenu, anime, manga, character, charpic, staff, studio, recommend, episodes, animechars, trailer, pictures, streaming, review, genres, genre, topanime, topmanga, popular, favorite, airing, upcoming, trending, season, topchars, schedule, nextep |
| Anime Art | randomanime, randommanga, randomchar, animequote, whatanime, waifu2, husbando, neko, kitsune |
| Anime GIFs | angry, baka, bleh, blowkiss, blush, bored, carry, clap, confused, cry, cuddle, dance, facepalm, feed, handhold, handshake, happy, highfive |
| Anime Reactions | hug, kabedon, kiss, lappillow, laugh, lurk, nod, nom, nope, nya, pat, peck, poke, pout, run, salute, shake |
| Anime Moves | shocked, shrug, sip, sleep, smile, smug, spin, stare, teehee, think, thumbsup, tickle, wag, wave, wink, yawn, yeet |
| Canvas Tools | wndwqute, canvasquote |
| Media Tools | lyrics |
| Chat Privacy | privacy |
| Status Tools | statusdraft, statusideas |
| Owner Tools | runtime |

The Channel menu section is intentionally not included. The bot configuration retains the official Benfei Tech newsletter name and newsletter JID as branding metadata only; this public command set does not add a Channel menu, channel-management commands or automatic channel-following features.

## Official FEI XMD pairing website

Use the official [FEI XMD pairing portal](https://fei-xmd.benfeilab.com) to start a WhatsApp pairing request. The website accepts a WhatsApp phone number, requests a pairing code from the bot host, and guides the user through linking the account in WhatsApp.

To pair from a locally running copy of this repository:

1. Start FEI XMD in a terminal.
2. Enter the WhatsApp phone number with its country code when prompted.
3. Open WhatsApp on that phone and go to **Settings → Linked devices → Link a device**.
4. Choose **Link with phone number instead** and enter the pairing code shown by FEI XMD.
5. Keep the bot process running while the linked account is connected.

The pairing website and the bot source code are separate project components: this repository contains the main WhatsApp bot, while the official portal provides the web-based pairing experience.

## Installation and local development

### Requirements

- Node.js **20.9 or newer**
- npm
- A WhatsApp account to link to FEI XMD

### Install

~~~bash
git clone https://github.com/Benfeitech/FEI-XMD.git
cd FEI-XMD
npm install
~~~

Copy the example environment file and review the defaults.

**Windows PowerShell:**

~~~powershell
Copy-Item .env.example .env
~~~

**macOS / Linux:**

~~~bash
cp .env.example .env
~~~

Start the local bot:

~~~bash
npm start
~~~

You can also use:

~~~bash
npm run local
~~~

The default owner is **Benfei Tech**, with one configured owner number: **2349060715145**. The OWNER_NUMBER environment variable can override this value for a private deployment. Do not add a second owner number to this public configuration.

### Main configuration

| Variable | Purpose | Default |
| --- | --- | --- |
| BOT_NAME | WhatsApp bot display name | FEI XMD |
| BOT_VERSION | Displayed bot version | 1.0.0 |
| PREFIX | Command prefix | . |
| OWNER_NAME | Configured owner/developer name | Benfei Tech |
| OWNER_NUMBER | The single owner WhatsApp number, digits only | 2349060715145 |
| BOT_URL | Official pairing website shown with the menu artwork | https://fei-xmd.benfeilab.com |
| BOT_IMAGE_URL | FEI XMD menu artwork | Official Cloudinary image |
| FEI_SESSION_DIR | Local WhatsApp authentication directory | ./auth_info_baileys |
| FEI_DATA_DIR | Local writable data directory | ./data |
| DATABASE_URL | Optional PostgreSQL connection for future database-backed features | Empty |
| NABEES_API_KEY | Optional NabeesTech download provider key | Empty |

Never commit a real .env file, WhatsApp authentication files, session credentials, database URLs or provider API keys.

## Technology

FEI XMD is built with:

- **Node.js** and JavaScript ES modules.
- **@whiskeysockets/baileys** — the normal WhiskeySockets Baileys npm package, pinned to **7.0.0-rc14**.
- A recursive command loader that registers command modules and aliases.
- Modular WhatsApp runtime, message utilities, session management and local state storage.
- Bounded API clients for external AI, news, download, anime and media services.
- Node.js built-in test runner for automated regression tests.

This repository does not install the separate KaluLabs Baileys fork used by other FEI XMD project deployments.

## Privacy and public-release boundaries

The public FEI XMD command set deliberately avoids features that collect or expose more private account or chat information than needed. It excludes group-chat history collection and AI summaries of private conversations, live-presence tracking, view-once recovery, anti-delete/anti-edit monitoring, read-receipt controls, automatic status viewing or reacting, contact blocking and privileged owner/session administration.

Group-setting commands apply permission checks. Invite-link retrieval and member tagging are restricted to group admins, and member tagging is capped. Welcome and goodbye messages are disabled by default; their settings are stored separately from chat history.

The Chat Privacy command explains these boundaries. Status Tools only prepare text drafts and ideas. Owner Tools only shows basic process uptime and connection status.

## Tests and validation

Run the JavaScript syntax checks and test suite before submitting changes:

~~~bash
npm run check
npm test
~~~

GitHub Actions runs both checks on pushes and pull requests targeting main. The test suite covers command registration, menu ordering, excluded commands, API URL validation, news parsing, state storage, message utilities and calculator safety.

External providers can change their APIs, apply rate limits or become temporarily unavailable. A provider outage does not mean that the FEI XMD WhatsApp runtime itself is offline.

## Frequently asked questions

### What is FEI XMD?

FEI XMD is a free, modular WhatsApp bot developed and powered by Benfei Tech. It provides AI chat and media tools, downloads, news, group utilities, games, anime features and other commands inside WhatsApp.

### Where is the official FEI XMD pairing website?

The official pairing portal is [https://fei-xmd.benfeilab.com](https://fei-xmd.benfeilab.com).

### Where can I find the FEI XMD source code?

The canonical main bot source repository is [https://github.com/Benfeitech/FEI-XMD](https://github.com/Benfeitech/FEI-XMD).

### Who develops FEI XMD?

FEI XMD is developed and powered by [Benfei Tech](https://benfeitech.com).

### Does the public FEI XMD bot include a Channel menu?

No. The Channel menu section and channel-management commands are intentionally excluded from this public command set. The official Benfei Tech newsletter identity remains in the bot configuration as project branding metadata.

## Official links

- **Pair FEI XMD:** https://fei-xmd.benfeilab.com
- **Main FEI XMD source code:** https://github.com/Benfeitech/FEI-XMD
- **Benfei Tech:** https://benfeitech.com
- **WhatsApp newsletter:** https://whatsapp.com/channel/0029VbCwtVY65yDBVR9uhJ02
- **YouTube:** https://www.youtube.com/@benfeitech
- **Telegram:** https://t.me/benfeitech
- **WhatsApp support:** https://wa.me/2349060715145

---

**FEI XMD — WhatsApp automation by Benfei Tech.**

⚡ *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴇɴꜰᴇɪ ᴛᴇᴄʜ*
