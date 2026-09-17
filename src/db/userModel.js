const { getDb } = require('./mongo');

async function upsertUser(chatId, fields) {
  const db = getDb();
  await db.collection('users').updateOne(
    { chatId },
    {
      $set: { ...fields, updatedAt: new Date() },
      $setOnInsert: { chatId, createdAt: new Date() },
    },
    { upsert: true }
  );
}

async function setLanguage(chatId, language) {
  await upsertUser(chatId, { language });
}

async function setContact(chatId, { fullName, phoneNumber }) {
  await upsertUser(chatId, { fullName, phoneNumber });
}

async function getUser(chatId) {
  const db = getDb();
  return db.collection('users').findOne({ chatId });
}

module.exports = { upsertUser, setLanguage, setContact, getUser };
