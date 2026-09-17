require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  telegramBotToken: required('TELEGRAM_BOT_TOKEN'),
  ceoChatId: Number(required('CEO_CHAT_ID')),
  mongodbUri: required('MONGODB_URI'),
  mongodbDb: process.env.MONGODB_DB || 'soliq_murojaat',
  groqApiKey: required('GROQ_API_KEY'),
  groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
};
