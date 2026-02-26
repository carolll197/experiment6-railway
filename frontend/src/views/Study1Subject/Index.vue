<template>
  <div class="study1-subject">
    <Step0Consent v-if="step === 0" @next="onStepNext(1)" />
    <Step1Collect v-else-if="step === 1" v-model:subject-id="subjectId" v-model:name="name" @next="onStep1Next" />
    <Step2Cse v-else-if="step === 2" :subject-id="subjectId" :initial-cse-scores="progressData.step2Cse" @next="onStepNext(3)" @save="onStep2Save" />
    <Step3Intro1 v-else-if="step === 3" @next="onStepNext(4)" />
    <Step4Creative1
      v-else-if="step === 4"
      :subject-id="subjectId"
      :name="name"
      :initial-form="progressData.step4Form"
      :initial-timer-remaining="progressData.step4TimerRemaining"
      :start-time="startTime"
      @next="onPhase1Done"
      @save="onStep4Save"
    />
    <!-- 比较页：key 每次变化强制重新挂载，实现每次进入/刷新都随机左右顺序 -->
    <Step5Compare
      v-else-if="step === 5"
      :key="step5CompareKey"
      :phase1-plan="phase1Plan"
      :subject-id="subjectId"
      @next="onStepNext(6)"
      @save="onStep5Save"
    />
    <Step6Intro2 v-else-if="step === 6" @next="onStepNext(8)" />
    <Step8Round2 v-else-if="step === 8" :subject-id="subjectId" :name="name" :initial-state="progressData.step8" @next="onStep8Next" @save="onStep8Save" />
    <Step9Thanks v-else-if="step === 9" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import Step0Consent from './Step0Consent.vue';
import Step1Collect from '../PreSubject/Step1Collect.vue';
import Step2Cse from './Step2Cse.vue';
import Step3Intro1 from './Step3Intro1.vue';
import Step4Creative1 from './Step4Creative1.vue';
import Step5Compare from './Step5Compare.vue';
import Step6Intro2 from './Step6Intro2.vue';
import Step8Round2 from './Step8Round2.vue';
import Step9Thanks from './Step9Thanks.vue';
import { useVisitorId } from '../../composables/useVisitorId.js';

const visitorId = useVisitorId();
const step = ref(0);
const subjectId = ref('');
const name = ref('');
const phase1Plan = ref({});
const progressData = ref({});
const startTime = ref(null);
const endTime = ref(null);
/** 每次显示比较页时更新，强制 Step5Compare 重新挂载以得到新随机顺序 */
const step5CompareKey = ref(0);

watch(step, (s) => {
  if (s === 5) step5CompareKey.value = Date.now();
});

function headers() {
  return { 'Content-Type': 'application/json', 'X-Visitor-Id': visitorId.value ?? '' };
}

function saveProgress(s, patch) {
  const data = { ...progressData.value, phase1Plan: phase1Plan.value, ...patch };
  progressData.value = data;
  fetch('/api/study1-subject/progress', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      step: s,
      subject_id: subjectId.value,
      name: name.value,
      data,
      submitted: s === 9,
      startTime: startTime.value,
      endTime: s === 9 ? new Date().toISOString() : endTime.value,
    }),
  }).catch(() => {});
}

function onStep2Save(payload) {
  saveProgress(2, { step2Cse: payload?.step2Cse });
}
function onStep4Save(payload) {
  saveProgress(4, { step4Form: payload?.step4Form, step4TimerRemaining: payload?.step4TimerRemaining });
}
function onStep5Save(payload) {
  saveProgress(5, {
    step5Scores: payload?.step5Scores,
    step5SubmitStep: payload?.step5SubmitStep,
    step5ChosenSide: payload?.step5ChosenSide,
    step5LeftFirst: payload?.step5LeftFirst,
  });
}
function onStep8Save(payload) {
  saveProgress(8, { step8: payload });
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
  // 记录开始时间
  startTime.value = new Date().toISOString();
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
        if (data.data && typeof data.data === 'object') {
          progressData.value = data.data;
          if (data.data.phase1Plan) phase1Plan.value = data.data.phase1Plan;
        }
        if (data.startTime) startTime.value = data.startTime;
        if (data.endTime) endTime.value = data.endTime;
      }
    })
    .catch(() => {});
});
</script>
