<template>
  <div class="base-textarea-wrap">
    <textarea
      class="base-textarea"
      :value="modelValue"
      :placeholder="placeholder"
      @input="onInput"
    />
    <span v-if="showCount" class="char-count text-hint">{{ (modelValue || '').length }}{{ minLength ? ` / ${minLength}` : '' }}</span>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  showCount: { type: Boolean, default: false },
  minLength: { type: Number, default: 0 },
});
const emit = defineEmits(['update:modelValue']);
function onInput(e) {
  emit('update:modelValue', e.target.value);
}
</script>

<style scoped>
.base-textarea-wrap { position: relative; }
.base-textarea {
  width: 100%;
  min-height: 80px;
  padding: 10px;
  border: none;
  border-bottom: 1px solid var(--color-secondary);
  background: var(--color-input-bg);
  font-size: 14px;
  color: var(--color-text);
  resize: vertical;
}
.base-textarea::placeholder { color: var(--color-hint); }
.char-count { position: absolute; right: 8px; bottom: 4px; font-size: 12px; }
</style>
