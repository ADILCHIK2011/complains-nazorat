const mongo = require('./db/mongo');
const config = require('./config');
const { createBot } = require('./bot');
const { ceoKeyboard } = require('./bot/keyboards');

async function main() {
  await mongo.connect();

  const bot = createBot();

  // Makes "/start" show up as a suggested command as soon as the user
  // types "/" in the chat.
  await bot.telegram.setMyCommands([
    { command: 'start', description: "Botni ishga tushirish va murojaat yuborish" },
  ]);
  await bot.telegram.setMyCommands(
    [{ command: 'start', description: "Запустить бота и отправить обращение" }],
    { language_code: 'ru' }
  );
  await bot.telegram.setMyCommands(
    [{ command: 'start', description: 'Start the bot and send a message' }],
    { language_code: 'en' }
  );

  // The CEO's chat gets its own command menu (/navbat) instead of /start,
  // since the CEO never goes through the citizen flow.
  try {
    await bot.telegram.setMyCommands(
      [{ command: 'navbat', description: "Javobsiz murojaatlar ro'yxati" }],
      { scope: { type: 'chat', chat_id: config.ceoChatId } }
    );
    // Also push the persistent "/navbat" keyboard button proactively, so
    // it's visible even before the CEO's first incoming complaint. This
    // only succeeds if the CEO has already opened a chat with the bot.
    await bot.telegram.sendMessage(
      config.ceoChatId,
      "🗂 Boshqaruv paneli tayyor. Javobsiz murojaatlar ro'yxatini pastdagi \"/navbat\" tugmasi orqali istalgan vaqtda ko'rishingiz mumkin.",
      ceoKeyboard()
    );
  } catch (err) {
    console.warn(
      "[bot] CEO chatiga boshlang'ich xabar yuborilmadi (ehtimol, CEO hali botga /start bosmagan):",
      err.message
    );
  }

  // bot.launch() only resolves once the bot stops (it awaits the polling
  // loop internally), so confirm startup via the launch callback instead
  // of awaiting the promise here.
  bot.launch(() => {
    console.log('[bot] Soliq Oliy Maktabi murojaat boti ishga tushdi.');
  });

  process.once('SIGINT', () => {
    bot.stop('SIGINT');
    mongo.disconnect();
  });
  process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
    mongo.disconnect();
  });
}

main().catch((err) => {
  console.error('[fatal] Botni ishga tushirib bo\'lmadi:', err);
  process.exit(1);
});
