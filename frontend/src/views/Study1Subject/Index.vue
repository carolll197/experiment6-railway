<template>
  <div class="study1-subject">
    <Step0Consent v-if="step === 0" @next="step = 1" />
    <Step1Collect v-else-if="step === 1" v-model:subject-id="subjectId" v-model:name="name" @next="onStep1Next" />
    <Step2Cse v-else-if="step === 2" :subject-id="subjectId" @next="step = 3" />
    <Step3Intro1 v-else-if="step === 3" @next="step = 4" />
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
      @next="step = 6"
    />
    <Step6Intro2 v-else-if="step === 6" @next="step = 7" />
    <Step7Round1 v-else-if="step === 7" :subject-id="subjectId" :name="name" @next="step = 8" />
    <Step8Round2 v-else-if="step === 8" :subject-id="subjectId" :name="name" @next="step = 9" />
    <Step9Thanks v-else-if="step === 9" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
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

const step = ref(0);
const subjectId = ref('');
const name = ref('');
const phase1Plan = ref({});

function onStep1Next() {
  fetch('/api/study1-subject/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject_id: subjectId.value, name: name.value }),
  }).catch(() => {}).finally(() => { step.value = 2; });
}

function onPhase1Done(payload) {
  phase1Plan.value = payload || {};
  step.value = 5;
}
</script>
