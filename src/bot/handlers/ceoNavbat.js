const complaintModel = require('../../db/complaintModel');
const { sendComplaintToCeo } = require('../ceoNotify');
const { ceoKeyboard } = require('../keyboards');
const { formatRelativeTime } = require('../../utils/time');

const MAX_SHOWN = 20;

async function handleNavbatCommand(ctx) {
  const pending = await complaintModel.findAllPending();

  if (pending.length === 0) {
    await ctx.reply("✅ Hozircha javobsiz murojaatlar yo'q.", ceoKeyboard());
    return;
  }

  await ctx.reply(
    `📋 Javobsiz murojaatlar: ${pending.length} ta.\n\n` +
      "Har birini qayta yuboryapman — javob berish uchun tegishli xabarga REPLY qiling.",
    ceoKeyboard()
  );

  const toShow = pending.slice(0, MAX_SHOWN);
  for (let i = 0; i < toShow.length; i++) {
    const complaint = toShow[i];
    await sendComplaintToCeo(ctx.telegram, complaint, {
      note: `🔁 #${i + 1} — ${formatRelativeTime(complaint.createdAt)} yuborilgan`,
    });
  }

  if (pending.length > MAX_SHOWN) {
    await ctx.reply(
      `... va yana ${pending.length - MAX_SHOWN} ta murojaat bor. Avval yuqoridagilarga javob bering, so'ng /navbat ni qayta yuboring.`
    );
  }
}

module.exports = { handleNavbatCommand };
