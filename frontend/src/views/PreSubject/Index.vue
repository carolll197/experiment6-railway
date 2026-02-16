<template>
  <div class="pre-subject">
    <Step0Consent v-if="step === 0" @next="onStepNext(1)" />
    <Step1Collect
      v-else-if="step === 1"
      v-model:subject-id="subjectId"
      v-model:name="name"
      @next="onStepNext(2)"
    />
    <Step2Intro v-else-if="step === 2" @next="onStepNext(3)" />
    <Step3Creative
      v-else-if="step === 3"
      :subject-id="subjectId"
      :name="name"
      :visitor-id="visitorId"
      :initial-creative-form="creativeForm"
      @next="step = 4"
      @save-progress="onSaveCreativeProgress"
    />
    <Step4Thanks v-else-if="step === 4" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Step0Consent from './Step0Consent.vue';
import Step1Collect from './Step1Collect.vue';
import Step2Intro from './Step2Intro.vue';
import Step3Creative from './Step3Creative.vue';
import Step4Thanks from './Step4Thanks.vue';
import { useVisitorId } from '../../composables/useVisitorId.js';

const visitorId = useVisitorId();
const step = ref(0);
const subjectId = ref('');
const name = ref('');
const creativeForm = ref({});

function headers() {
  return { 'Content-Type': 'application/json', 'X-Visitor-Id': visitorId };
}

function onStepNext(nextStep) {
  step.value = nextStep;
  saveProgress(nextStep);
}

function saveProgress(currentStep, creativeFormData) {
  fetch('/api/pre-subject/progress', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      step: currentStep,
      subject_id: subjectId.value,
      name: name.value,
      creativeForm: creativeFormData ?? creativeForm.value,
    }),
  }).catch(() => {});
}

function onSaveCreativeProgress(form) {
  creativeForm.value = form;
  saveProgress(3, form);
}

onMounted(() => {
  fetch('/api/pre-subject/progress', { headers: headers() })
    .then((r) => r.json())
    .then((data) => {
      if (data.submitted) {
        step.value = 4;
        return;
      }
      if (data.step != null && data.step > 0) {
        step.value = data.step;
        if (data.subjectId != null) subjectId.value = data.subjectId;
        if (data.name != null) name.value = data.name;
        if (data.creativeForm && typeof data.creativeForm === 'object') creativeForm.value = data.creativeForm;
      }
    })
    .catch(() => {});
});
</script>
