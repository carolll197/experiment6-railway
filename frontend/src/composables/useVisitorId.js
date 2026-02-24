import { ref, onMounted } from 'vue';

function getOrCreateId() {
  if (typeof localStorage === 'undefined') return '';
  let id = localStorage.getItem('experiment6_visitor_id');
  if (!id) {
    id = 'v_' + Math.random().toString(36).slice(2, 12) + '_' + Date.now();
    localStorage.setItem('experiment6_visitor_id', id);
  }
  return id;
}

export function useVisitorId() {
  const visitorIdRef = ref(getOrCreateId());
  onMounted(() => {
    if (!visitorIdRef.value) visitorIdRef.value = getOrCreateId();
  });
  return visitorIdRef;
}
