const digits = value => String(value || "").replace(/\D/g, "");

const ownerNumbers = [...new Set([
  digits(process.env.OWNER_NUMBER),
  digits(process.env.OWNER_NUMBER_2)
].filter(Boolean))];

const prefix = String(process.env.PREFIX || ".").trim();

export default Object.freeze({
  name: String(process.env.BOT_NAME || "FEI XMD").trim() || "FEI XMD",
  version: String(process.env.BOT_VERSION || "1.0.0").trim() || "1.0.0",
  prefix: prefix && !/\s/.test(prefix) ? prefix : ".",
  ownerName: String(process.env.OWNER_NAME || "Benfei Tech").trim() || "Benfei Tech",
  ownerNumbers,
  defaultMode: String(process.env.BOT_MODE || "public").toLowerCase() === "private" ? "private" : "public",
  sessionDirectory: String(process.env.FEI_SESSION_DIR || "./auth_info_baileys").trim() || "./auth_info_baileys",
  dataDirectory: String(process.env.FEI_DATA_DIR || "./data").trim() || "./data",
  logLevel: String(process.env.LOG_LEVEL || "info").trim().toLowerCase(),
  browser: "Chrome"
});
