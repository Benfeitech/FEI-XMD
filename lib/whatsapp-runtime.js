import path from "node:path";
import { EventEmitter } from "node:events";
import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestWaWebVersion,
  useMultiFileAuthState
} from "@whiskeysockets/baileys";
import pino from "pino";

import { resolveCommandInput } from "../handlers/command-loader.js";
import { getMessageSender, messageText, numberFromJid } from "./message-utils.js";
import { isOwnerNumber } from "./owner-utils.js";

const MAX_PROCESSED_IDS = 2000;
const VERSION_LOOKUP_TIMEOUT_MS = 8000;
const QR_READY_TIMEOUT_MS = 25000;

function isPaired(creds) {
  return Boolean(creds && (creds.registered || creds.account));
}

function statusCodeFrom(error) {
  return Number(error?.output?.statusCode || error?.data?.statusCode || error?.statusCode || 0);
}

function createDeferred() {
  let resolve;
  const promise = new Promise(done => {
    resolve = done;
  });
  return { promise, resolve };
}

export function createWhatsAppRuntime({
  config,
  theme,
  commands = [],
  lookup = new Map(),
  sessionDirectory: requestedSessionDirectory,
  sessionId = "primary",
  socketFactory = makeWASocket
} = {}) {
  if (!config) throw new TypeError("Bot configuration is required.");

  const events = new EventEmitter();
  const sessionDirectory = path.resolve(String(
    requestedSessionDirectory || config.sessionDirectory || "./auth_info_baileys"
  ));
  const logger = pino({ level: config.logLevel || process.env.LOG_LEVEL || "info" });
  const processedIds = new Set();

  let authState = null;
  let saveCreds = null;
  let socket = null;
  let status = "idle";
  let connected = false;
  let stopped = false;
  let startPromise = null;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  let lastError = "";
  let qrSeen = false;
  const qrReady = createDeferred();
  let messageQueue = Promise.resolve();

  function getStatus() {
    const self = socket?.user?.id || socket?.user?.lid || authState?.creds?.me?.id || "";
    return {
      id: String(sessionId),
      status,
      paired: isPaired(authState?.creds),
      connected,
      phoneNumber: numberFromJid(self),
      reconnectAttempts,
      lastError
    };
  }

  function rememberProcessed(id) {
    if (!id) return false;
    if (processedIds.has(id)) return true;
    processedIds.add(id);
    if (processedIds.size > MAX_PROCESSED_IDS) {
      const oldest = processedIds.values().next().value;
      processedIds.delete(oldest);
    }
    return false;
  }

  function scheduleReconnect(error) {
    if (stopped || reconnectTimer) return;
    lastError = String(error?.message || error || "Connection closed");
    connected = false;
    status = "reconnecting";
    const delayMs = Math.min(30000, 1000 * (2 ** Math.min(reconnectAttempts, 5)));
    reconnectAttempts += 1;
    events.emit("reconnecting", { delayMs, attempts: reconnectAttempts, error: lastError });
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      void connect().catch(connectError => {
        lastError = String(connectError?.message || connectError);
        events.emit("runtimeError", connectError);
        scheduleReconnect(connectError);
      });
    }, delayMs);
  }

  async function dispatchMessage(msg, activeSocket) {
    if (!msg?.message || !msg?.key?.remoteJid) return;
    const jid = String(msg.key.remoteJid);
    if (jid === "status@broadcast" || jid === "newsletter") return;
    const messageId = String(msg.key.id || "");
    if (messageId && rememberProcessed(jid + ":" + messageId)) return;

    const text = messageText(msg.message);
    const prefix = String(config.prefix || ".");
    if (!text || !prefix || !text.startsWith(prefix)) return;

    const parsed = resolveCommandInput(text.slice(prefix.length).trim(), lookup);
    if (!parsed) return;

    const senderJid = getMessageSender(msg, activeSocket);
    const context = {
      sock: activeSocket,
      msg,
      jid,
      senderJid,
      text: text.slice(prefix.length).trim(),
      commandName: parsed.commandName,
      args: parsed.args,
      config,
      theme,
      sessionId,
      owner: isOwnerNumber(config, senderJid),
      reply: async (content, options = {}) => {
        const payload = typeof content === "string" ? { text: content } : content;
        if (!payload || typeof payload !== "object") {
          throw new TypeError("A reply must be text or a WhatsApp message payload.");
        }
        const { quoted, ...sendOptions } = options;
        return activeSocket.sendMessage(jid, payload, {
          ...sendOptions,
          ...(quoted === false ? {} : { quoted: quoted || msg })
        });
      }
    };

    try {
      await parsed.definition.run(context);
    } catch (error) {
      logger.error({ err: error, command: parsed.commandName, chat: jid }, "Command execution failed");
      events.emit("runtimeError", error);
      await context.reply("The command could not be completed. Please try again.").catch(() => {});
    }
  }

  function queueMessages(upsert, activeSocket) {
    if (!upsert || upsert.type !== "notify" || !Array.isArray(upsert.messages)) return;
    messageQueue = messageQueue.then(async () => {
      for (const msg of upsert.messages) {
        if (stopped || socket !== activeSocket) break;
        await dispatchMessage(msg, activeSocket);
      }
    }).catch(error => {
      logger.error({ err: error }, "Incoming message queue failed");
      events.emit("runtimeError", error);
    });
  }

  async function connect() {
    if (stopped) return null;
    if (!authState || !saveCreds) throw new Error("Baileys authentication state has not been initialized.");

    status = "connecting";
    let version;
    try {
      const versionInfo = await fetchLatestWaWebVersion({
        signal: AbortSignal.timeout(VERSION_LOOKUP_TIMEOUT_MS)
      });
      if (Array.isArray(versionInfo?.version)) version = versionInfo.version;
      if (versionInfo?.isLatest === false) {
        logger.warn({ error: versionInfo.error?.message }, "Using the Baileys bundled WhatsApp Web version");
      }
    } catch (error) {
      logger.warn({ err: error }, "WhatsApp Web version lookup failed; using the Baileys default version");
    }

    if (stopped) return null;

    const nextSocket = socketFactory({
      ...(version ? { version } : {}),
      auth: authState,
      logger,
      browser: Browsers.windows(String(config.browser || "Chrome")),
      printQRInTerminal: false,
      markOnlineOnConnect: false,
      syncFullHistory: false,
      connectTimeoutMs: 30000,
      keepAliveIntervalMs: 25000,
      defaultQueryTimeoutMs: 60000
    });

    socket = nextSocket;
    nextSocket.ev.on("creds.update", saveCreds);
    nextSocket.ev.on("messages.upsert", update => queueMessages(update, nextSocket));
    nextSocket.ev.on("connection.update", update => {
      if (socket !== nextSocket || stopped) return;

      if (update.qr) {
        qrSeen = true;
        qrReady.resolve(update.qr);
        events.emit("qr", update.qr);
      }

      if (update.connection === "connecting") status = "connecting";

      if (update.connection === "open") {
        connected = true;
        status = "connected";
        reconnectAttempts = 0;
        lastError = "";
        events.emit("connected", getStatus());
      }

      if (update.connection === "close") {
        connected = false;
        const error = update.lastDisconnect?.error;
        const code = statusCodeFrom(error);
        lastError = String(error?.message || "WhatsApp connection closed");

        if (code === DisconnectReason.loggedOut) {
          status = "logged_out";
          events.emit("loggedOut", { status: getStatus(), error });
          return;
        }

        status = "reconnecting";
        scheduleReconnect(error || "WhatsApp connection closed");
      }
    });

    events.emit("socketCreated", { sessionId, socket: nextSocket });
    return nextSocket;
  }

  async function start() {
    if (startPromise) return startPromise;
    stopped = false;
    startPromise = (async () => {
      status = "starting";
      const auth = await useMultiFileAuthState(sessionDirectory);
      authState = auth.state;
      saveCreds = auth.saveCreds;
      await connect();
      return getStatus();
    })().catch(error => {
      startPromise = null;
      status = "error";
      lastError = String(error?.message || error);
      throw error;
    });
    return startPromise;
  }

  async function requestPairingCode(phoneNumber) {
    const phone = String(phoneNumber || "").replace(/\D/g, "");
    if (!/^\d{8,15}$/.test(phone)) {
      throw new Error("Enter a valid WhatsApp number with country code (8–15 digits).");
    }
    if (!socket) throw new Error("The WhatsApp socket is not ready. Start the runtime first.");
    if (isPaired(authState?.creds)) throw new Error("This session is already paired.");

    if (!qrSeen) {
      let timeout;
      try {
        await Promise.race([
          qrReady.promise,
          new Promise((_, reject) => {
            timeout = setTimeout(() => reject(new Error(
              "WhatsApp did not prepare a pairing request in time. Check the connection and try again."
            )), QR_READY_TIMEOUT_MS);
          })
        ]);
      } finally {
        if (timeout) clearTimeout(timeout);
      }
    }

    if (!socket || stopped) throw new Error("The WhatsApp connection stopped before pairing.");
    const code = await socket.requestPairingCode(phone);
    return { code: String(code), phoneNumber: phone };
  }

  async function stop() {
    stopped = true;
    connected = false;
    status = "stopped";
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = null;

    const activeSocket = socket;
    socket = null;
    if (activeSocket) {
      try {
        activeSocket.end(new Error("FEI XMD runtime stopped"));
      } catch (error) {
        logger.debug({ err: error }, "Socket shutdown completed with a warning");
      }
    }
    await messageQueue.catch(() => {});
    events.emit("stopped", getStatus());
  }

  return {
    start,
    stop,
    getStatus,
    requestPairingCode,
    on: (event, listener) => {
      events.on(event, listener);
      return () => events.off(event, listener);
    },
    get socket() {
      return socket;
    },
    get sessionDirectory() {
      return sessionDirectory;
    }
  };
}
