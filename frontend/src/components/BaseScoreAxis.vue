<template>
  <div class="score-axis">
    <button
      v-for="n in 7"
      :key="n"
      type="button"
      class="score-btn"
      :class="{ active: modelValue === n }"
      @click="$emit('update:modelValue', n)"
    >
      {{ n }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: Number, default: null },
});
defineEmits(['update:modelValue']);
</script>

<style scoped>
.score-axis { display: flex; gap: 6px; flex-wrap: wrap; }
.score-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-secondary);
  border-radius: 4px;
  background: var(--color-input-bg);
  color: var(--color-text);
  font-size: 14px;
  cursor: pointer;
}
.score-btn.active { background: var(--color-active-bg); border-color: var(--color-primary); }
</style>
