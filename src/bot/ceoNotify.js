const config = require('../config');
const { t, getLanguageName } = require('../i18n');
const complaintModel = require('../db/complaintModel');
const { ceoKeyboard } = require('./keyboards');

/**
 * Sends (or re-sends) a complaint to the CEO as a single message and records
 * the resulting message id as the current reply target for that complaint.
 * Re-sending (e.g. from /navbat) intentionally overwrites the stored message
 * id, so the CEO can always reply to the most recently shown copy.
 */
async function sendComplaintToCeo(telegram, complaint, { note } = {}) {
  const uzTopicLabel = t('uz', `topics.${complaint.topicKey}`);
  const languageName = getLanguageName(complaint.language);
  const header = note ? `${note}\n\n` : '';

  const message = await telegram.sendMessage(
    config.ceoChatId,
    `${header}🆕 Yangi murojaat\n\n` +
      `👤 F.I.Sh: ${complaint.fullName || "Noma'lum"}\n` +
      `📞 Telefon: ${complaint.phoneNumber || "Noma'lum"}\n` +
      `📂 Mavzu: ${uzTopicLabel}\n` +
      `🌐 Til: ${languageName}\n\n` +
      `✉️ Xabar matni:\n${complaint.originalText}\n\n` +
      `—\n✍️ Iltimos, javobingizni ushbu xabarga REPLY qilib yozing. Javobingiz ` +
      `to'g'ridan-to'g'ri fuqaroga yuboriladi.`,
    { reply_markup: ceoKeyboard().reply_markup }
  );

  await complaintModel.setCeoMessageId(complaint._id, message.message_id);

  return message;
}

module.exports = { sendComplaintToCeo };
