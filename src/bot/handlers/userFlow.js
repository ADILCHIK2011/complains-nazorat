const { t, getTopics, CHOOSE_LANGUAGE_PROMPT, DEFAULT_LANGUAGE, isValidLanguage } = require('../../i18n');
const { languageKeyboard, topicsKeyboard, afterReceivedKeyboard } = require('../keyboards');
const userModel = require('../../db/userModel');
const complaintModel = require('../../db/complaintModel');
const { analyzeComplaint } = require('../../services/groq');
const { sendComplaintToCeo } = require('../ceoNotify');
const { checkLimit } = require('../../utils/rateLimiter');

function resetSession(ctx) {
  ctx.session.stage = 'choosing_language';
  ctx.session.language = null;
  ctx.session.topicKey = null;
  ctx.session.topicLabel = null;
}

async function handleStart(ctx) {
  resetSession(ctx);
  await ctx.reply(CHOOSE_LANGUAGE_PROMPT, languageKeyboard());
}

async function handleLanguageChosen(ctx) {
  const code = ctx.callbackQuery.data.split(':')[1];
  if (!isValidLanguage(code)) return ctx.answerCbQuery();

  ctx.session.language = code;
  ctx.session.stage = 'choosing_topic';
  await userModel.setLanguage(ctx.chat.id, code);

  await ctx.answerCbQuery();
  await ctx.editMessageText(t(code, 'welcome'), topicsKeyboard(code));
}

async function handleChangeLanguage(ctx) {
  ctx.session.stage = 'choosing_language';
  await ctx.answerCbQuery();
  await ctx.editMessageText(CHOOSE_LANGUAGE_PROMPT, languageKeyboard());
}

async function handleNewComplaint(ctx) {
  const lang = ctx.session.language || DEFAULT_LANGUAGE;
  ctx.session.stage = 'choosing_topic';
  ctx.session.topicKey = null;
  ctx.session.topicLabel = null;
  await ctx.answerCbQuery();
  await ctx.editMessageText(t(lang, 'topics_prompt'), topicsKeyboard(lang));
}

async function handleTopicChosen(ctx) {
  const lang = ctx.session.language || DEFAULT_LANGUAGE;
  const key = ctx.callbackQuery.data.split(':')[1];
  const topic = getTopics(lang).find((tp) => tp.key === key);
  if (!topic) return ctx.answerCbQuery();

  ctx.session.topicKey = topic.key;
  ctx.session.topicLabel = topic.label;
  ctx.session.stage = 'awaiting_complaint';

  await ctx.answerCbQuery();
  await ctx.editMessageText(t(lang, 'topic_chosen', { topic: topic.label }));
}

async function handleComplaintText(ctx) {
  const lang = ctx.session.language || DEFAULT_LANGUAGE;
  const text = ctx.message.text?.trim();

  if (!text) {
    return ctx.reply(t(lang, 'empty_message'));
  }

  const limit = checkLimit(ctx.chat.id);
  if (!limit.allowed) {
    const minutes = Math.max(1, Math.ceil(limit.retryAfterMs / 60000));
    await ctx.reply(t(lang, 'rate_limited', { minutes }));
    return; // stage stays awaiting_complaint, no need to reselect the topic
  }

  await ctx.reply(t(lang, 'received'), afterReceivedKeyboard(lang));

  try {
    const aiAnalysis = await analyzeComplaint({
      topicLabel: ctx.session.topicLabel,
      language: lang,
      text,
    });

    const complaint = await complaintModel.createComplaint({
      chatId: ctx.chat.id,
      topicKey: ctx.session.topicKey,
      topicLabel: ctx.session.topicLabel,
      language: lang,
      originalText: text,
      aiAnalysis,
    });

    await sendComplaintToCeo(ctx.telegram, complaint);
  } catch (err) {
    console.error('[userFlow] failed to process complaint:', err);
  }

  ctx.session.stage = 'idle';
}

async function handleGenericText(ctx) {
  const lang = ctx.session.language || DEFAULT_LANGUAGE;

  if (ctx.session.stage === 'awaiting_complaint') {
    return handleComplaintText(ctx);
  }

  if (!ctx.session.language) {
    return ctx.reply(t(DEFAULT_LANGUAGE, 'please_choose_topic_first'));
  }

  await ctx.reply(t(lang, 'topics_prompt'), topicsKeyboard(lang));
}

module.exports = {
  handleStart,
  handleLanguageChosen,
  handleChangeLanguage,
  handleNewComplaint,
  handleTopicChosen,
  handleGenericText,
};
