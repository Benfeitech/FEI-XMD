import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import config from "../config/bot.config.js";
import theme from "../config/theme.config.js";
import { loadCommands } from "../handlers/command-loader.js";
import { buildMenu } from "../lib/menu.js";

test("the first seven menu sections contain the selected public command batch", async () => {
  const { commands, lookup } = await loadCommands(path.resolve("commands"));
  const count = category => commands.filter(command => command.category === category).length;

  assert.equal(count("General"), 11);
  assert.equal(count("AI & Chat"), 11);
  assert.equal(count("AI Media"), 7);
  assert.equal(count("News"), 11);
  assert.equal(count("Group"), 14);
  assert.equal(count("Downloads"), 9);
  assert.equal(count("Games"), 9);
  assert.equal(commands.length, 72);

  for (const name of [
    "menu", "help", "ping", "alive", "owner", "support", "time", "date", "version", "jid", "whoami",
    "ai", "ask", "gpt", "chatgpt", "mathgpt", "deepseek", "translate", "summarize", "fable5", "qwen", "deepseek2",
    "flux", "pollination", "tts", "tts2", "tts3", "tts4", "tts5",
    "news", "aljazeera", "cnn", "bbc", "guardian", "npr", "nytimes", "foxnews", "skynews", "dw", "punchnews",
    "welcome", "goodbye", "groupinfo", "groupjid", "getgcpp", "groupcount", "groupstats", "admins", "tagall", "link", "groupname", "groupdesc", "close", "open",
    "aio", "fb", "twitter", "instagram", "ytmp4", "tiktok", "play2", "ytsearch", "video",
    "calc", "poll", "coinflip", "dice", "8ball", "choose", "trivia", "riddle", "activity"
  ]) {
    assert.ok(lookup.has(name), "missing command " + name);
  }
});

test("commands considered too sensitive for this public batch are not registered", async () => {
  const { lookup } = await loadCommands(path.resolve("commands"));
  for (const name of [
    "kick", "add", "promote", "demote", "revoke", "resetlink",
    "onlineusers", "leave", "addmeta", "removemeta", "fakemsg",
    "antidelete", "antiedit", "readreceipt"
  ]) {
    assert.equal(lookup.has(name), false, "sensitive command was registered: " + name);
  }
});

test("menu displays the first seven titles in the reference order", async () => {
  const { commands } = await loadCommands(path.resolve("commands"));
  const menu = buildMenu({ commands, config, theme });
  const titles = [
    "🏠 ɢᴇɴᴇʀᴀʟ",
    "🧠 ᴀɪ ᴄʜᴀᴛ",
    "🎨 ᴀɪ ᴍᴇᴅɪᴀ",
    "📰 ɴᴇᴡs ᴅᴇsᴋ",
    "👥 ɢʀᴏᴜᴘ ᴛᴏᴏʟs",
    "📥 ᴅᴏᴡɴʟᴏᴀᴅs",
    "🎮 ғᴜɴ ɢᴀᴍᴇs"
  ];
  const positions = titles.map(title => menu.indexOf(title));
  assert.ok(positions.every(position => position >= 0));
  assert.ok(positions.every((position, index) => index === 0 || positions[index - 1] < position));
  for (const command of ["news", "groupinfo", "aio", "trivia"]) {
    assert.ok(menu.includes(config.prefix + command));
  }
});
