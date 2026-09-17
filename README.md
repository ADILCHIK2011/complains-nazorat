# Soliq Oliy Maktabi — Murojaat nuqtasi (Telegram bot)

Anonim murojaat/shikoyat/taklif qabul qiluvchi Telegram bot. Foydalanuvchi
tilni tanlaydi → mavzuni tanlaydi → matnini yozadi. Matn Groq (Llama 3.3)
yordamida **NAZORAT AI** tomonidan tahlil qilinadi, so'ng asl matn + AI
tahlili ikkita alohida xabar sifatida **CEO**ning shaxsiy chatiga anonim
tarzda yuboriladi. CEO tegishli xabarga **reply** qilib javob yozadi — bu
javob avtomatik ravishda o'sha foydalanuvchiga (anonim tarzda, CEO kimligini
oshkor qilmasdan) yetkaziladi.

## Ishga tushirish

```bash
npm install
npm start
```

`.env` fayli allaqachon to'ldirilgan (bot tokeni, CEO chat ID, MongoDB Atlas
ulanish satri, Groq API kaliti). Boshqa muhitga ko'chirishda `.env.example`
namunasidan foydalaning.

**Muhim:** CEO (`8564520675`) botga kamida bir marta `/start` bosgan yoki
istalgan xabar yuborgan bo'lishi kerak — Telegram botlarga foydalanuvchi
bilan avval muloqot qilmasdan xabar yuborishga ruxsat bermaydi.

## Arxitektura

```
src/
  index.js            — kirish nuqtasi (Mongo ulanadi, botni ishga tushiradi)
  config.js            — .env dan konfiguratsiyani o'qiydi
  i18n/                — 4 til: uz, uz-cyrl (Ўзбек), ru, en
  prompts/soul.md       — NAZORAT AI shaxsiyati va chiqish formati (system prompt)
  services/groq.js      — Groq (Llama 3.3) chaqiruvi, tahlil generatsiyasi
  db/
    mongo.js            — MongoDB ulanish (Compass shu URI bilan ochiladi)
    userModel.js         — foydalanuvchi tili saqlanadi (collection: users)
    complaintModel.js    — murojaatlar saqlanadi (collection: complaints)
  bot/
    index.js             — Telegraf bot, middleware va handlerlarni bog'laydi
    keyboards.js          — inline tugmalar (til, mavzu, keyingi qadam)
    handlers/userFlow.js  — /start, til/mavzu tanlash, murojaat matnini qabul qilish
    handlers/ceoReply.js  — CEO javobini o'qib, tegishli foydalanuvchiga yuboradi
```

### Oqim (foydalanuvchi)

1. `/start` → til tanlash (4 tugma: O'zbek, Ўзбек, Русский, English)
2. Til tanlangач → hurmatli salomlashuv + 7 ta mavzu ro'yxati
3. Mavzu tanlangач → "muammoingizni yozing" so'rovi
4. Foydalanuvchi matn yozadi → "✅ Qabul qilindi, iltimos kuting" javobi
   darhol qaytariladi
5. Fonда: Groq orqali tahlil olinadi → Mongo'ga complaint yoziladi → CEO'ga
   2 ta xabar yuboriladi (asl matn, so'ng AI tahlili + "reply qiling" izohi)

### Oqim (CEO)

1. CEO ikkita xabarni oladi: fuqaro matni va NAZORAT AI tahlili
2. Ikkalasidan biriga **reply** qilib, xohlagan javobini yozadi (matn,
   rasm, ovozli xabar — barchasi qo'llab-quvvatlanadi)
3. Bot javobni avtomatik topib, kerak bo'lsa Groq orqali fuqaro tanlagan
   tilga tarjima qilib (CEO doim o'zbek tilida yozadi), tegishli
   foydalanuvchiga sarlavha bilan yuboradi va murojaatni "answered" deb
   belgilaydi
4. Agar CEO reply qilmasdan yozsa, bot unga qaysi xabarga reply qilish
   kerakligini eslatadi (xatolarning oldini olish uchun)
5. CEO chatida pastda doimiy **"/navbat"** tugmasi bor (oddiy xabar ostidagi
   tugma emas — Telegram'ning doimiy klaviaturasi, hech qachon
   yo'qolmaydi). Bosilganda barcha javobsiz murojaatlar (eskisidan
   yangisiga) qayta yuboriladi — har biri qachon kelgani va tartib raqami
   bilan — va ularga reply qilish yana ishlaydi (chunki bot javob
   yo'naltirish uchun eng oxirgi yuborilgan nusxani ishlatadi)

## Suiiste'mol va yuklamadan himoya

- Har bir foydalanuvchi (chatId) soatiga ko'pi bilan **5 ta murojaat**
  yuborishi mumkin, va ketma-ket ikki murojaat orasida kamida **20
  soniya** o'tishi kerak. Limitdan oshsa, foydalanuvchiga qancha
  kutish kerakligini ko'rsatuvchi xabar qaytariladi (`src/utils/rateLimiter.js`).
- Bu chegara jarayon xotirasida saqlanadi (Mongo'da emas) — suiiste'molning
  oldini olish uchun yetarli, lekin bot qayta ishga tushirilsa hisoblagich
  nolga qaytadi.

## MongoDB (Compass)

Compass'da yuqoridagi `MONGODB_URI` bilan ulaning, `soliq_murojaat`
bazasida ikkita to'plam ko'rinadi:

- **users** — `{ chatId, language, createdAt, updatedAt }`
- **complaints** — `{ chatId, topicKey, topicLabel, language, originalText,
  aiAnalysis, status ("pending"/"answered"), ceoOriginalMsgId,
  ceoAnalysisMsgId, ceoAnswerText, createdAt, answeredAt }`

Fuqaroning ismi/username'i hech qayerda CEO'ga ko'rinadigan xabarlarda
saqlanmaydi yoki chiqarilmaydi — faqat ichki marshrutlash uchun `chatId`
ishlatiladi.

## Sozlash

- **Mavzular yoki tarjimalar**: `src/i18n/locales/*.json`
- **AI shaxsiyati / tahlil formati**: `src/prompts/soul.md`
- **Groq modeli**: `.env` dagi `GROQ_MODEL` (standart: `openai/gpt-oss-120b`)

## Deploy qilish (Railway yoki Render)

Bot HTTP port ochmaydi — u Telegram bilan long polling orqali ishlaydi.
Shuning uchun uni **Web Service** emas, **Worker / Background Worker**
sifatida joylashtiring.

1. **GitHub'ga yuklang**: bu papkani git repo qiling va GitHub'dagi (private)
   repo'ga push qiling. `.env` fayli `.gitignore`'da bor — u hech qachon
   repo'ga tushmaydi, shuning uchun deploy platformasida barcha muhit
   o'zgaruvchilarini qo'lda kiritish kerak bo'ladi (quyida ro'yxati bor).
2. **MongoDB Atlas — Network Access**: Atlas paneli → *Network Access* →
   *Add IP Address* → **Allow access from anywhere (0.0.0.0/0)**. Railway va
   Render'ning chiquvchi IP manzili statik emas (agar maxsus tarif olmagan
   bo'lsangiz), shuning uchun IP oq ro'yxati cheklangan bo'lsa ulanish
   muvaffaqiyatsiz tugaydi.
3. **Railway**: "New Project" → "Deploy from GitHub repo" → repo'ni tanlang.
   Railway Node.js'ni avtomatik aniqlab, `npm install` va `npm start`ni
   ishga tushiradi (`Procfile` ham mavjud). *Settings* bo'limida servis
   turini **Worker** deb belgilang (port kutish shart emas).
4. **Render**: "New" → "Background Worker" → repo'ni ulang. *Build Command*:
   `npm install`, *Start Command*: `npm start` (yoki `node src/index.js`).
5. Ikkala platformada ham **Environment Variables** bo'limiga quyidagilarni
   qo'shing (`.env.example`dagi ro'yxat bilan bir xil):
   `TELEGRAM_BOT_TOKEN`, `CEO_CHAT_ID`, `MONGODB_URI`, `MONGODB_DB`,
   `GROQ_API_KEY`, `GROQ_MODEL`.
6. Deploy tugagach, loglarda `[bot] Soliq Oliy Maktabi murojaat boti ishga
   tushdi.` yozuvini kutib tasdiqlang. Ikkala platforma ham jarayon
   qulasa (crash) uni avtomatik qayta ishga tushiradi — alohida pm2/systemd
   sozlash shart emas.

## Bilinadigan cheklov

Til/mavzu tanlash bosqichi (session) xotirada saqlanadi — bot qayta ishga
tushirilsa, jarayon o'rtasida bo'lgan foydalanuvchi qayta `/start` bosishi
kerak bo'ladi. Bu **allaqachon yuborilgan murojaatlarga ta'sir qilmaydi** —
ular va ularga javoblar doim MongoDB'da xavfsiz saqlanadi.

Boshqa hozircha qo'shilmagan narsa (kerak bo'lsa keyin qo'shsa bo'ladi):

- Agar CEO'ga xabar yetkazib bo'lmasa (masalan, CEO Telegram akkauntida
  muammo bo'lsa), foydalanuvchi buni bilmaydi — u "qabul qilindi"ni ko'radi,
  lekin xatolik faqat server logida qoladi. Hech qanday qayta urinish yoki
  ogohlantirish mexanizmi yo'q.
