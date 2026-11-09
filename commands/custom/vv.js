import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { POWERED_FOOTER } from "../../lib/api-client.js";
import { withChannelAttribution } from "../../lib/channel.js";
import { getQuotedKey, getQuotedMessage, unwrapMessage } from "../../lib/utils.js";

// unwrapMessage already peels viewOnceMessage / viewOnceMessageV2 /
// viewOnceMessageV2Extension, so this sees the real media underneath.
function viewOnceMedia(message) {
  const body = unwrapMessage(message);
  if (body.imageMessage) return { kind: "image", media: body.imageMessage };
  if (body.videoMessage) return { kind: "video", media: body.videoMessage };
  if (body.audioMessage) return { kind: "audio", media: body.audioMessage };
  if (body.documentMessage) return { kind: "document", media: body.documentMessage };
  return null;
}

function hasViewOnceWrapper(message) {
  return Object.keys(message || {}).some(key => /viewOnceMessage/i.test(key));
}

const MAX_RECOVERED_MEDIA_ENTRIES = 50;
const MAX_RECOVERED_MEDIA_BYTES = 64 * 1024 * 1024;
const recoveredMediaCache = new Map();
let recoveredMediaBytes = 0;

function recoveredMediaKey(key) {
  return key && key.remoteJid && key.id ? String(key.remoteJid) + ":" + String(key.id) : "";
}

function getCachedRecoveredMedia(key) {
  const cacheKey = recoveredMediaKey(key);
  const entry = cacheKey && recoveredMediaCache.get(cacheKey);
  if (!entry) return null;
  // Refresh insertion order to keep frequently reused media available.
  recoveredMediaCache.delete(cacheKey);
  recoveredMediaCache.set(cacheKey, entry);
  return entry.result;
}

function rememberRecoveredMedia(key, result) {
  const cacheKey = recoveredMediaKey(key);
  const buffer = result && result.buffer;
  if (!cacheKey || !Buffer.isBuffer(buffer) || !buffer.length || buffer.length > MAX_RECOVERED_MEDIA_BYTES) return;

  const previous = recoveredMediaCache.get(cacheKey);
  if (previous) {
    recoveredMediaBytes -= previous.size;
    recoveredMediaCache.delete(cacheKey);
  }
  recoveredMediaCache.set(cacheKey, { result, size: buffer.length });
  recoveredMediaBytes += buffer.length;

  while (recoveredMediaCache.size > MAX_RECOVERED_MEDIA_ENTRIES ||
         recoveredMediaBytes > MAX_RECOVERED_MEDIA_BYTES) {
    const oldestKey = recoveredMediaCache.keys().next().value;
    const oldest = recoveredMediaCache.get(oldestKey);
    if (!oldest) break;
    recoveredMediaBytes -= oldest.size;
    recoveredMediaCache.delete(oldestKey);
  }
}

async function recoverViewOnce(ctx) {
  // Resolve the original key first, then consult the successful-recovery cache
  // before relying on WhatsApp to include the complete quoted media payload.
  const key = getQuotedKey(ctx.msg, ctx.sock);
  const cachedResult = getCachedRecoveredMedia(key);
  if (cachedResult) return cachedResult;

  const quoted = getQuotedMessage(ctx.msg);
  if (!quoted) {
    return { error: "Reply to a view-once image, video, voice note or document with " + ctx.config.prefix + ctx.command + "." };
  }

  const found = viewOnceMedia(quoted);
  if (!found) {
    return {
      error: hasViewOnceWrapper(quoted)
        ? "That view-once message carries no downloadable media (view-once stickers and text are not supported)."
        : "The replied-to message is not view-once media."
    };
  }

  // Keep Baileys' own re-upload request enabled for media not yet in our cache.
  let buffer;
  try {
    buffer = await downloadMediaMessage(
      { key, message: quoted, messageTimestamp: ctx.msg.messageTimestamp },
      "buffer",
      {},
      { reuploadRequest: ctx.sock.updateMediaMessage }
    );
  } catch (error) {
    const detail = String(error && error.message || error || "unknown download error").slice(0, 160);
    return {
      error: "I couldn't download this media (Baileys: " + detail +
        "). That does not prove it is permanently unavailable. Try again while the original sender is online."
    };
  }

  const result = { ...found, buffer };
  rememberRecoveredMedia(key, result);
  return result;
}

export function viewOncePayload(result) {
  const content = { [result.kind]: result.buffer };
  const caption = String(result.media.caption || "").trim();

  if (["image", "video", "document"].includes(result.kind) && caption) content.caption = caption.slice(0, 1000);
  if (result.kind === "audio") {
    content.mimetype = result.media.mimetype || "audio/mpeg";
    content.ptt = Boolean(result.media.ptt);
  }
  if (result.kind === "document") {
    content.mimetype = result.media.mimetype || "application/octet-stream";
    content.fileName = String(result.media.fileName || "view-once").slice(0, 180);
  }
  return content;
}

export function buildViewOnceCaption(result) {
  const originalCaption = String((result && result.media && result.media.caption) || "").trim().slice(0, 750);
  return [
    "Media extracted from view-once successfully ✅",
    ...(originalCaption ? [originalCaption] : []),
    POWERED_FOOTER
  ].join("\n\n");
}

async function sendBrandedViewOnce(ctx, result) {
  const payload = viewOncePayload(result);
  const caption = buildViewOnceCaption(result);

  // WhatsApp audio messages do not support a normal caption, so send the
  // attributed confirmation/footer as a companion text after the audio.
  if (result.kind === "audio") {
    await ctx.send(withChannelAttribution(ctx.config, payload, true));
    await ctx.send(withChannelAttribution(ctx.config, { text: caption }, true));
    return;
  }

  payload.caption = caption;
  await ctx.send(withChannelAttribution(ctx.config, payload, true));
}

export default [
  {
    name: "vv",
    category: "Media & Tools",
    description: "Recover a replied-to view-once media message into this chat.",
    run: async ctx => {
      const result = await recoverViewOnce(ctx);
      if (result.error) {
        await ctx.reply("⚠️ " + result.error);
        return;
      }
      await sendBrandedViewOnce(ctx, result);
    }
  },
  {
    name: "vv2",
    category: "Media & Tools",
    description: "Recover a replied-to view-once media message into your DM with the bot.",
    run: async ctx => {
      const result = await recoverViewOnce(ctx);
      if (result.error) {
        await ctx.reply("⚠️ " + result.error);
        return;
      }

      const target = ctx.senderJid;
      if (!target) {
        await ctx.reply("⚠️ Could not resolve your WhatsApp ID for the DM.");
        return;
      }

      await ctx.react("✅");
      await ctx.sock.sendMessage(target, viewOncePayload(result));
    }
  }
];
