const { Telegraf, session } = require('telegraf');
const config = require('../config');
const { t, DEFAULT_LANGUAGE } = require('../i18n');
const {
  handleStart,
  handleLanguageChosen,
  handleChangeLanguage,
  handleNewComplaint,
  handleTopicChosen,
  handleGenericText,
} = require('./handlers/userFlow');
const { handleCeoMessage } = require('./handlers/ceoReply');
const { handleNavbatCommand } = require('./handlers/ceoNavbat');

function createBot() {
  const bot = new Telegraf(config.telegramBotToken);

  bot.use(
    session({
      defaultSession: () => ({
        stage: 'idle',
        language: null,
        topicKey: null,
        topicLabel: null,
      }),
    })
  );

  // Route every message coming from the CEO's chat straight to the reply
  // relay, bypassing the regular citizen flow entirely — except /navbat,
  // which has its own dedicated command handler below.
  bot.use(async (ctx, next) => {
    if (ctx.chat && ctx.chat.id === config.ceoChatId && ctx.message) {
      if (ctx.message.text && ctx.message.text.startsWith('/navbat')) {
        return next();
      }
      await handleCeoMessage(ctx);
      return;
    }
    return next();
  });

  bot.start(handleStart);
  bot.command('navbat', handleNavbatCommand);

  bot.action(/^lang:/, handleLanguageChosen);
  bot.action('change_language', handleChangeLanguage);
  bot.action('new_complaint', handleNewComplaint);
  bot.action(/^topic:/, handleTopicChosen);

  bot.on('text', handleGenericText);

  // Any non-text content (photo, voice, sticker, etc.) from a citizen.
  bot.on('message', (ctx) => {
    const lang = (ctx.session && ctx.session.language) || DEFAULT_LANGUAGE;
    return ctx.reply(t(lang, 'empty_message'));
  });

  bot.catch((err, ctx) => {
    console.error(`[bot] unhandled error for update ${ctx.update.update_id}:`, err);
  });

  return bot;
}

module.exports = { createBot };
