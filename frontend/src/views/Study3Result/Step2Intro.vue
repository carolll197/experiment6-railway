<template>
  <div class="intro-wrap">
    <h1 class="text-h1 center">实验内容说明</h1>
    <div class="file-container">
      <p class="text-body">您好，欢迎参加本实验！以下是创意简报（包括广告题目要求、产品特征等信息）、产出要求规范及评价维度，您将与系统内置的AI协作生成1份广告策划案。</p>
      <p class="text-body">在协作开始前，请您仔细阅读以下信息，并先自行构思方案。</p>
    </div>
    <div class="file-container">
      <h2 class="text-h2">创意简报</h2>
      <div class="scroll-inner scroll-inner-large">
        <BriefContent :content="briefStudy3" />
      </div>
    </div>
    <div class="file-container">
      <h2 class="text-h2">产出要求</h2>
      <div class="scroll-inner scroll-inner-large">
        <BriefContent :content="outputRequirementStudy3" />
      </div>
    </div>
    <div class="file-container">
      <h2 class="text-h2">评价维度</h2>
      <div class="scroll-inner scroll-inner-small">
        <EvalDimension />
      </div>
    </div>
    <p class="text-hint center">请先阅读信息，倒计时结束后可开始协作。</p>
    <div class="btn-row">
      <BasePrimaryButton label="开始协作" :enabled="countdown === 0" :countdown="countdown" @click="onNext" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import BasePrimaryButton from '../../components/BasePrimaryButton.vue';
import EvalDimension from '../../components/EvalDimension.vue';
import BriefContent from '../../components/BriefContent.vue';
import { briefStudy3, outputRequirementStudy3 } from '../../content/study3Content.js';

const emit = defineEmits(['next']);
const countdown = ref(180);
let timer = null;

onMounted(() => {
  countdown.value = 180;
  timer = setInterval(() => {
    if (countdown.value > 0) countdown.value--;
    else if (timer) clearInterval(timer);
  }, 1000);
});
onUnmounted(() => { if (timer) clearInterval(timer); });

function onNext() {
  if (countdown.value > 0) return;
  emit('next');
}
</script>

<style scoped>
.intro-wrap { min-height: 100vh; background: var(--color-page-bg); padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.file-container { background: #F0F9FF; border-left: 4px solid #57adde; padding: 16px; width: 90%; max-width: 900px; margin: 8px 0; }
.scroll-inner { background: #F5FBFF; border: 1px solid #DCD8D3; padding: 12px; margin: 8px 0; overflow: auto; }
.scroll-inner-large { max-height: 300px; }
.scroll-inner-small { max-height: 200px; }
.btn-row { margin-top: 16px; display: flex; justify-content: center; }
</style>
