<template>
  <div class="page-wrap page-consent">
    <div class="cse-intro panel-border text-hint center">
      请根据您的实际情况和感受完成以下题目。
    </div>
    <div class="file-container cse-list">
      <template v-for="section in sections" :key="section.key">
        <p class="section-intro text-body" v-if="section.intro" style="margin: 16px 0 8px;">{{ section.intro }}</p>
        <div v-for="item in section.items" :key="item.key" class="cse-item">
          <span class="text-h3">{{ item.no }}. {{ item.text }}</span>
          <BaseScoreAxis :model-value="scores[item.key]" @update:model-value="setScore(item.key, $event)" />
        </div>
      </template>
    </div>
    <div style="margin-top: 20px; text-align: center;">
      <BasePrimaryButton label="下一页" :enabled="allFilled" @click="onNext" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import BaseScoreAxis from '../../components/BaseScoreAxis.vue';
import BasePrimaryButton from '../../components/BasePrimaryButton.vue';
import { postTestPage1 } from '../../content/study2Content.js';

const props = defineProps({
  initialScores: { type: Object, default: null },
});
const emit = defineEmits(['next', 'save']);

const sections = postTestPage1.sections;
const allKeys = sections.flatMap((s) => s.items.map((i) => i.key));
const scores = ref(
  props.initialScores && typeof props.initialScores === 'object'
    ? { ...Object.fromEntries(allKeys.map((k) => [k, null])), ...props.initialScores }
    : Object.fromEntries(allKeys.map((k) => [k, null]))
);

function setScore(key, value) {
  scores.value[key] = value;
  emit('save', { ...scores.value });
}

const allFilled = computed(() => allKeys.every((k) => scores.value[k] != null));

function onNext() {
  if (!allFilled.value) return;
  emit('next', { ...scores.value });
}
</script>

<style scoped>
.cse-intro { padding: 12px; background: var(--color-input-bg); margin: 20px auto; width: 90%; max-width: 640px; }
.cse-list { padding: 16px; margin: 0 auto; width: 90%; max-width: 640px; }
.cse-item { margin-bottom: 15px; }
.cse-item:last-child { margin-bottom: 0; }
.cse-item .text-h3 { display: block; margin-bottom: 4px; }
.section-intro { font-weight: 500; }
</style>
