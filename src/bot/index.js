const { Telegraf, session } = require('telegraf');
const config = require('../config');
const { t, DEFAULT_LANGUAGE } = require('../i18n');
const {
  handleStart,
  handleLanguageChosen,
  handleContactShared,
  handleChangeLanguage,
  handleNewComplaint,
  handleTopicChosen,
  handleGenericText,
} = require('./handlers/userFlow');
const { handleCeoMessage } = require('./handlers/ceoReply');
const { handleNavbatCommand } = require('./handlers/ceoNavbat');
const { handleHisobotButton, handleReportPeriod } = require('./handlers/ceoReport');

const HISOBOT_BUTTON_TEXT = '📊 Hisobot';

function createBot() {
  const bot = new Telegraf(config.telegramBotToken);

  bot.use(
    session({
      defaultSession: () => ({
        stage: 'idle',
        language: null,
        topicKey: null,
        topicLabel: null,
        fullName: null,
        phoneNumber: null,
      }),
    })
  );

  // Route every message coming from the CEO's chat straight to the reply
  // relay, bypassing the regular citizen flow entirely — except /navbat and
  // the "Hisobot" button, which have their own dedicated handlers below.
  bot.use(async (ctx, next) => {
    if (ctx.chat && ctx.chat.id === config.ceoChatId && ctx.message) {
      const text = ctx.message.text;
      if (text && (text.startsWith('/navbat') || text === HISOBOT_BUTTON_TEXT)) {
        return next();
      }
      await handleCeoMessage(ctx);
      return;
    }
    return next();
  });

  bot.start(handleStart);
  bot.command('navbat', handleNavbatCommand);
  bot.hears(HISOBOT_BUTTON_TEXT, handleHisobotButton);
  bot.action(/^report:/, handleReportPeriod);

  bot.action(/^lang:/, handleLanguageChosen);
  bot.action('change_language', handleChangeLanguage);
  bot.action('new_complaint', handleNewComplaint);
  bot.action(/^topic:/, handleTopicChosen);

  bot.on('contact', handleContactShared);
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
