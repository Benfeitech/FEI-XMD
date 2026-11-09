# Command modules

The first seven menu sections currently contain 72 commands.

| Menu section | Command names |
| --- | --- |
| General | menu, help, ping, alive, owner, support, time, date, version, jid, whoami |
| AI Chat | ai, ask, gpt, chatgpt, mathgpt, deepseek, translate, summarize, fable5, qwen, deepseek2 |
| AI Media | flux, pollination, tts, tts2, tts3, tts4, tts5 |
| News Desk | news, aljazeera, cnn, bbc, guardian, npr, nytimes, foxnews, skynews, dw, punchnews |
| Group Tools | welcome, goodbye, groupinfo, groupjid, getgcpp, groupcount, groupstats, admins, tagall, link, groupname, groupdesc, close, open |
| Downloads | aio, fb, twitter, instagram, ytmp4, tiktok, play2, ytsearch, video |
| Fun Games | calc, poll, coinflip, dice, 8ball, choose, trivia, riddle, activity |

Public-release exclusions include participant-management commands (kick/add/promote/demote), group invite reset, live-presence tracking, stored group-history summaries, Meta AI participant automation, and owner/session administration. Group setting changes check the sender's group-admin role and require the bot to be an admin where WhatsApp requires it. Tag-all is admin-only and capped at 150 members. Welcome/goodbye messages are disabled by default and can be configured by group admins.

Each JavaScript module default-exports one command object or an array of command objects. A command object uses this shape:

    export default {
      name: "example",
      aliases: ["ex"],
      category: "General",
      description: "A short description shown in the menu.",
      async run(ctx) {
        await ctx.reply("Example response.");
      }
    };

The runtime context provides:

- ctx.sock — the active normal WhiskeySockets Baileys socket.
- ctx.msg — the original Baileys message.
- ctx.jid — the chat JID.
- ctx.senderJid — the sender JID.
- ctx.text — the message text after removing the prefix.
- ctx.commandName and ctx.command — the matched command name.
- ctx.args — the remaining argument string.
- ctx.commands — all loaded command definitions.
- ctx.config and ctx.theme — bot configuration and menu theme.
- ctx.owner — whether the sender matches a configured owner number.
- ctx.connectionOpen — whether the WhatsApp connection is open.
- ctx.buildMenu() — render the configured menu.
- Group greeting settings are persisted separately under FEI_DATA_DIR; group chat history is not collected by these commands.
- ctx.reply(content, options) — send a reply, quoting the source message by default.
- ctx.send(content, options) — send a message without automatically quoting the source.

Use the installed normal WhiskeySockets Baileys API. Do not introduce fork-only methods or assumptions.
