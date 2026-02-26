<template>
  <div class="study1-expert">
    <Step0Info v-if="step === 0" v-model:name="expertName" @next="onStep0Next" />
    <Step1Flow v-else-if="step === 1" @next="onStep1Next" />
    <Step2Score
      v-else-if="step === 2"
      :expert-name="expertName"
      :initial-progress="expertInitialProgress"
      @next="step = 3"
    />
    <Step3Thanks v-else-if="step === 3" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import Step0Info from './Step0Info.vue';
import Step1Flow from './Step1Flow.vue';
import Step2Score from './Step2Score.vue';
import Step3Thanks from './Step3Thanks.vue';

const EXPERT_NAME_KEY = 'study1-expert-name';

const step = ref(0);
const expertName = ref('');
const expertInitialProgress = ref(null);

function onStep0Next() {
  try {
    if (expertName.value) localStorage.setItem(EXPERT_NAME_KEY, expertName.value);
  } catch (_) {}
  step.value = 1;
}

function onStep1Next() {
  step.value = 2;
  expertInitialProgress.value = null;
}

function saveProgressBackend(stepVal, payload = {}) {
  const name = expertName.value || '';
  if (!name) return;
  fetch('/api/study1-expert/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expert_name: name, step: stepVal, ...payload }),
  }).catch(() => {});
}

watch(step, (s) => {
  if (s === 3) saveProgressBackend(3);
});

onMounted(() => {
  let name = '';
  try {
    name = localStorage.getItem(EXPERT_NAME_KEY) || '';
  } catch (_) {}
  if (!name) return;
  expertName.value = name;
  fetch(`/api/study1-expert/progress?expert_name=${encodeURIComponent(name)}`)
    .then((r) => r.json())
    .then((data) => {
      const s = data.step != null ? Number(data.step) : 0;
      if (s === 2 && (data.scores_by_subject || data.current_subject_id != null)) {
        step.value = 2;
        expertInitialProgress.value = {
          current_subject_id: data.current_subject_id || '',
          scores_by_subject: data.scores_by_subject && typeof data.scores_by_subject === 'object' ? data.scores_by_subject : {},
        };
      } else if (s === 3) {
        step.value = 3;
      }
    })
    .catch(() => {});
});
</script>
