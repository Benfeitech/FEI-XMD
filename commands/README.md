# Command modules

Feature commands will be added here after the runtime foundation is verified.

Each JavaScript module must default-export either one command object or an array of command objects. A command object uses this shape:

    export default {
      name: "example",
      aliases: ["ex"],
      category: "General",
      description: "A short description shown in the menu.",
      async run(ctx) {
        await ctx.reply("Example response.");
      }
    };

The runtime context currently provides:

- ctx.sock — the active Baileys socket.
- ctx.msg — the original Baileys message.
- ctx.jid — the chat JID.
- ctx.senderJid — the sender JID.
- ctx.text — the message text after removing the command prefix.
- ctx.commandName — the matched command name or alias.
- ctx.args — the remaining argument string.
- ctx.config — bot configuration.
- ctx.owner — whether the sender matches a configured owner number.
- ctx.reply(content, options) — send a reply, quoting the source message by default.

Use the installed normal WhiskeySockets Baileys API. Do not introduce fork-only methods or assumptions.
