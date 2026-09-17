const config = require('../config');
const { t, getLanguageName } = require('../i18n');
const complaintModel = require('../db/complaintModel');
const { ceoKeyboard } = require('./keyboards');

/**
 * Sends (or re-sends) a complaint to the CEO as two messages — the original
 * anonymous text, then the NAZORAT AI analysis — and records the resulting
 * message ids as the current reply target for that complaint. Re-sending
 * (e.g. from /navbat) intentionally overwrites the stored message ids, so
 * the CEO can always reply to the most recently shown copy.
 */
async function sendComplaintToCeo(telegram, complaint, { note } = {}) {
  const uzTopicLabel = t('uz', `topics.${complaint.topicKey}`);
  const languageName = getLanguageName(complaint.language);
  const header = note ? `${note}\n\n` : '';

  const originalMsg = await telegram.sendMessage(
    config.ceoChatId,
    `${header}🆕 Yangi murojaat (anonim)\n\n📂 Mavzu: ${uzTopicLabel}\n🌐 Til: ${languageName}\n\n✉️ Xabar matni:\n${complaint.originalText}`,
    { reply_markup: ceoKeyboard().reply_markup }
  );

  const analysisMsg = await telegram.sendMessage(
    config.ceoChatId,
    `🤖 NAZORAT AI tahlili:\n\n${complaint.aiAnalysis}\n\n—\n✍️ Iltimos, javobingizni ushbu xabarga (yoki yuqoridagi xabarga) REPLY qilib yozing. Javobingiz to'g'ridan-to'g'ri fuqaroga anonim tarzda yuboriladi.`,
    { reply_to_message_id: originalMsg.message_id }
  );

  await complaintModel.setCeoMessageIds(complaint._id, {
    ceoOriginalMsgId: originalMsg.message_id,
    ceoAnalysisMsgId: analysisMsg.message_id,
  });

  return { originalMsg, analysisMsg };
}

module.exports = { sendComplaintToCeo };
