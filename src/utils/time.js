function formatRelativeTime(date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return 'hozirgina';
  if (minutes < 60) return `${minutes} daqiqa oldin`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} soat oldin`;

  const days = Math.floor(hours / 24);
  return `${days} kun oldin`;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Calendar-aligned ranges: "kunlik" = today so far, "haftalik" = the last 7
// calendar days including today, "oylik" = this calendar month so far.
function getDateRange(period) {
  const now = new Date();

  if (period === 'daily') {
    return { from: startOfDay(now), to: now };
  }
  if (period === 'weekly') {
    const from = startOfDay(now);
    from.setDate(from.getDate() - 6);
    return { from, to: now };
  }
  if (period === 'monthly') {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  }
  throw new Error(`Unknown report period: ${period}`);
}

module.exports = { formatRelativeTime, getDateRange };
