const { ObjectId } = require('mongodb');
const { getDb } = require('./mongo');

async function createComplaint({
  chatId,
  fullName,
  phoneNumber,
  topicKey,
  topicLabel,
  language,
  originalText,
}) {
  const db = getDb();
  const doc = {
    chatId,
    fullName,
    phoneNumber,
    topicKey,
    topicLabel,
    language,
    originalText,
    status: 'pending',
    ceoOriginalMsgId: null,
    ceoAnswerText: null,
    createdAt: new Date(),
    answeredAt: null,
  };
  const result = await db.collection('complaints').insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

async function setCeoMessageId(complaintId, ceoOriginalMsgId) {
  const db = getDb();
  await db.collection('complaints').updateOne(
    { _id: new ObjectId(complaintId) },
    { $set: { ceoOriginalMsgId } }
  );
}

async function findPendingByCeoMessageId(messageId) {
  const db = getDb();
  return db.collection('complaints').findOne({
    status: 'pending',
    ceoOriginalMsgId: messageId,
  });
}

async function findAllPending() {
  const db = getDb();
  return db.collection('complaints').find({ status: 'pending' }).sort({ createdAt: 1 }).toArray();
}

async function findByDateRange(from, to) {
  const db = getDb();
  return db
    .collection('complaints')
    .find({ createdAt: { $gte: from, $lte: to } })
    .sort({ createdAt: 1 })
    .toArray();
}

async function markAnswered(complaintId, ceoAnswerText) {
  const db = getDb();
  await db.collection('complaints').updateOne(
    { _id: new ObjectId(complaintId) },
    { $set: { status: 'answered', ceoAnswerText, answeredAt: new Date() } }
  );
}

module.exports = {
  createComplaint,
  setCeoMessageId,
  findPendingByCeoMessageId,
  findAllPending,
  findByDateRange,
  markAnswered,
};
