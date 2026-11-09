import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import config from "../config/bot.config.js";
import theme from "../config/theme.config.js";
import { loadCommands } from "../handlers/command-loader.js";
import { buildMenu } from "../lib/menu.js";

test("first three menu sections contain the planned 70 percent command batch", async () => {
  const { commands, lookup } = await loadCommands(path.resolve("commands"));
  const count = category => commands.filter(command => command.category === category).length;

  assert.equal(count("General"), 11);
  assert.equal(count("AI & Chat"), 11);
  assert.equal(count("AI Media"), 7);
  assert.equal(commands.length, 29);

  for (const name of [
    "menu", "help", "ping", "alive", "owner", "support",
    "time", "date", "version", "jid", "whoami",
    "ai", "ask", "gpt", "chatgpt", "mathgpt", "deepseek",
    "translate", "summarize", "fable5", "qwen", "deepseek2",
    "flux", "pollination", "tts", "tts2", "tts3", "tts4", "tts5"
  ]) {
    assert.ok(lookup.has(name), "missing command " + name);
  }
});

test("menu renders only the first three menu titles and all first-batch commands", async () => {
  const { commands } = await loadCommands(path.resolve("commands"));
  const menu = buildMenu({ commands, config, theme });
  const titles = ["🏠 ɢᴇɴᴇʀᴀʟ", "🧠 ᴀɪ ᴄʜᴀᴛ", "🎨 ᴀɪ ᴍᴇᴅɪᴀ"];
  const positions = titles.map(title => menu.indexOf(title));

  assert.ok(positions.every(position => position >= 0));
  assert.ok(positions[0] < positions[1] && positions[1] < positions[2]);
  for (const command of ["menu", "ping", "translate", "fable5", "flux", "tts5"]) {
    assert.ok(menu.includes(config.prefix + command), "menu missing ." + command);
  }
  assert.ok(!menu.includes("Group Tools"));
});
