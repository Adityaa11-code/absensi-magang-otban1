/**
 * Helper waktu dan tanggal dalam zona waktu Indonesia Barat (WIB, Asia/Jakarta)
 */
function getWIBDateTime() {
  const now = new Date();
  // Format Indonesia WIB
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const partMap = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  const dateStr = `${partMap.year}-${partMap.month}-${partMap.day}`;
  const timeStr = `${partMap.hour}:${partMap.minute}:${partMap.second}`;

  return {
    date: dateStr,
    time: timeStr,
    hour: parseInt(partMap.hour, 10),
    minute: parseInt(partMap.minute, 10),
  };
}

module.exports = {
  getWIBDateTime,
};
