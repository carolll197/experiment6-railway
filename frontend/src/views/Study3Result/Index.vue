<template>
  <div class="study3-result">
    <Step0Consent v-if="step === 0" @next="onStepNext(1)" />
    <Step1Collect v-else-if="step === 1" v-model:subject-id="subjectId" v-model:name="name" @next="onStep1Next" />
    <Step2Cse v-else-if="step === 2" :subject-id="subjectId" :initial-cse-scores="progressData.step2Cse" @next="onStepNext(3)" @save="onStep2Save" />
    <Step2Intro v-else-if="step === 3" @next="onStepNext(4)" />
    <Step3Collab v-else-if="step === 4" :subject-id="subjectId" :name="name" :initial-state="progressData.step4" @next="onStepNext(5)" @save="onStep4Save" />
    <StepThanks v-else-if="step === 5" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Step0Consent from './Step0Consent.vue';
import Step1Collect from '../PreSubject/Step1Collect.vue';
import Step2Cse from '../Study1Subject/Step2Cse.vue';
import Step2Intro from './Step2Intro.vue';
import Step3Collab from './Step3Collab.vue';
import StepThanks from '../Study2Process/StepThanks.vue';
import { useVisitorId } from '../../composables/useVisitorId.js';

const visitorId = useVisitorId();
const step = ref(0);
const subjectId = ref('');
const name = ref('');
const progressData = ref({});

function headers() {
  return { 'Content-Type': 'application/json', 'X-Visitor-Id': visitorId.value ?? '' };
}

function saveProgress(s, patch) {
  const data = { ...progressData.value, ...patch };
  progressData.value = data;
  fetch('/api/study3-subject/progress', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ step: s, subject_id: subjectId.value, name: name.value, group_type: 'result', data, submitted: s === 5 }),
  }).catch(() => {});
}

function onStepNext(nextStep) {
  if (nextStep === 3 && progressData.value.step2Cse) {
    fetch('/api/study3-subject/cse', {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ subject_id: subjectId.value, group_type: 'result', scores: progressData.value.step2Cse }),
    }).catch(() => {});
  }
  step.value = nextStep;
  saveProgress(nextStep);
}

function onStep1Next() {
  fetch('/api/study3-subject/register', {
    method: 'POST', headers: headers(),
    body: JSON.stringify({ subject_id: subjectId.value, name: name.value, group_type: 'result' }),
  }).catch(() => {}).finally(() => { step.value = 2; saveProgress(2); });
}

function onStep2Save(payload) { saveProgress(2, { step2Cse: payload?.step2Cse }); }
function onStep4Save(payload) { saveProgress(4, { step4: payload }); }

onMounted(() => {
  fetch(`/api/study3-subject/progress?group=result`, { headers: headers() })
    .then((r) => r.json())
    .then((data) => {
      if (data.submitted) { step.value = 5; return; }
      if (data.step != null && data.step > 0) {
        step.value = data.step;
        if (data.subjectId) subjectId.value = data.subjectId;
        if (data.name) name.value = data.name;
        if (data.data && typeof data.data === 'object') progressData.value = data.data;
      }
    })
    .catch(() => {});
});
</script>

