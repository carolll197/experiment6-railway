<template>
  <div class="page-wrap page-consent">
    <div class="cse-intro panel-border text-hint center">
      在正式开始实验前，请您按照个人的实际情况完成以下题目。
    </div>
    <div class="file-container cse-list">
      <div v-for="item in cseItems" :key="item.no" class="cse-item">
        <span class="text-h3">{{ item.no }}. {{ item.text }}</span>
        <BaseScoreAxis :model-value="cseScores[item.no]" @update:model-value="setScore(item.no, $event)" />
      </div>
    </div>
    <div style="margin-top: 20px; text-align: center;">
      <BasePrimaryButton label="下一步" :enabled="allFilled" @click="onNext" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import BaseScoreAxis from '../../components/BaseScoreAxis.vue';
import BasePrimaryButton from '../../components/BasePrimaryButton.vue';
import { cseItems } from '../../content/study1Content.js';

const props = defineProps({
  subjectId: { type: String, default: '' },
  initialCseScores: { type: Object, default: null },
});
const emit = defineEmits(['next', 'save']);

const defaultScores = () => ({ 1: null, 2: null, 3: null, 4: null });
const cseScores = ref({ ...defaultScores() });

onMounted(() => {
  const init = props.initialCseScores;
  if (init && typeof init === 'object') {
    const o = { ...defaultScores() };
    for (const k of [1, 2, 3, 4]) if (init[k] != null) o[k] = init[k];
    cseScores.value = o;
  }
});

let saveTimer = null;
watch(
  () => ({ ...cseScores.value }),
  () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      emit('save', { step2Cse: { ...cseScores.value } });
      saveTimer = null;
    }, 500);
  },
  { deep: true }
);

function setScore(no, value) {
  cseScores.value[no] = value;
}

const allFilled = computed(() => [1, 2, 3, 4].every((n) => cseScores.value[n] != null));

async function onNext() {
  if (!allFilled.value) return;
  try {
    await fetch('/api/study1-subject/cse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject_id: props.subjectId,
        scores: cseScores.value,
      }),
    });
  } catch (e) {
    console.error('CSE提交失败', e);
  }
  emit('next');
}
</script>

<style scoped>
.cse-intro {
  padding: 12px;
  background: var(--color-input-bg);
  margin: 20px auto;
  width: 90%;
  max-width: 600px;
}
.cse-list { padding: 16px; margin: 0 auto; width: 90%; max-width: 640px; }
.cse-item { margin-bottom: 15px; }
.cse-item:last-child { margin-bottom: 0; }
.cse-item .text-h3 { display: block; margin-bottom: 4px; }
</style>
