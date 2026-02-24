<template>
  <div class="consent-wrap">
    <h1 class="text-h1 center">知情同意</h1>
    <div class="file-container">
      <p class="text-body">欢迎您参与本次关于"人机协作下的广告创意生成"的心理学研究。在决定是否参与之前，请您仔细阅读以下信息。</p>
      <p class="text-body"><strong>研究背景与目的</strong> 本研究旨在探索人机协作下个体如何进行广告策划与创意构思。</p>
      <p class="text-body"><strong>实验流程与任务</strong> 本实验预计耗时约12分钟，全程在线进行，您将完成创意简报撰写及作品比较等任务。</p>
      <p class="text-body"><strong>报酬与奖金机制</strong> 认真完成所有流程且通过审核的被试将获得基础被试费；创造力排名前 15% 可获得额外奖金。</p>
      <p class="text-body"><strong>信息保密与自愿参与</strong> 您的数据仅用于学术研究并严格保密；参与完全自愿，可随时退出。</p>
    </div>
    <div class="checkbox-row">
      <BaseCheckbox v-model="checked" label="我已阅读并理解以上内容，并同意参与本次实验。" />
    </div>
    <div class="btn-row">
      <BasePrimaryButton
        label="下一步"
        :enabled="checked && countdown === 0"
        :countdown="countdown"
        @click="$emit('next')"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import BaseCheckbox from '../../components/BaseCheckbox.vue';
import BasePrimaryButton from '../../components/BasePrimaryButton.vue';

const checked = ref(false);
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

<style scoped>
.consent-wrap {
  min-height: 100vh;
  background: var(--color-page-bg);
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.checkbox-row { display: flex; align-items: center; gap: 8px; }
.btn-row { margin-top: 16px; }
</style>
