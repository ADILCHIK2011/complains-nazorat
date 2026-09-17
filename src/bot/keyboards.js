const { Markup } = require('telegraf');
const { LANGUAGE_OPTIONS, getTopics, t } = require('../i18n');

function languageKeyboard() {
  return Markup.inlineKeyboard(
    LANGUAGE_OPTIONS.map((opt) => [Markup.button.callback(opt.label, `lang:${opt.code}`)])
  );
}

function topicsKeyboard(lang) {
  const topics = getTopics(lang);
  const rows = topics.map((topic) => [Markup.button.callback(topic.label, `topic:${topic.key}`)]);
  rows.push([Markup.button.callback(t(lang, 'btn_change_language'), 'change_language')]);
  return Markup.inlineKeyboard(rows);
}

function afterReceivedKeyboard(lang) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(t(lang, 'btn_new_complaint'), 'new_complaint')],
    [Markup.button.callback(t(lang, 'btn_change_language'), 'change_language')],
  ]);
}

// One-time reply keyboard used to request the citizen's real phone number +
// name via Telegram's native contact-share flow. Requesting it this way
// (instead of asking the user to type it) means the phone number is
// verified by Telegram itself, not self-reported.
function contactRequestKeyboard(lang) {
  return Markup.keyboard([[Markup.button.contactRequest(t(lang, 'btn_share_contact'))]])
    .resize()
    .oneTime();
}

// Persistent bottom keyboard shown in the CEO's chat only. Unlike an inline
// button (which is tied to one specific message and can get buried), this
// stays pinned below the text input for the whole chat until replaced.
function ceoKeyboard() {
  return Markup.keyboard([['/navbat', '📊 Hisobot']]).resize();
}

function reportPeriodKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📅 Kunlik', 'report:daily')],
    [Markup.button.callback('🗓 Haftalik', 'report:weekly')],
    [Markup.button.callback('📆 Oylik', 'report:monthly')],
  ]);
}

module.exports = {
  languageKeyboard,
  topicsKeyboard,
  afterReceivedKeyboard,
  contactRequestKeyboard,
  ceoKeyboard,
  reportPeriodKeyboard,
};
