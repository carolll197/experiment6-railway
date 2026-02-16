<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-mask" @click.self="onMaskClick">
      <div class="modal-box panel-border">
        <h2 v-if="title" class="text-h2">{{ title }}</h2>
        <div class="text-body modal-body"><slot /></div>
        <div class="modal-actions">
          <button
            type="button"
            class="modal-btn"
            @click="$emit('confirm')"
          >{{ confirmText }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '' },
  confirmText: { type: String, default: '确认' },
  closeOnMask: { type: Boolean, default: false },
});
const emit = defineEmits(['confirm', 'close']);
function onMaskClick() {
  if (props.closeOnMask) emit('close');
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: var(--color-mask);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  width: 80%;
  max-width: 480px;
  background: #F5FBFF;
  border: 1px solid var(--color-secondary);
  border-radius: 6px;
  padding: 20px;
}
.panel-border {
  /* override to avoid conflict — modal uses its own border */
  border: none;
}
@media (max-width: 640px) {
  .modal-box { width: 90%; }
}
.modal-body {
  margin: 12px 0;
}
.modal-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 16px;
}
.modal-btn {
  width: 80px;
  height: 36px;
  border-radius: 4px;
  border: none;
  background: var(--color-active-bg);
  color: var(--color-text);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.modal-btn:hover {
  background: var(--color-secondary);
}
</style>
