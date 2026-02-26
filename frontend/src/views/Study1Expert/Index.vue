<template>
  <div class="study1-expert">
    <Step0Info v-if="step === 0" v-model:name="expertName" @next="step = 1" />
    <Step1Flow v-else-if="step === 1" @next="step = 2" />
    <Step2Score v-else-if="step === 2" :expert-name="expertName" @next="step = 3" />
    <Step3Thanks v-else-if="step === 3" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Step0Info from './Step0Info.vue';
import Step1Flow from './Step1Flow.vue';
import Step2Score from './Step2Score.vue';
import Step3Thanks from './Step3Thanks.vue';

const step = ref(0);
const expertName = ref('');
</script>
