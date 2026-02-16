/**
 * 将后端存储的 UTC 时间字符串转为中国北京时间（UTC+8）显示
 * 后端使用 toISOString() 存的是 UTC，如 "2025-02-16 10:30:00" 表示 UTC 该时刻
 */
export function formatBeijingTime(str) {
  if (!str || typeof str !== 'string') return '—';
  const s = str.trim();
  if (!s) return '—';
  // 若没有 Z 或时区，按 UTC 解析
  const utcStr = s.includes('Z') || /[+-]\d{2}:?\d{2}$/.test(s) ? s : s.replace(' ', 'T') + 'Z';
  let date;
  try {
    date = new Date(utcStr);
  } catch {
    return str;
  }
  if (Number.isNaN(date.getTime())) return str;
  return date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}
