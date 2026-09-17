const Groq = require('groq-sdk');
const config = require('../config');

const client = new Groq({ apiKey: config.groqApiKey });

const TRANSLATION_TARGETS = {
  uz: "o'zbek tili (lotin yozuvi)",
  'uz-cyrl': "o'zbek tili (krill yozuvi)",
  ru: 'rus tili',
  en: 'ingliz tili',
};

/**
 * The CEO always types replies in Uzbek. Since a citizen may have written
 * in a different language, this translates (or transliterates, for the
 * Cyrillic case) the CEO's raw reply into the citizen's chosen language
 * before it is delivered.
 */
async function translateAnswer({ text, targetLanguage }) {
  if (targetLanguage === 'uz') return text; // CEO already writes in this language

  const targetName = TRANSLATION_TARGETS[targetLanguage] || TRANSLATION_TARGETS.uz;

  try {
    const completion = await client.chat.completions.create({
      model: config.groqModel,
      temperature: 0.2,
      max_tokens: 900,
      reasoning_effort: 'low',
      messages: [
        {
          role: 'system',
          content:
            "Siz professional tarjimonsiz. Sizga o'zbek tilida yozilgan matn beriladi. " +
            `Uni ${targetName}ga aniq, tabiiy va hurmatli ohangda tarjima qiling ` +
            "(agar maqsad til ham o'zbekcha bo'lib, faqat yozuvi boshqa bo'lsa — mazmunni " +
            "o'zgartirmasdan faqat yozuvni almashtiring). Matndagi tuzilma, qatorlar va " +
            "emojilarni saqlab qoling. FAQAT tarjima qilingan matnni qaytaring — hech qanday " +
            "izoh, kirish so'zi yoki tushuntirish qo'shmang.",
        },
        { role: 'user', content: text },
      ],
    });

    const translated = completion.choices?.[0]?.message?.content?.trim();
    if (!translated) throw new Error('Empty translation response from Groq');
    return translated;
  } catch (err) {
    console.error('[groq] translation failed:', err.message);
    return text; // fall back to the original Uzbek text rather than losing the reply
  }
}

module.exports = { translateAnswer };
