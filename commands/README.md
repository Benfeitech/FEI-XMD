# Command modules

The first command batch is now in place:

- **General:** menu, help, ping, alive, owner, support, time, date, version, jid and whoami.
- **AI Chat:** ai, ask, gpt, chatgpt, mathgpt, deepseek, translate, summarize, fable5, qwen and deepseek2.
- **AI Media:** flux, pollination, tts, tts2, tts3, tts4 and tts5.

Together these are 29 commands across the first three menu titles. Additional sections and commands will be added in later batches.

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
- ctx.commandName — the matched command name or alias.
- ctx.args — the remaining argument string.
- ctx.commands — all loaded command definitions.
- ctx.config and ctx.theme — bot configuration and menu theme.
- ctx.owner — whether the sender matches a configured owner number.
- ctx.connectionOpen — whether the WhatsApp connection is open.
- ctx.buildMenu() — render the current configured menu.
- ctx.reply(content, options) — send a reply, quoting the source message by default.
- ctx.send(content, options) — send a message without automatically quoting the source.

Use the installed normal WhiskeySockets Baileys API. Do not introduce fork-only methods or assumptions.
