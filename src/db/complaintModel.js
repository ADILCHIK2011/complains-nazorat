const { ObjectId } = require('mongodb');
const { getDb } = require('./mongo');

async function createComplaint({ chatId, topicKey, topicLabel, language, originalText, aiAnalysis }) {
  const db = getDb();
  const doc = {
    chatId,
    topicKey,
    topicLabel,
    language,
    originalText,
    aiAnalysis,
    status: 'pending',
    ceoOriginalMsgId: null,
    ceoAnalysisMsgId: null,
    ceoAnswerText: null,
    createdAt: new Date(),
    answeredAt: null,
  };
  const result = await db.collection('complaints').insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

async function setCeoMessageIds(complaintId, { ceoOriginalMsgId, ceoAnalysisMsgId }) {
  const db = getDb();
  await db.collection('complaints').updateOne(
    { _id: new ObjectId(complaintId) },
    { $set: { ceoOriginalMsgId, ceoAnalysisMsgId } }
  );
}

async function findPendingByCeoMessageId(messageId) {
  const db = getDb();
  return db.collection('complaints').findOne({
    status: 'pending',
    $or: [{ ceoOriginalMsgId: messageId }, { ceoAnalysisMsgId: messageId }],
  });
}

async function findAllPending() {
  const db = getDb();
  return db.collection('complaints').find({ status: 'pending' }).sort({ createdAt: 1 }).toArray();
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
  setCeoMessageIds,
  findPendingByCeoMessageId,
  findAllPending,
  markAnswered,
};
