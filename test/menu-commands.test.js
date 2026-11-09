import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import config from "../config/bot.config.js";
import theme from "../config/theme.config.js";
import { loadCommands } from "../handlers/command-loader.js";
import { buildMenu } from "../lib/menu.js";

const expectedTitles = [
  "🏠 ɢᴇɴᴇʀᴀʟ",
  "🧠 ᴀɪ ᴄʜᴀᴛ",
  "🎨 ᴀɪ ᴍᴇᴅɪᴀ",
  "📰 ɴᴇᴡs ᴅᴇsᴋ",
  "👥 ɢʀᴏᴜᴘ ᴛᴏᴏʟs",
  "📥 ᴅᴏᴡɴʟᴏᴀᴅs",
  "🎮 ғᴜɴ ɢᴀᴍᴇs",
  "🎉 ғᴜɴ ᴍɪx",
  "🌸 ᴀɴɪᴍᴇ ɪɴғᴏ",
  "🖼 ᴀɴɪᴍᴇ ᴀʀᴛ",
  "🎞 ᴀɴɪᴍᴇ ɢɪғs",
  "💞 ᴀɴɪᴍᴇ ʀᴇᴀᴄᴛɪᴏɴs",
  "⚡ ᴀɴɪᴍᴇ ᴍᴏᴠᴇs",
  "🖼 ᴄᴀɴᴠᴀs ᴛᴏᴏʟs",
  "🛠️ ᴍᴇᴅɪᴀ ᴛᴏᴏʟs",
  "🔒 ᴄʜᴀᴛ ᴘʀɪᴠᴀᴄʏ",
  "📱 sᴛᴀᴛᴜs ᴛᴏᴏʟs",
  "👑 ᴏᴡɴᴇʀ ᴛᴏᴏʟs"
];

test("all selected public commands are loaded without collisions", async () => {
  const { commands, lookup } = await loadCommands(path.resolve("commands"));
  const count = category => commands.filter(command => command.category === category).length;

  assert.equal(count("General"), 11);
  assert.equal(count("AI & Chat"), 11);
  assert.equal(count("AI Media"), 7);
  assert.equal(count("News"), 11);
  assert.equal(count("Group"), 14);
  assert.equal(count("Downloads"), 9);
  assert.equal(count("Games"), 9);
  assert.equal(count("Fun"), 17);
  assert.equal(count("Anime Info"), 16);
  assert.equal(count("Anime Rankings"), 11);
  assert.equal(count("Anime Random"), 4);
  assert.equal(count("Anime Tools"), 1);
  assert.equal(count("Anime Images"), 4);
  assert.equal(count("Anime GIFs"), 52);
  assert.equal(count("Canvas"), 2);
  assert.equal(count("Media & Tools"), 1);
  assert.equal(count("Chat & Privacy"), 1);
  assert.equal(count("Status"), 2);
  assert.equal(count("Owner"), 1);
  assert.equal(commands.length, 184);

  for (const name of [
    "menu", "help", "ping", "alive", "owner", "support", "time", "date", "version", "jid", "whoami",
    "ai", "ask", "gpt", "chatgpt", "mathgpt", "deepseek", "translate", "summarize", "fable5", "qwen", "deepseek2",
    "flux", "pollination", "tts", "tts2", "tts3", "tts4", "tts5",
    "news", "aljazeera", "cnn", "bbc", "guardian", "npr", "nytimes", "foxnews", "skynews", "dw", "punchnews",
    "welcome", "goodbye", "groupinfo", "groupjid", "getgcpp", "groupcount", "groupstats", "admins", "tagall", "link", "groupname", "groupdesc", "close", "open",
    "aio", "fb", "twitter", "instagram", "ytmp4", "tiktok", "play2", "ytsearch", "video",
    "calc", "poll", "coinflip", "dice", "8ball", "choose", "trivia", "riddle", "activity", "pokemon",
    "joke", "dadjoke", "progjoke", "chuck", "fact2", "catfact", "dog", "cat", "fox", "advice", "quote2", "meme", "numfact", "history", "wiki", "nasa",
    "animemenu", "anime", "manga", "character", "charpic", "staff", "studio", "recommend", "episodes", "animechars", "trailer", "pictures", "streaming", "review", "genres", "genre",
    "topanime", "topmanga", "popular", "favorite", "airing", "upcoming", "trending", "season", "topchars", "schedule", "nextep",
    "randomanime", "randommanga", "randomchar", "animequote", "whatanime", "waifu2", "husbando", "neko", "kitsune",
    "angry", "baka", "bleh", "blowkiss", "blush", "bored", "carry", "clap", "confused", "cry", "cuddle", "dance", "facepalm", "feed", "handhold", "handshake", "happy", "highfive",
    "hug", "kabedon", "kiss", "lappillow", "laugh", "lurk", "nod", "nom", "nope", "nya", "pat", "peck", "poke", "pout", "run", "salute", "shake",
    "shocked", "shrug", "sip", "sleep", "smile", "smug", "spin", "stare", "teehee", "think", "thumbsup", "tickle", "wag", "wave", "wink", "yawn", "yeet",
    "wndwqute", "canvasquote", "lyrics", "privacy", "statusdraft", "statusideas", "runtime"
  ]) {
    assert.ok(lookup.has(name), "missing command " + name);
  }
});

test("sensitive, invasive and channel-specific commands are not registered", async () => {
  const { lookup } = await loadCommands(path.resolve("commands"));
  for (const name of [
    "channel", "kick", "add", "promote", "demote", "revoke", "resetlink",
    "onlineusers", "leave", "addmeta", "removemeta", "fakemsg",
    "antidelete", "antidel", "antiedit", "readreceipt", "statusreact", "statusreactmode",
    "statusreactkeys", "autostatus", "sendvv", "vvinfo", "vv", "tiktokstalk",
    "fakettc", "meme2", "fakeff", "fakeffduo", "ffgirl", "unsend", "edit",
    "block", "unblock", "disappear", "kick2", "bite", "bonk", "shoot", "slap", "tableflip"
  ]) {
    assert.equal(lookup.has(name), false, "excluded command was registered: " + name);
  }
  assert.equal(lookup.get("punch")?.category, "News", "the short Punch Nigeria news alias must remain a news command");
  assert.equal(theme.sections.some(section => section.key === "Channel"), false);
});

test("all 18 section titles appear in the reference order with no Channel section", async () => {
  const { commands } = await loadCommands(path.resolve("commands"));
  const menu = buildMenu({ commands, config, theme });
  const positions = expectedTitles.map(title => menu.indexOf(title));

  assert.equal(theme.sections.length, 18);
  assert.ok(positions.every(position => position >= 0));
  assert.ok(positions.every((position, index) => index === 0 || positions[index - 1] < position));
  assert.equal(menu.includes("📢 ᴄʜᴀɴɴᴇʟ"), false);
  for (const command of ["news", "groupinfo", "aio", "trivia", "joke", "anime", "waifu2", "wave", "wndwqute", "lyrics", "privacy", "statusdraft", "runtime"]) {
    assert.ok(menu.includes(config.prefix + command), "menu does not display " + command);
  }
});
