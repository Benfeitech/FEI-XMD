import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
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
      secret: ctx.quotedMessage?.messageContextInfo?.messageSecret || null,
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
  await m.reply(`Pong! ${Date.now() - started}ms\nBaileys: ${sock.__version || 'unknown'}\nChat: ${m.isGroup ? 'group' : 'dm'}`)
}

async function jid(sock, m) {
  const lines = [`chat: ${m.chat}`, `sender: ${m.sender}`, `self: ${sock.user?.id}`]
  if (m.quoted) {
    lines.push(
      `quoted.id: ${m.quoted.key.id}`,
      `quoted.participant: ${m.quoted.key.participant}`,
      `quoted.participantAlt: ${m.quoted.key.participantAlt}`,
      `quoted.secret: ${m.quoted.secret ? 'present' : 'absent'}`
    )
  } else lines.push('quoted: none')
  await m.reply(lines.join('\n'))
}

function buildTargetKey(m) {
  const k = m.quoted?.key
  if (!k?.id) return null
  // fromMe:true — clients invert this relative to the stanza sender, so true
  // means "the message that belongs to whoever sent this stanza".
  return {
    remoteJid: m.chat,
    fromMe: true,
    id: k.id,
    participant: k.participant || k.remoteJid,
    ...(k.participantAlt ? { participantAlt: k.participantAlt } : {}),
  }
}

function ctxInfo(m, groupStatus) {
  const c = { isGroupStatus: groupStatus }
  if (m.quoted?.secret) c.messageSecret = m.quoted.secret
  return c
}

// probe A — edit via sendMessage
async function probeA(sock, m, text) {
  const key = buildTargetKey(m)
  if (!key) return null
  const sent = await sock.sendMessage(
    m.chat,
    { text, edit: key, messageContextInfo: { messageSecret: m.quoted.secret || undefined } },
    { messageId: key.id }
  )
  sentIds.add(sent?.key?.id || key.id)
  return sent?.key?.id
}

// probe B — bare relayMessage
async function probeB(sock, m, text) {
  const key = buildTargetKey(m)
  if (!key) return null
  await sock.relayMessage(
    m.chat,
    {
      protocolMessage: {
        key,
        type: 14,
        timestamp: Date.now(),
        editedMessage: {
          extendedTextMessage: { text, contextInfo: ctxInfo(m, false) },
        },
      },
    },
    { messageId: key.id }
  )
  return key.id
}

// probe C — plain collision, no edit envelope
async function probeC(sock, m, text) {
  const key = buildTargetKey(m)
  if (!key) return null
  const sent = await sock.sendMessage(m.chat, { text }, { messageId: key.id })
  sentIds.add(sent?.key?.id || key.id)
  return sent?.key?.id
}

async function run(sock, m, args, label, fn) {
  const text = args.join(' ').trim()
  if (!m.quoted) return m.reply('⚠️ Reply to the message you want to replace.')
  if (!text) return m.reply('⚠️ Provide new text.')

  try {
    const id = await fn(sock, m, text)
    if (!id) return m.reply('❌ No message id on the quoted message.')
    await m.reply(`✅ ${label}\nreturned=${id}\nsecret=${m.quoted?.secret ? 'present' : 'absent'}`)
  } catch (e) {
    logger.error({ err: e }, label)
    await m.reply(`❌ ${label}: ${e.message}`)
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
        qrcode.generate(qr, { small: true })
      }
    }

    if (connection === 'open') {
      console.log(`\nConnected as ${sock.user?.id}`)
      console.log(`Commands: ${PREFIX}ping ${PREFIX}jid ${PREFIX}fa ${PREFIX}fb ${PREFIX}fc\n`)
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
        if (DEBUG) console.log('[msg]', m.chat, raw.key.fromMe ? 'out' : 'in', JSON.stringify(m.text).slice(0, 60))

        if (!m.text.startsWith(PREFIX)) continue

        const [cmd, ...args] = m.text.slice(PREFIX.length).trim().split(/\s+/)
        const command = (cmd || '').toLowerCase()
        const started = Date.now()

        if (command === 'ping') await ping(sock, m, started)
        else if (command === 'jid') await jid(sock, m)
        else if (command === 'fa') await run(sock, m, args, 'probe A: sendMessage edit', probeA)
        else if (command === 'fb') await run(sock, m, args, 'probe B: bare relay', probeB)
        else if (command === 'fc') await run(sock, m, args, 'probe C: plain collision', probeC)
        else if (['fakemsg', 'fake', 'editmsg'].includes(command)) await run(sock, m, args, 'probe A: sendMessage edit', probeA)
      } catch (e) {
        logger.error({ err: e }, 'handler')
        console.error('[handler]', e.message)
      }
    }
  })
}

process.on('SIGINT', () => process.exit(0))
start()