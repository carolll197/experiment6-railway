/**
 * 将 ISO 或时间戳格式化为北京时间显示
 * @param {string|number|null|undefined} dateStr
 * @returns {string}
 */
export function formatBeijingTime(dateStr) {
  if (dateStr == null || dateStr === '') return '—';
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return String(dateStr);
  }
}
