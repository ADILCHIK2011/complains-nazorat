# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Telegram bot ("Soliq Oliy Maktabi — Murojaat nuqtasi") that collects citizen
complaints/suggestions (with the sender's real name and phone number, captured automatically via
Telegram's contact-share button) and relays them to a single internal CEO reviewer, who replies
manually. Node.js + Telegraf + MongoDB Atlas + Groq (Llama 3.3 family, used only to translate the
CEO's reply into the citizen's language). All in-repo comments/UI strings are Uzbek; this doc is
English for the assistant's benefit.

## Commands

```bash
npm install       # install deps
npm start         # run the bot (node src/index.js)
npm run dev       # run with --watch (auto-restart on file change)
```

There is no test suite, lint config, or build step — this is a small long-polling worker process.
`.env` (gitignored) must be populated before running; see `.env.example` for the required keys
(`TELEGRAM_BOT_TOKEN`, `CEO_CHAT_ID`, `MONGODB_URI`, `MONGODB_DB`, `GROQ_API_KEY`, `GROQ_MODEL`).
`src/config.js` throws at startup if a required var is missing.

The bot does not open an HTTP port — it uses Telegram long polling. Deploy target must be a
**worker/background service** (Railway/Render), not a web service (see `Procfile`).

## Architecture

```
src/
  index.js                    entry point: connects Mongo, builds bot, sets per-language
                               command menus, sends CEO its persistent keyboard, launches polling
  config.js                   reads/validates .env
  i18n/                       4 locales: uz, uz-cyrl (Cyrillic), ru, en — see locales/*.json
  services/groq.js            translateAnswer() only — translates the CEO's Uzbek reply into
                               the citizen's chosen language
  db/
    mongo.js                  Mongo connection singleton (connect/getDb/disconnect)
    userModel.js               `users` collection — language, fullName, phoneNumber
    complaintModel.js           `complaints` collection — full complaint lifecycle
  bot/
    index.js                  Telegraf instance: session middleware, CEO-message interceptor,
                               command/action/text routing
    keyboards.js               inline keyboards, contact-request keyboard, CEO's persistent keyboard
    ceoNotify.js               sendComplaintToCeo() — posts a complaint to the CEO chat (1 message)
    handlers/userFlow.js        citizen-side conversation state machine (incl. contact capture)
    handlers/ceoReply.js        routes the CEO's reply back to the right citizen
    handlers/ceoNavbat.js       /navbat — re-lists all pending (unanswered) complaints
    handlers/ceoReport.js       "📊 Hisobot" — generates a kunlik/haftalik/oylik Excel export
  utils/
    rateLimiter.js             in-memory per-chatId submission rate limit
    time.js                    relative-time formatting for /navbat + getDateRange() for reports
```

### Two entirely separate conversation flows, dispatched by chat id

`bot/index.js` installs a middleware that checks `ctx.chat.id === config.ceoChatId` on every
incoming message *before* any other handler runs. If it matches (and isn't `/navbat` or the
"📊 Hisobot" button text), the message is routed straight to `handleCeoMessage` and normal citizen
routing is skipped entirely. Everyone else goes through the citizen state machine in `userFlow.js`.
There is exactly one CEO chat id, hardcoded via `config.ceoChatId` — this is not a multi-admin
system.

**Security note:** `bot.command('navbat', ...)` and `bot.hears('📊 Hisobot', ...)` are *not*
chat-scoped by Telegraf itself — any user could otherwise trigger them in their own chat. Both
`handleNavbatCommand` and `handleHisobotButton`/`handleReportPeriod` guard themselves with an
explicit `ctx.chat.id !== config.ceoChatId` check. Since complaints now carry the citizen's real
name and phone number, do not remove or weaken this check — it's the only thing stopping any
Telegram user from pulling every complainant's PII into an Excel file.

### Citizen flow (session-based state machine)

Session state (`ctx.session.stage`) lives in Telegraf's **in-memory** default session store —
not Mongo, not Redis. A bot restart mid-conversation loses the citizen's in-progress stage; they
must send `/start` again. This is a known, accepted limitation (see README "Bilinadigan cheklov")
— already-submitted complaints in Mongo are unaffected. Stages: `idle` → `choosing_language` →
`awaiting_contact` (skipped for returning users who already shared contact) → `choosing_topic` →
`awaiting_complaint` → back to `idle` after submission.

Identity capture: right after choosing a language, `handleLanguageChosen` checks Mongo for an
existing `fullName`/`phoneNumber` on the user. If missing, it sends a one-tap Telegram
contact-share button (`contactRequestKeyboard`, via `Markup.button.contactRequest`) — never a
typed prompt. `handleContactShared` (bound to `bot.on('contact', ...)`) validates the shared
contact belongs to the sender (`contact.user_id === ctx.from.id`) before persisting it, then
caches it on `ctx.session.fullName`/`phoneNumber` for the rest of the session so complaint
creation doesn't need another DB round-trip.

There is no AI analysis step anymore — the complaint text goes to the CEO as-is.

### Reply routing via Telegram's reply-to mechanism (the core trick)

There's no "conversation ID" concept exposed to the CEO. Instead: every complaint sent to the CEO
produces a single Telegram message, and `complaintModel.setCeoMessageId()` stores that message id
on the complaint document. When the CEO replies to it, `ceoReply.js` calls
`findPendingByCeoMessageId(replyTo.message_id)` to look up which complaint it belongs to, then
delivers the CEO's answer to that complaint's `chatId` — translating it first via
`translateAnswer()` unless the citizen's language is `uz` (the CEO always types in Uzbek). If the
CEO sends a message without replying to anything, they get a warning telling them to reply
properly — this is a hard requirement, not a hint.

`/navbat` (`ceoNavbat.js`) re-sends every still-`pending` complaint via the same
`sendComplaintToCeo()` used for new complaints, which **overwrites** the stored message id —
by design, so the CEO can always reply to whichever copy they're currently looking at, even after
scrollback. Don't add a code path that sends a complaint to the CEO without going through
`sendComplaintToCeo()`, or reply routing for it will break silently.

### Excel reports ("📊 Hisobot")

`handlers/ceoReport.js` builds the workbook synchronously from MongoDB — no AI involved.
`utils/time.js#getDateRange(period)` computes calendar-aligned ranges: `daily` = today so far,
`weekly` = last 7 calendar days including today, `monthly` = this calendar month so far.
`complaintModel.findByDateRange()` pulls every complaint in that window regardless of status; the
"Javob" column is left blank for still-pending ones. Columns and headers are always Uzbek
(F.I.Sh, Telefon raqami, Mavzu, Savol, Javob) regardless of the citizen's chosen language — topic
labels are looked up via `t('uz', ...)` specifically for this reason, not the complaint's own
stored `topicLabel`. The file is built in-memory via `exceljs`'s `writeBuffer()` and sent straight
back as a document — nothing is written to disk.

### Adding/changing topics or translations

Edit `src/i18n/locales/*.json` (all four files need matching topic keys — `getTopics()` and the
Uzbek topic lookup in `ceoNotify.js`/`ceoReport.js` both key off `topics.<key>`).

### Anti-abuse

`utils/rateLimiter.js` enforces, per `chatId`, an in-memory (not Mongo-backed) cap of 5 complaint
submissions/hour and a 20s minimum gap between submissions. It resets on process restart — this is
intentionally not a hard security boundary, just abuse mitigation.
