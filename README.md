# Soliq Oliy Maktabi — Murojaat nuqtasi (Telegram bot)

Fuqarolarning murojaat/shikoyat/taklifini qabul qiluvchi Telegram bot. Foydalanuvchi
tilni tanlaydi → (birinchi marta bo'lsa) kontaktini ulashadi → mavzuni tanlaydi →
matnini yozadi. Matn hech qanday AI tahlilisiz, to'g'ridan-to'g'ri foydalanuvchining
**to'liq ismi va telefon raqami** bilan birga **CEO**ning shaxsiy chatiga yuboriladi.
CEO tegishli xabarga **reply** qilib javob yozadi — bu javob avtomatik ravishda
o'sha foydalanuvchiga yetkaziladi (agar u o'zbek tilidan boshqa tilni tanlagan bo'lsa,
javob shu tilga tarjima qilinadi).

CEO uchun doimiy **"📊 Hisobot"** tugmasi ham bor — bosilganda kunlik/haftalik/oylik
davr tanlanadi va o'sha davrdagi barcha murojaatlar (F.I.Sh, telefon, mavzu, savol,
javob) bilan Excel (.xlsx) fayl darhol generatsiya qilinib yuboriladi.

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
  services/groq.js      — Groq (Llama 3.3): faqat CEO javobini fuqaro tiliga tarjima qiladi
  db/
    mongo.js            — MongoDB ulanish (Compass shu URI bilan ochiladi)
    userModel.js         — foydalanuvchi tili, to'liq ismi va telefon raqami saqlanadi (collection: users)
    complaintModel.js    — murojaatlar saqlanadi (collection: complaints)
  bot/
    index.js             — Telegraf bot, middleware va handlerlarni bog'laydi
    keyboards.js          — inline tugmalar, kontakt so'rash tugmasi, CEO klaviaturasi
    ceoNotify.js           — murojaatni CEO chatiga bitta xabar sifatida yuboradi
    handlers/userFlow.js  — /start, til tanlash, kontakt so'rash, mavzu tanlash, murojaat matnini qabul qilish
    handlers/ceoReply.js  — CEO javobini o'qib, tegishli foydalanuvchiga yuboradi
    handlers/ceoNavbat.js — /navbat: javobsiz murojaatlarni qayta ko'rsatadi
    handlers/ceoReport.js — "📊 Hisobot": kunlik/haftalik/oylik Excel hisobot generatsiya qiladi
```

### Oqim (foydalanuvchi)

1. `/start` → til tanlash (4 tugma: O'zbek, Ўзбек, Русский, English)
2. Til tanlangач → agar bu foydalanuvchi ilgari kontakt ulashmagan bo'lsa, undan
   **bitta tugma bosish orqali** (Telegram'ning o'z kontakt-ulashish funksiyasi)
   ism va telefon raqamini so'raladi — bu ma'lumot qo'lda yozdirilmaydi, Telegram
   tomonidan tasdiqlangan holda avtomatik olinadi. Ilgari ulashgan foydalanuvchilar
   bu qadamni ko'rmaydi.
3. Kontakt qabul qilingач (yoki allaqachon mavjud bo'lsa) → hurmatli salomlashuv
   + 7 ta mavzu ro'yxati
4. Mavzu tanlangач → "muammoingizni yozing" so'rovi
5. Foydalanuvchi matn yozadi → "✅ Qabul qilindi, iltimos kuting" javobi
   darhol qaytariladi, so'ng murojaat (F.I.Sh, telefon, mavzu, matn) bilan
   birga Mongo'ga yoziladi va CEO'ga bitta xabar sifatida yuboriladi

### Oqim (CEO)

1. CEO fuqaroning to'liq ismi, telefon raqami, mavzusi va matni bilan bitta
   xabar oladi
2. Shu xabarga **reply** qilib xohlagan javobini yozadi (matn, rasm, ovozli
   xabar — barchasi qo'llab-quvvatlanadi)
3. Bot javobni avtomatik topib, kerak bo'lsa Groq orqali fuqaro tanlagan
   tilga tarjima qilib (CEO doim o'zbek tilida yozadi), tegishli
   foydalanuvchiga sarlavha bilan yuboradi va murojaatni "answered" deb
   belgilaydi
4. Agar CEO reply qilmasdan yozsa, bot unga qaysi xabarga reply qilish
   kerakligini eslatadi (xatolarning oldini olish uchun)
5. CEO chatida pastda ikkita doimiy tugma bor (Telegram'ning doimiy
   klaviaturasi, hech qachon yo'qolmaydi):
   - **"/navbat"** — barcha javobsiz murojaatlarni (eskisidan yangisiga) qayta
     yuboradi, har biri qachon kelgani va tartib raqami bilan — va ularga
     reply qilish yana ishlaydi (chunki bot javob yo'naltirish uchun eng
     oxirgi yuborilgan nusxani ishlatadi)
   - **"📊 Hisobot"** — kunlik/haftalik/oylik davr tanlash tugmalarini
     ko'rsatadi, tanlangач o'sha davrdagi barcha murojaatlarni (F.I.Sh,
     telefon, mavzu, savol, javob) o'z ichiga olgan `.xlsx` fayl generatsiya
     qilib, darhol yuboradi (AI ishtirokisiz — to'g'ridan-to'g'ri MongoDB'dan)

Ikkala tugma ham faqat CEO chatida ishlaydi — boshqa foydalanuvchi shu matnni
qo'lda yozib yuborsa ham, hech qanday ma'lumot ko'rsatilmaydi.

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

- **users** — `{ chatId, language, fullName, phoneNumber, createdAt, updatedAt }`
- **complaints** — `{ chatId, fullName, phoneNumber, topicKey, topicLabel,
  language, originalText, status ("pending"/"answered"), ceoOriginalMsgId,
  ceoAnswerText, createdAt, answeredAt }`

Fuqaroning to'liq ismi va telefon raqami Telegram'ning o'z kontakt-ulashish
funksiyasi orqali (bitta tugma bosish bilan, qo'lda yozdirilmasdan) olinadi va
har bir murojaat bilan birga saqlanadi, chunki endi murojaatlar anonim emas —
CEO kimdan kelganini biladi.

## Sozlash

- **Mavzular yoki tarjimalar**: `src/i18n/locales/*.json`
- **Groq modeli** (faqat CEO javobini tarjima qilish uchun ishlatiladi):
  `.env` dagi `GROQ_MODEL` (standart: `openai/gpt-oss-120b`)

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
ular va ularga javoblar doim MongoDB'da xavfsiz saqlanadi. Bir marta kontakt
ulashgan foydalanuvchidan qayta so'ralmaydi, chunki bu ma'lumot Mongo'da
saqlanadi.

Boshqa hozircha qo'shilmagan narsa (kerak bo'lsa keyin qo'shsa bo'ladi):

- Agar CEO'ga xabar yetkazib bo'lmasa (masalan, CEO Telegram akkauntida
  muammo bo'lsa), foydalanuvchi buni bilmaydi — u "qabul qilindi"ni ko'radi,
  lekin xatolik faqat server logida qoladi. Hech qanday qayta urinish yoki
  ogohlantirish mexanizmi yo'q.
