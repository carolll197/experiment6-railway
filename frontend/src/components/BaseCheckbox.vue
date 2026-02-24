<template>
  <label class="base-checkbox">
    <input type="checkbox" :checked="modelValue" @change="$emit('update:modelValue', $event.target.checked)" />
    <span class="label">{{ label }}</span>
  </label>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  label: { type: String, default: '' },
});
defineEmits(['update:modelValue']);
</script>

<style scoped>
.base-checkbox { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--color-text); cursor: pointer; }
.base-checkbox input { width: 16px; height: 16px; }
.label { font-weight: 500; }
</style>
