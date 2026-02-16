<template>
  <label class="base-checkbox-wrap">
    <span class="custom-checkbox" :class="{ checked: modelValue }">
      <svg v-if="modelValue" class="check-icon" viewBox="0 0 16 16" fill="none">
        <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </span>
    <input
      type="checkbox"
      class="sr-only"
      :checked="modelValue"
      @change="$emit('update:modelValue', $event.target.checked)"
    />
    <span class="base-checkbox-label">{{ label }}</span>
  </label>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, default: '' },
});
defineEmits(['update:modelValue']);
</script>

<style scoped>
.base-checkbox-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
.custom-checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 2px solid #BDBDBD;
  border-radius: 2px;
  background: #FFFFFF;
  flex-shrink: 0;
  transition: all 0.15s;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.05);
}
.custom-checkbox.checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}
.check-icon {
  width: 12px;
  height: 12px;
}
.base-checkbox-label {
  user-select: none;
}
</style>
