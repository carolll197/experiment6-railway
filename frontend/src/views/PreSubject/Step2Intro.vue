<template>
  <div class="page-wrap">
    <h1 class="text-h1">实验内容说明</h1>
    <div class="text-body" style="margin: 16px 0;">
      <p>您好，欢迎参加本次创意实验！在接下来的研究中，您将扮演一名“广告创意总监”。系统将为您提供一份创意简报题目（包含产品功能特性等信息），您需要在10分钟内，独立构思出一份广告创意策划方案，谢绝自行使用AI生成答案，我们会进行AI查重，一经发现则取消发放被试费。</p>
      <p style="margin-top: 8px;">额外奖金： 我们将邀请行业专家对作品的创造力进行盲审排名，排名前 20% 的创作者将获得额外【5元】的奖金，排名20%-80%的创作者将获得额外【2元】的奖金。请尽情发挥您的创造力！</p>
    </div>
    <div class="panel-border p-module gap-module" style="margin: 12px 0;">
      <h2 class="brief-eval-section-title spacing-12">评价维度</h2>
      <div class="file-container" style="margin-top: 8px;">
        <EvalDimension />
      </div>
    </div>
    <p class="text-hint center" style="margin: 16px 0;">如果已确定全部了解以上信息，请点击按钮以开始实验。</p>
    <div class="flex justify-center">
      <BasePrimaryButton
        label="开始实验"
        :enabled="countdown === 0"
        :countdown="countdown"
        @click="$emit('next')"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import BasePrimaryButton from '../../components/BasePrimaryButton.vue';
import EvalDimension from '../../components/EvalDimension.vue';

const countdown = ref(10);
let timer = null;

onMounted(() => {
  countdown.value = 10;
  timer = setInterval(() => {
    if (countdown.value > 0) countdown.value--;
    else if (timer) clearInterval(timer);
  }, 1000);
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});

defineEmits(['next']);
</script>
