const ExcelJS = require('exceljs');
const config = require('../../config');
const { t } = require('../../i18n');
const complaintModel = require('../../db/complaintModel');
const { getDateRange } = require('../../utils/time');
const { ceoKeyboard, reportPeriodKeyboard } = require('../keyboards');

const PERIOD_LABELS = {
  daily: 'Kunlik',
  weekly: 'Haftalik',
  monthly: 'Oylik',
};

async function handleHisobotButton(ctx) {
  if (ctx.chat.id !== config.ceoChatId) return;
  await ctx.reply('📊 Qaysi davr uchun hisobot kerak?', reportPeriodKeyboard());
}

async function handleReportPeriod(ctx) {
  if (ctx.chat.id !== config.ceoChatId) return ctx.answerCbQuery();

  const period = ctx.callbackQuery.data.split(':')[1];
  const label = PERIOD_LABELS[period];
  if (!label) return ctx.answerCbQuery();

  await ctx.answerCbQuery('Hisobot tayyorlanmoqda...');

  const { from, to } = getDateRange(period);
  const complaints = await complaintModel.findByDateRange(from, to);

  if (complaints.length === 0) {
    await ctx.reply(`📭 ${label} davr uchun murojaatlar topilmadi.`, ceoKeyboard());
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Hisobot');

  sheet.columns = [
    { header: 'F.I.Sh', key: 'fullName', width: 28 },
    { header: 'Telefon raqami', key: 'phoneNumber', width: 18 },
    { header: 'Mavzu', key: 'topic', width: 30 },
    { header: 'Savol', key: 'question', width: 50 },
    { header: 'Javob', key: 'answer', width: 50 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const complaint of complaints) {
    sheet.addRow({
      fullName: complaint.fullName || "Noma'lum",
      phoneNumber: complaint.phoneNumber || "Noma'lum",
      topic: t('uz', `topics.${complaint.topicKey}`),
      question: complaint.originalText,
      answer: complaint.ceoAnswerText || '',
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `hisobot_${period}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  await ctx.replyWithDocument(
    { source: Buffer.from(buffer), filename: fileName },
    { caption: `📊 ${label} hisobot — ${complaints.length} ta murojaat.` }
  );
  await ctx.reply('Yana hisobot kerak bo\'lsa, "📊 Hisobot" tugmasini bosing.', ceoKeyboard());
}

module.exports = { handleHisobotButton, handleReportPeriod };
