const { t } = require('../../i18n');
const complaintModel = require('../../db/complaintModel');
const { translateAnswer } = require('../../services/groq');
const { ceoKeyboard } = require('../keyboards');

const NOT_LINKED_WARNING =
  "⚠️ Bu xabar biror faol (javobsiz) murojaatga bog'liq emas.\n\n" +
  "Iltimos, javob bermoqchi bo'lgan murojaat xabariga (asl matn yoki AI tahlili) " +
  "to'g'ridan-to'g'ri REPLY qilib, so'ngra javobingizni yozing.";

async function handleCeoMessage(ctx) {
  const replyTo = ctx.message.reply_to_message;

  if (!replyTo) {
    await ctx.reply(NOT_LINKED_WARNING, ceoKeyboard());
    return;
  }

  const complaint = await complaintModel.findPendingByCeoMessageId(replyTo.message_id);
  if (!complaint) {
    await ctx.reply(NOT_LINKED_WARNING, ceoKeyboard());
    return;
  }

  const header = t(complaint.language, 'answer_header');
  const answerText = ctx.message.text || ctx.message.caption || '';

  try {
    if (ctx.message.text) {
      const translated = await translateAnswer({
        text: ctx.message.text,
        targetLanguage: complaint.language,
      });
      await ctx.telegram.sendMessage(complaint.chatId, `${header}\n\n${translated}`);
    } else if (ctx.message.caption) {
      const translatedCaption = await translateAnswer({
        text: ctx.message.caption,
        targetLanguage: complaint.language,
      });
      try {
        await ctx.telegram.copyMessage(complaint.chatId, ctx.chat.id, ctx.message.message_id, {
          caption: `${header}\n\n${translatedCaption}`,
        });
      } catch {
        // Some media types (e.g. stickers) reject a caption override.
        await ctx.telegram.sendMessage(complaint.chatId, `${header}\n\n${translatedCaption}`);
        await ctx.telegram.copyMessage(complaint.chatId, ctx.chat.id, ctx.message.message_id);
      }
    } else {
      await ctx.telegram.sendMessage(complaint.chatId, header);
      await ctx.telegram.copyMessage(complaint.chatId, ctx.chat.id, ctx.message.message_id);
    }

    await complaintModel.markAnswered(complaint._id, answerText);
    await ctx.reply('✅ Javobingiz fuqaroga anonim tarzda yuborildi. Rahmat!', ceoKeyboard());
  } catch (err) {
    console.error('[ceoReply] failed to deliver answer:', err);
    await ctx.reply(
      "❌ Javobni fuqaroga yuborib bo'lmadi. Ehtimol, foydalanuvchi botni bloklagan. Xatolik: " +
        err.message,
      ceoKeyboard()
    );
  }
}

module.exports = { handleCeoMessage };
