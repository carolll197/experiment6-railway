<template>
  <div class="base-textarea-wrap">
    <textarea
      class="base-textarea"
      :value="modelValue"
      :placeholder="placeholder"
      rows="4"
      @input="onInput"
    />
    <div v-if="showCount" class="char-count text-label">({{ currentLength }}字)</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  showCount: { type: Boolean, default: false },
  minLength: { type: Number, default: 20 },
});
const emit = defineEmits(['update:modelValue']);

const currentLength = computed(() => (props.modelValue || '').length);

function onInput(e) {
  emit('update:modelValue', e.target.value);
}
</script>

<style scoped>
.base-textarea-wrap {
  width: 100%;
  position: relative;
}
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
  font-family: inherit;
}
.base-textarea::placeholder {
  color: var(--color-hint);
  font-size: 13px;
  font-style: italic;
}
.base-textarea:focus {
  outline: none;
  border-bottom-color: var(--color-primary);
}
.char-count {
  position: absolute;
  bottom: 6px;
  right: 10px;
}
</style>
