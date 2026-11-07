import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  generateMessageIDV2,
  jidNormalizedUser,
  Browsers,
  DisconnectReason,
} from '@whiskeysockets/baileys'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const PREFIX = process.env.PREFIX || '.'
const AUTH_DIR = process.env.AUTH_DIR || 'auth_info'
const DEBUG = !!process.env.DEBUG
const logger = pino({ level: 'silent' })

const sentIds = new Set()

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

function ask(question) {
  const rl = readline.createInterface({ input, output })
  return rl.question(question).finally(() => rl.close())
}

/* ── message helpers ──────────────────────────────────────────────────────── */

const UNWRAP = [
  'ephemeralMessage', 'viewOnceMessage', 'viewOnceMessageV2',
  'viewOnceMessageV2Extension', 'documentWithCaptionMessage',
]

function unwrap(message) {
  let m = message
  for (let i = 0; i < 4 && m; i++) {
    const key = UNWRAP.find((k) => m[k])
    if (!key) break
    m = m[key]?.message
  }
  return m
}

function extractText(message) {
  const m = unwrap(message)
  if (!m) return ''
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    m.protocolMessage?.editedMessage?.extendedTextMessage?.text ||
    ''
  )
}

function findContextInfo(message) {
  const m = unwrap(message)
  if (!m) return null
  for (const value of Object.values(m)) {
    if (value && typeof value === 'object' && value.contextInfo) return value.contextInfo
  }
  return null
}

function serialize(msg, sock) {
  const chat = msg.key.remoteJid
  const self = jidNormalizedUser(sock.user?.id || '')
  const ctx = findContextInfo(msg.message)
  const sender = msg.key.participant || (msg.key.fromMe ? self : chat)

  let quoted = null
  if (ctx?.quotedMessage) {
    const p = ctx.participant || null
    quoted = {
      key: {
        remoteJid: chat,
        fromMe: !!p && jidNormalizedUser(p) === self,
        id: ctx.stanzaId,
        participant: p,
        ...(ctx.participantAlt ? { participantAlt: ctx.participantAlt } : {}),
      },
      message: ctx.quotedMessage,
    }
  }

  return {
    raw: msg,
    key: msg.key,
    chat,
    sender,
    isGroup: chat.endsWith('@g.us'),
    text: extractText(msg.message),
    quoted,
    reply: async (text) => {
      const r = await sock.sendMessage(chat, { text }, { quoted: msg })
      if (r?.key?.id) sentIds.add(r.key.id)
      return r
    },
  }
}

/* ── commands ─────────────────────────────────────────────────────────────── */

async function ping(sock, m, started) {
  const latency = Date.now() - started
  await m.reply(
    `Pong! ${latency}ms\nBaileys: ${sock.__version || 'unknown'}\nChat: ${m.isGroup ? 'group' : 'dm'}`
  )
}

async function jid(sock, m) {
  const lines = [
    `chat: ${m.chat}`,
    `sender: ${m.sender}`,
    `self: ${sock.user?.id}`,
  ]
  if (m.quoted) {
    lines.push(`quoted.id: ${m.quoted.key.id}`, `quoted.participant: ${m.quoted.key.participant}`)
  }
  await m.reply(lines.join('\n'))
}

// ── fakemsg / fake / editmsg ───────────────────────────────────────────────
async function fakemsg(sock, m, args) {
  const newText = args.join(' ').trim()
  const quoted = m.quoted

  if (!quoted) return m.reply('⚠️ Reply to the message you want to replace.')
  if (!newText) return m.reply('⚠️ Provide new text.\n\nExample: .fakemsg This is the fake message')

  const targetId = quoted.key.id
  if (!targetId) return m.reply('❌ No message id on the quoted message.')

  // fromMe:false is correct relative to us AND to every recipient.
  // The only device it is wrong on is the author's, which is why they keep
  // their original text. participant is required for group resolution.
  const targetKey = {
    remoteJid: m.chat,
    fromMe: false,
    id: targetId,
    participant: quoted.key.participant || quoted.key.remoteJid,
    ...(quoted.key.participantAlt ? { participantAlt: quoted.key.participantAlt } : {}),
  }

  try {
    // 1) anchor: a throwaway we own, hidden via isGroupStatus
    const anchorId = generateMessageIDV2(sock.user?.id)
    sentIds.add(anchorId)
    await sock.relayMessage(
      m.chat,
      { extendedTextMessage: { text: '', contextInfo: { isGroupStatus: true } } },
      { messageId: anchorId }
    )

    // 2) the shell: delivered under the TARGET's id, targeting the TARGET's key
    await sock.relayMessage(
      m.chat,
      {
        protocolMessage: {
          key: targetKey,
          type: 14, // proto.Message.ProtocolMessage.Type.MESSAGE_EDIT
          timestamp: Date.now(),
          editedMessage: {
            extendedTextMessage: {
              text: newText,
              contextInfo: { isGroupStatus: false },
            },
          },
        },
      },
      { messageId: targetId }
    )

    // 3) settle, then bin the anchor ONLY. Never revoke the target.
    await delay(600)
    await sock
      .sendMessage(m.chat, {
        delete: { remoteJid: m.chat, fromMe: true, id: anchorId, participant: sock.user?.id },
      })
      .catch(() => {})

    await m.reply('✅ Replaced.')
  } catch (e) {
    logger.error({ err: e }, 'fakemsg failed')
    await m.reply(`❌ Failed: ${e.message}`)
  }
}

/* ── socket ───────────────────────────────────────────────────────────────── */

let pairingRequested = false

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)

  let version
  try {
    ;({ version } = await fetchLatestBaileysVersion())
  } catch {
    version = [2, 3000, 1035194821]
  }

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    browser: Browsers.ubuntu('Chrome'),
    printQRInTerminal: false,
    markOnlineOnConnect: false,
    syncFullHistory: false,
  })

  sock.__version = version.join('.')

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr && !state.creds.registered && !pairingRequested) {
      pairingRequested = true
      try {
        const raw = await ask('\nEnter WhatsApp number (country code, digits only, no + or spaces): ')
        const phone = raw.replace(/\D/g, '')
        if (phone.length < 10) throw new Error('number too short — include the country code')

        const code = await sock.requestPairingCode(phone)
        console.log(`\n  Pairing code:  ${code}\n`)
        console.log('  On your phone: WhatsApp > Settings > Linked devices > Link with phone number\n')
      } catch (e) {
        console.error(`\nPairing code failed: ${e.message}\n`)
        console.log('Falling back to QR — scan it in Linked devices > Link a device:\n')
        qrcode.generate(qr, { small: true })
      }
    }

    if (connection === 'open') {
      console.log(`\nConnected as ${sock.user?.id}`)
      console.log(`Prefix: "${PREFIX}"   Commands: ${PREFIX}ping  ${PREFIX}jid  ${PREFIX}fakemsg\n`)
    }

    if (connection === 'close') {
      const status = lastDisconnect?.error?.output?.statusCode
      if (status === DisconnectReason.loggedOut) {
        console.log('Logged out. Delete the auth folder and restart.')
        process.exit(1)
      }
      console.log(`Connection closed (${status}). Reconnecting…`)
      pairingRequested = false
      setTimeout(start, 2000)
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const raw of messages) {
      try {
        if (!raw.message) continue
        if (raw.key.remoteJid === 'status@broadcast') continue
        if (raw.key.remoteJid === 'newsletter') continue
        if (sentIds.has(raw.key.id)) continue

        const m = serialize(raw, sock)
        if (DEBUG) {
          console.log('[msg]', m.chat, raw.key.fromMe ? 'out' : 'in', JSON.stringify(m.text).slice(0, 60))
        }

        if (!m.text.startsWith(PREFIX)) continue

        const [cmd, ...args] = m.text.slice(PREFIX.length).trim().split(/\s+/)
        const command = (cmd || '').toLowerCase()
        const started = Date.now()

        if (command === 'ping') await ping(sock, m, started)
        else if (command === 'jid') await jid(sock, m)
        else if (['fakemsg', 'fake', 'editmsg'].includes(command)) await fakemsg(sock, m, args)
      } catch (e) {
        logger.error({ err: e }, 'handler')
        console.error('[handler]', e.message)
      }
    }
  })
}

process.on('SIGINT', () => process.exit(0))
start()
