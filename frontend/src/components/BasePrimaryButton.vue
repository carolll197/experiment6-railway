<template>
  <button
    type="button"
    class="base-primary-btn"
    :class="[{ disabled: !enabled }, sizeClass]"
    :disabled="!enabled"
    @click="$emit('click')"
  >
    <span class="btn-label">{{ label }}</span>
    <span v-if="countdown !== null && countdown > 0" class="btn-countdown text-score">({{ countdown }})</span>
  </button>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({
  label: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  countdown: { type: Number, default: null },
  size: { type: String, default: 'primary', validator: v => ['primary', 'regular'].includes(v) },
});
defineEmits(['click']);
const sizeClass = computed(() => props.size === 'regular' ? 'btn-regular-size' : 'btn-primary-size');
</script>

<style scoped>
.base-primary-btn {
  height: 36px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  font-size: 14px;
  font-weight: 500;
  color: #333333;
  background: var(--color-active-bg);
}
.btn-primary-size { width: 120px; }
.btn-regular-size { width: 80px; }
.base-primary-btn:hover:not(.disabled) {
  background: var(--color-secondary);
}
.base-primary-btn.disabled {
  background: var(--color-btn-disabled-bg);
  color: var(--color-btn-disabled-text);
  cursor: not-allowed;
}
.btn-countdown {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 12px;
}
.btn-label {}
</style>
