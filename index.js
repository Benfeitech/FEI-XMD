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
import { randomBytes } from 'node:crypto'
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

/* ── helpers ──────────────────────────────────────────────────────────────── */

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
    quoted = {
      key: {
        remoteJid: chat,
        fromMe: !!ctx.participant && jidNormalizedUser(ctx.participant) === self,
        id: ctx.stanzaId,
        participant: ctx.participant || null,
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

/* ── diagnostics ──────────────────────────────────────────────────────────── */

async function diag(sock, m) {
  const out = [
    `self.id:  ${sock.user?.id}`,
    `self.lid: ${sock.user?.lid}`,
    `chat:     ${m.chat}`,
    `sender:   ${m.sender}`,
  ]
  if (!m.quoted) {
    out.push('quoted: none')
    return m.reply(out.join('\n'))
  }
  out.push(`quoted.id: ${m.quoted.key.id}`, `quoted.participant: ${m.quoted.key.participant}`)

  try {
    const meta = await sock.groupMetadata(m.chat)
    out.push(`group: ${meta.subject} (${meta.participants.length} members)`)
    const entry = meta.participants.find(
      (p) => p.id === m.quoted.key.participant || p.phoneNumber === m.quoted.key.participant
    )
    out.push(
      `entry: ${entry ? JSON.stringify({ id: entry.id, phoneNumber: entry.phoneNumber, admin: entry.admin }) : 'NOT FOUND'}`
    )
    const selfEntry = meta.participants.find((p) => p.phoneNumber && sock.user?.id?.startsWith(p.phoneNumber))
    out.push(`selfEntry: ${selfEntry ? JSON.stringify({ id: selfEntry.id, phoneNumber: selfEntry.phoneNumber }) : 'NOT FOUND'}`)
  } catch (e) {
    out.push(`metadata error: ${e.message}`)
  }

  await m.reply(out.join('\n'))
}

/* ── probes ───────────────────────────────────────────────────────────────── */

function baseKey(m) {
  const k = m.quoted?.key
  if (!k?.id) return null
  return { remoteJid: m.chat, fromMe: true, id: k.id, participant: k.participant || k.remoteJid }
}

async function relayEdit(sock, m, text, { participant, secret } = {}) {
  const key = baseKey(m)
  if (!key) return null
  if (participant) key.participant = participant

  const contextInfo = { isGroupStatus: false }
  if (secret) contextInfo.messageSecret = secret

  await sock.relayMessage(
    m.chat,
    {
      protocolMessage: {
        key,
        type: 14,
        timestamp: Date.now(),
        editedMessage: { extendedTextMessage: { text, contextInfo } },
      },
    },
    { messageId: key.id, additionalAttributes: { edit: '1' } }
  )
  return key.id
}

async function resolvePn(sock, m) {
  try {
    const meta = await sock.groupMetadata(m.chat)
    const entry = meta.participants.find((p) => p.id === m.quoted?.key?.participant)
    return entry?.phoneNumber || null
  } catch {
    return null
  }
}

async function run(sock, m, args, label, fn) {
  const text = args.join(' ').trim()
  if (!m.quoted) return m.reply('⚠️ Reply to the message you want to replace.')
  if (!text) return m.reply('⚠️ Provide new text.')
  try {
    const id = await fn(sock, m, text)
    if (!id) return m.reply('❌ No message id on the quoted message.')
    await m.reply(`✅ ${label}\nreturned=${id}`)
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
      console.log(`Commands: ${PREFIX}diag ${PREFIX}fa ${PREFIX}fb ${PREFIX}fc ${PREFIX}fd\n`)
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

        if (command === 'diag') await diag(sock, m)
        else if (command === 'fa') await run(sock, m, args, 'fa: edit attr + lid', (s, mm, t) => relayEdit(s, mm, t))
        else if (command === 'fb')
          await run(sock, m, args, 'fb: edit attr + pn', async (s, mm, t) => {
            const pn = await resolvePn(s, mm)
            return relayEdit(s, mm, t, { participant: pn || undefined })
          })
        else if (command === 'fc')
          await run(sock, m, args, 'fc: edit attr + random secret', (s, mm, t) =>
            relayEdit(s, mm, t, { secret: randomBytes(32) })
          )
        else if (command === 'fd')
          await run(sock, m, args, 'fd: plain + edit attr', async (s, mm, t) => {
            const key = baseKey(mm)
            if (!key) return null
            const sent = await s.sendMessage(mm.chat, { text: t }, { messageId: key.id, additionalAttributes: { edit: '1' } })
            sentIds.add(sent?.key?.id || key.id)
            return sent?.key?.id
          })
        else if (['fakemsg', 'fake', 'editmsg'].includes(command))
          await run(sock, m, args, 'fa: edit attr + lid', (s, mm, t) => relayEdit(s, mm, t))
      } catch (e) {
        logger.error({ err: e }, 'handler')
        console.error('[handler]', e.message)
      }
    }
  })
}

process.on('SIGINT', () => process.exit(0))
start()