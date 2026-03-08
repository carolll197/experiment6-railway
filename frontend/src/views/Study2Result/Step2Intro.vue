<template>
  <div class="intro-wrap">
    <h1 class="text-h1 center">实验内容说明</h1>
    <div class="file-container">
      <p class="text-body">您好，欢迎参加本次创意实验！在接下来的研究中，您将扮演一名"广告创意总监"。</p>
      <p class="text-body">您将会收到一份创意简报题目（包含创意目标、产品功能特性等信息），系统内置的AI会生成一份方案供您参考，您需要在10分钟内完成创作与提交，谢绝自行使用AI生成答案。</p>
      <p class="text-body">奖励机制：您最终提交的作品将参与专家评审打分，排名前 15% 的创作者将获得额外【5元】的奖金，排名15%-65%的创作者将获得额外【2元】的奖金。请尽情发挥您的创造力！</p>
    </div>
    <div class="file-container">
      <h2 class="text-h2">评价维度：</h2>
      <div class="file-container">
        <EvalDimension />
      </div>
    </div>
    <p class="text-hint center">如果已确定全部了解以上信息，请点击按钮以开始实验。</p>
    <div class="btn-row">
      <BasePrimaryButton
        label="开始实验"
        :enabled="countdown === 0"
        :countdown="countdown"
        @click="onNext"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import BasePrimaryButton from '../../components/BasePrimaryButton.vue';
import EvalDimension from '../../components/EvalDimension.vue';

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
.intro-wrap {
  min-height: 100vh; background: var(--color-page-bg); padding: 16px;
  display: flex; flex-direction: column; align-items: center; gap: 16px;
}
.file-container { background: #F0F9FF; border-left: 4px solid #57adde; padding: 16px; width: 90%; max-width: 800px; margin: 8px 0; }
.file-container .file-container { background: #F5FBFF; border-left: none; border: 1px solid #DCD8D3; padding: 12px; margin: 8px 0; }
.btn-row { margin-top: 16px; display: flex; justify-content: center; }
</style>
