<template>
  <div class="study1-subject">
    <Step0Consent v-if="step === 0" @next="onStepNext(1)" />
    <Step1Collect v-else-if="step === 1" v-model:subject-id="subjectId" v-model:name="name" @next="onStep1Next" />
    <Step2Cse v-else-if="step === 2" :subject-id="subjectId" @next="onStepNext(3)" />
    <Step3Intro1 v-else-if="step === 3" @next="onStepNext(4)" />
    <Step4Creative1
      v-else-if="step === 4"
      :subject-id="subjectId"
      :name="name"
      @next="onPhase1Done"
    />
    <Step5Compare
      v-else-if="step === 5"
      :phase1-plan="phase1Plan"
      :subject-id="subjectId"
      @next="onStepNext(6)"
    />
    <Step6Intro2 v-else-if="step === 6" @next="onStepNext(7)" />
    <Step7Round1 v-else-if="step === 7" :subject-id="subjectId" :name="name" @next="onStepNext(8)" />
    <Step8Round2 v-else-if="step === 8" :subject-id="subjectId" :name="name" @next="onStep8Next" />
    <Step9Thanks v-else-if="step === 9" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Step0Consent from './Step0Consent.vue';
import Step1Collect from '../PreSubject/Step1Collect.vue';
import Step2Cse from './Step2Cse.vue';
import Step3Intro1 from './Step3Intro1.vue';
import Step4Creative1 from './Step4Creative1.vue';
import Step5Compare from './Step5Compare.vue';
import Step6Intro2 from './Step6Intro2.vue';
import Step7Round1 from './Step7Round1.vue';
import Step8Round2 from './Step8Round2.vue';
import Step9Thanks from './Step9Thanks.vue';
import { useVisitorId } from '../../composables/useVisitorId.js';

const visitorId = useVisitorId();
const step = ref(0);
const subjectId = ref('');
const name = ref('');
const phase1Plan = ref({});

function headers() {
  return { 'Content-Type': 'application/json', 'X-Visitor-Id': visitorId };
}

function saveProgress(s) {
  fetch('/api/study1-subject/progress', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      step: s,
      subject_id: subjectId.value,
      name: name.value,
      data: { phase1Plan: phase1Plan.value },
      submitted: s === 9,
    }),
  }).catch(() => {});
}

function onStepNext(nextStep) {
  step.value = nextStep;
  saveProgress(nextStep);
}

function onStep1Next() {
  fetch('/api/study1-subject/register', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ subject_id: subjectId.value, name: name.value }),
  })
    .catch(() => {})
    .finally(() => {
      step.value = 2;
      saveProgress(2);
    });
}

function onPhase1Done(payload) {
  phase1Plan.value = payload || {};
  step.value = 5;
  saveProgress(5);
}

function onStep8Next() {
  step.value = 9;
  saveProgress(9);
}

onMounted(() => {
  fetch('/api/study1-subject/progress', { headers: headers() })
    .then((r) => r.json())
    .then((data) => {
      if (data.submitted) {
        step.value = 9;
        return;
      }
      if (data.step != null && data.step > 0) {
        step.value = data.step;
        if (data.subjectId != null) subjectId.value = data.subjectId;
        if (data.name != null) name.value = data.name;
        if (data.data?.phase1Plan) phase1Plan.value = data.data.phase1Plan;
      }
    })
    .catch(() => {});
});
</script>
