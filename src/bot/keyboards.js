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

// Persistent bottom keyboard shown in the CEO's chat only. Unlike an inline
// button (which is tied to one specific message and can get buried), this
// stays pinned below the text input for the whole chat until replaced.
function ceoKeyboard() {
  return Markup.keyboard([['/navbat']]).resize();
}

module.exports = { languageKeyboard, topicsKeyboard, afterReceivedKeyboard, ceoKeyboard };
