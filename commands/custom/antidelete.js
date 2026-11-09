// Anti-delete retains incoming message metadata and eligible media for deletion reports.


import { getChatSettings, setChatSetting, GLOBAL_ID } from "../../lib/feature-state.js";
import { requireGroupAdmin } from "../../lib/groups.js";

async function canManage(ctx, label) {
  if (ctx.jid.endsWith("@g.us")) {
    return Boolean(await requireGroupAdmin(ctx, { requireBotAdmin: false }));
  }
  if (ctx.owner) return true;
  await ctx.reply("⛔ Only the bot owner can manage " + label + " in a private chat.");
  return false;
}

function normalizeTarget(raw) {
  if (raw === "dm") return "dm";
  if (raw === "both") return "both";
  return "chat";
}

function targetLabel(target) {
  if (target === "dm") return "your DM";
  if (target === "both") return "your DM *and* the chat itself";
  return "the chat where it happened";
}

function statusText(prefix, name, settings, setting, target) {
  return "⚙️ *" + name.toUpperCase() + "*\n" +
    "• Status here: " + (settings[setting] ? "ON ✅" : "OFF 🔕") + "\n" +
    "• Delivery: " + targetLabel(target) + "\n\n" +
    "*Usage*\n" +
    "• " + prefix + name + " on | off\n" +
    "• " + prefix + name + " dm      → alerts to your DM\n" +
    "• " + prefix + name + " group   → alerts in the chat itself\n" +
    "• " + prefix + name + " both    → both at once\n" +
    "• " + prefix + name + " on dm   → both options at once\n\n" +
    "_Delivery is a global preference; on/off is per chat._";
}

async function readTarget(targetKey) {
  const g = await getChatSettings(GLOBAL_ID);
  return normalizeTarget(g[targetKey]);
}

function makeAlertCommand(name, setting, targetKey, description) {
  return {
    name,
    category: "Chat & Privacy",
    description,
    run: async ctx => {
      if (!(await canManage(ctx, name))) return;

      const prefix = ctx.config.prefix;
      const words = String(ctx.args || "").toLowerCase().split(/\s+/).filter(Boolean);

      if (!words.length) {
        const target = await readTarget(targetKey);
        const local = await getChatSettings(ctx.jid);
        await ctx.reply(statusText(prefix, name, local, setting, target));
        return;
      }

      const applied = [];
      for (const word of words) {
        if (word === "on" || word === "off") {
          await setChatSetting(ctx.jid, setting, word === "on");
          applied.push(name + " → " + word.toUpperCase());
          continue;
        }

        if (word === "dm" || word === "group" || word === "chat" || word === "both") {
          const value = normalizeTarget(word);
          await setChatSetting(GLOBAL_ID, targetKey, value);
          applied.push("delivery → " + targetLabel(value));
          continue;
        }

        const target = await readTarget(targetKey);
        const local = await getChatSettings(ctx.jid);
        await ctx.reply("❓ Unknown option: *" + word + "*\n\n" +
          statusText(prefix, name, local, setting, target));
        return;
      }

      const target = await readTarget(targetKey);
      const local = await getChatSettings(ctx.jid);
      await ctx.reply("✅ " + applied.join("\n✅ ") + "\n\n" +
        statusText(prefix, name, local, setting, target));
    }
  };
}

export default [
  makeAlertCommand("antidelete", "antidel", "deltarget",
    "Recover messages deleted for everyone and report who deleted what."),
  makeAlertCommand("antiedit2", "antiedit", "edittarget",
    "Report edited messages with the previous and the new text.")
];
