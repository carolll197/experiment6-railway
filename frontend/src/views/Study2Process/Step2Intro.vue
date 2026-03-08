<template>
  <div class="intro-wrap">
    <h1 class="text-h1 center">实验内容说明</h1>
    <div class="file-container">
      <p class="text-body">您好，欢迎参加本实验！您会收到一份创意简报（包括广告主题、产品特征等信息），完成1份广告策划案的撰写。在本实验中，系统内置的AI 将作为您的创意合作伙伴，您可以与它进行【3次讨论，限时8分钟】，最终提交的广告策划案的创造力与实验报酬挂钩。</p>
      <p class="text-body">额外奖金： 我们将邀请行业专家对作品的创造力进行盲审排名，排名前 15% 的创作者将获得额外【5元】的奖金，排名15%-65%的创作者将获得额外【2元】的奖金。</p>
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
  min-height: 100vh;
  background: var(--color-page-bg);
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.file-container {
  background: #F0F9FF;
  border-left: 4px solid #57adde;
  padding: 16px;
  width: 90%;
  max-width: 800px;
  margin: 8px 0;
}
.file-container .file-container {
  background: #F5FBFF;
  border-left: none;
  border: 1px solid #DCD8D3;
  padding: 12px;
  margin: 8px 0;
}
.btn-row { margin-top: 16px; display: flex; justify-content: center; }
</style>
