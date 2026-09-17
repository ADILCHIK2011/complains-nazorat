const uz = require('./locales/uz.json');
const uzCyrl = require('./locales/uz-cyrl.json');
const ru = require('./locales/ru.json');
const en = require('./locales/en.json');

const LOCALES = {
  uz,
  'uz-cyrl': uzCyrl,
  ru,
  en,
};

const DEFAULT_LANGUAGE = 'uz';

// Button labels shown on the very first /start screen, before a language
// is known. Each label is written in its own language so users can
// recognize their language regardless of the bot's current locale.
const LANGUAGE_OPTIONS = [
  { code: 'uz', label: "🇺🇿 O'zbek" },
  { code: 'uz-cyrl', label: '🇺🇿 Ўзбек' },
  { code: 'ru', label: '🇷🇺 Русский' },
  { code: 'en', label: '🇬🇧 English' },
];

const CHOOSE_LANGUAGE_PROMPT =
  "🌐 Tilni tanlang / Выберите язык / Тилни танланг / Please choose your language:";

function isValidLanguage(code) {
  return Object.prototype.hasOwnProperty.call(LOCALES, code);
}

function t(langCode, key, vars) {
  const locale = LOCALES[langCode] || LOCALES[DEFAULT_LANGUAGE];
  const parts = key.split('.');
  let value = locale;
  for (const part of parts) {
    value = value && value[part];
  }
  if (value === undefined) {
    // Fall back to default language if a key is missing in this locale.
    value = parts.reduce((acc, part) => acc && acc[part], LOCALES[DEFAULT_LANGUAGE]);
  }
  if (typeof value !== 'string') return key;
  if (!vars) return value;
  return Object.keys(vars).reduce(
    (str, varName) => str.replace(`{${varName}}`, vars[varName]),
    value
  );
}

function getTopics(langCode) {
  const locale = LOCALES[langCode] || LOCALES[DEFAULT_LANGUAGE];
  return Object.entries(locale.topics).map(([key, label]) => ({ key, label }));
}

function getLanguageName(langCode) {
  const locale = LOCALES[langCode] || LOCALES[DEFAULT_LANGUAGE];
  return locale.name;
}

module.exports = {
  LOCALES,
  DEFAULT_LANGUAGE,
  LANGUAGE_OPTIONS,
  CHOOSE_LANGUAGE_PROMPT,
  isValidLanguage,
  t,
  getTopics,
  getLanguageName,
};
