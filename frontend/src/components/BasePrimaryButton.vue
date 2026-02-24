<template>
  <button
    type="button"
    class="btn-primary"
    :disabled="!enabled"
    @click="$emit('click')"
  >
    {{ label }}
    <span v-if="countdown > 0" class="text-score">({{ countdown }})</span>
  </button>
</template>

<script setup>
defineProps({
  label: { type: String, default: '确定' },
  enabled: { type: Boolean, default: true },
  countdown: { type: Number, default: 0 },
});
defineEmits(['click']);
</script>

<style scoped>
.btn-primary {
  min-width: 120px;
  height: 36px;
  padding: 0 16px;
  border-radius: 4px;
  border: none;
  background: var(--color-active-bg);
  color: var(--color-text);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.btn-primary:disabled {
  background: var(--color-btn-disabled-bg);
  color: var(--color-btn-disabled-text);
  cursor: not-allowed;
}
</style>
