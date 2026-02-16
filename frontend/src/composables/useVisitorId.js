/**
 * 同一浏览器持久化 visitor_id（cookie），用于与后端进度关联（同 IP + 同浏览器可恢复进度）
 */
const COOKIE_NAME = 'exp_visitor_id';
const MAX_AGE_YEAR = 365 * 24 * 60 * 60;

function genId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getCookie(name) {
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : '';
}

function setCookie(name, value, maxAge) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax`;
}

export function useVisitorId() {
  let id = getCookie(COOKIE_NAME);
  if (!id || id.length < 10) {
    id = genId();
    setCookie(COOKIE_NAME, id, MAX_AGE_YEAR);
  }
  return id;
}

export function getVisitorId() {
  return useVisitorId();
}
