<template>
  <div class="consent-wrap">
    <h1 class="text-h1 center">知情同意</h1>
    <div class="file-container">
      <p class="text-body">欢迎您参与本次关于"广告创意生成"的心理学研究。在决定是否参与之前，请您仔细阅读以下信息。</p>
      <p class="text-body"><strong>研究背景与目的</strong> 本研究旨在探索个体如何进行广告策划与创意构思。</p>
      <p class="text-body"><strong>实验流程与任务</strong> 本实验预计耗时约10分钟，全程在线进行，您将完成1份广告创意策划案的撰写。</p>
      <p class="text-body"><strong>报酬与奖金机制</strong></p>
      <p class="text-body">- 基础报酬： 认真完成所有流程且通过审核的被试，将获得【5元】的基础被试费。</p>
      <p class="text-body">- 额外奖金： 我们将邀请行业专家对作品的创造力进行盲审排名，排名前 15% 的创作者将获得额外【5元】的奖金，排名15%-65%的创作者将获得额外【2元】的奖金。</p>
      <p class="text-body">- 审核说明： 本研究谢绝自行使用AI生成答案，后台将检测作答质量，对于态度敷衍、胡乱作答或经检测发现违规使用AI生成的作品，将不予发放任何报酬。</p>
      <p class="text-body"><strong>信息保密</strong> 您的所有数据仅用于学术研究分析，我们承诺您的个人身份信息及作答信息将会被严格保密。</p>
      <p class="text-body"><strong>自愿参与与退出</strong> 参与本实验完全自愿。您可以在实验过程中的任何时间选择退出，但这将导致您无法获得实验报酬。</p>
      <p class="text-body"><strong>联系方式</strong> 如对本研究有任何疑问，请联系研究负责人：刘锦洁 18513701922。</p>
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
}
.text-h1 {
  font-size: 20px;
  font-weight: 600;
  color: #333333;
  text-align: center;
  margin: 16px 0;
}
.text-body {
  font-size: 16px;
  font-weight: 400;
  color: #333333;
  line-height: 1.4;
  margin: 4px 0;
}
.center {
  text-align: center;
}
.file-container {
  background: #F0F9FF;
  border-left: 4px solid #57adde;
  padding: 16px;
  width: 90%;
  max-width: 800px;
  margin: 8px auto;
}
.checkbox-row {
  margin: 20px 0;
  display: flex;
  justify-content: center;
}
.btn-row {
  display: flex;
  justify-content: center;
}
</style>
