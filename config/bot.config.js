const digits = value => String(value || "").replace(/\D/g, "");

const configuredOwnerNumber = digits(process.env.OWNER_NUMBER);
const ownerNumber = configuredOwnerNumber || "2349060715145";

const channel = Object.freeze({
  name: "𝐁𝐄𝐍𝐅𝐄𝐈 𝐓𝐄𝐂𝐇 ™",
  jid: "120363430518511561@newsletter"
});

export default Object.freeze({
  name: String(process.env.BOT_NAME || "FEI XMD").trim() || "FEI XMD",
  version: String(process.env.BOT_VERSION || "1.0.0").trim() || "1.0.0",
  prefix: String(process.env.PREFIX || ".").trim() || ".",
  ownerName: String(process.env.OWNER_NAME || "Benfei Tech").trim() || "Benfei Tech",
  ownerNumber,
  ownerNumbers: Object.freeze([ownerNumber]),
  defaultMode: String(process.env.BOT_MODE || "public").toLowerCase() === "private" ? "private" : "public",
  sessionDirectory: String(process.env.FEI_SESSION_DIR || "./auth_info_baileys").trim() || "./auth_info_baileys",
  dataDirectory: String(process.env.FEI_DATA_DIR || "./data").trim() || "./data",
  logLevel: String(process.env.LOG_LEVEL || "info").trim().toLowerCase(),
  browser: "Chrome",
  channel,
  imageUrl: String(
    process.env.BOT_IMAGE_URL ||
    "https://res.cloudinary.com/dqqyvozdw/image/upload/v1792848652/arbeimjfqkkfpn9zvfhf.png"
  ).trim(),
  botUrl: String(process.env.BOT_URL || "https://fei-xmd.benfeilab.com").trim()
});
