<template>
  <div class="pre-subject">
    <Step0Consent v-if="step === 0" @next="step = 1" />
    <Step1Collect
      v-else-if="step === 1"
      v-model:subject-id="subjectId"
      v-model:name="name"
      @next="step = 2"
    />
    <Step2Intro v-else-if="step === 2" @next="step = 3" />
    <Step3Creative
      v-else-if="step === 3"
      :subject-id="subjectId"
      :name="name"
      @next="step = 4"
    />
    <Step4Thanks v-else-if="step === 4" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Step0Consent from './Step0Consent.vue';
import Step1Collect from './Step1Collect.vue';
import Step2Intro from './Step2Intro.vue';
import Step3Creative from './Step3Creative.vue';
import Step4Thanks from './Step4Thanks.vue';

const step = ref(0);
const subjectId = ref('');
const name = ref('');
</script>
