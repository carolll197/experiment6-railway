<template>
  <div class="score-axis">
    <button
      v-for="n in 7"
      :key="n"
      type="button"
      class="axis-btn"
      :class="{ selected: modelValue === n }"
      @click="$emit('update:modelValue', n)"
    >
      {{ n }}
    </button>
    <span v-if="modelValue !== null" class="score-display text-score">{{ modelValue }}分</span>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: Number, default: null },
});
defineEmits(['update:modelValue']);
</script>

<style scoped>
.score-axis {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.axis-btn {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid var(--color-score-axis-border);
  background: var(--color-input-bg);
  font-size: 12px;
  color: var(--color-text);
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.axis-btn.selected {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;
}
.axis-btn:hover:not(.selected) {
  border-color: var(--color-secondary);
}
.score-display {
  margin-left: 4px;
}
</style>
