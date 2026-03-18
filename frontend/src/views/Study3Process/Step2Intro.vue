<template>
  <div class="intro-wrap">
    <h1 class="text-h1 center">实验内容说明</h1>
    <div class="file-container">
      <p class="text-body">您好，欢迎参加本实验！以下是创意简报（包括广告题目要求、产品特征等信息）、产出要求规范及评价维度。在本实验中，系统内置的AI 将作为您的创意合作伙伴，您可以与它进行【限时8分钟】的讨论，完成1份广告策划案的生成。</p>
    </div>
    <div class="file-container">
      <h2 class="text-h2">创意简报</h2>
      <div class="scroll-inner">
        <BriefContent :content="briefStudy3" />
      </div>
    </div>
    <div class="file-container">
      <h2 class="text-h2">产出要求</h2>
      <div class="scroll-inner">
        <BriefContent :content="outputRequirementStudy3" />
      </div>
    </div>
    <div class="file-container">
      <h2 class="text-h2">评价维度</h2>
      <div class="scroll-inner">
        <EvalDimension />
      </div>
    </div>
    <p class="text-hint center">如果已确定全部了解以上信息，请点击按钮以开始实验。</p>
    <div class="btn-row">
      <BasePrimaryButton label="开始实验" :enabled="countdown === 0" :countdown="countdown" @click="onNext" />
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
const countdown = ref(10);
let timer = null;

onMounted(() => {
  countdown.value = 10;
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
.file-container { background: #F0F9FF; border-left: 4px solid #57adde; padding: 16px; width: 90%; max-width: 800px; margin: 8px 0; }
.scroll-inner { background: #F5FBFF; border: 1px solid #DCD8D3; padding: 12px; margin: 8px 0; max-height: 240px; overflow: auto; }
.btn-row { margin-top: 16px; display: flex; justify-content: center; }
</style>

