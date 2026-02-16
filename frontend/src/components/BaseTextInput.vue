<template>
  <input
    type="text"
    class="base-text-input"
    :value="modelValue"
    :placeholder="placeholder"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
});
defineEmits(['update:modelValue']);
</script>

<style scoped>
.base-text-input {
  width: 100%;
  padding: 10px;
  border: none;
  border-bottom: 1px solid var(--color-secondary);
  background: var(--color-input-bg);
  font-size: 14px;
  color: var(--color-text);
}
.base-text-input::placeholder {
  color: var(--color-hint);
  font-size: 13px;
  font-style: italic;
}
.base-text-input:focus {
  outline: none;
  border-bottom-color: var(--color-primary);
}
</style>
