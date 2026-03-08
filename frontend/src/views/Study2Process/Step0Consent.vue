<template>
  <div class="consent-wrap">
    <h1 class="text-h1 center">知情同意</h1>
    <div class="file-container">
      <p class="text-body"><strong>1. 研究背景与目的</strong> 本研究旨在探索个体在AI辅助下如何进行广告策划与创意构思。</p>
      <p class="text-body"><strong>2. 实验流程与任务</strong> 本实验预计耗时约15分钟，全程在线进行，您将完成1份广告创意策划案的撰写。</p>
      <p class="text-body"><strong>3. 报酬与奖金机制</strong></p>
      <ul class="text-body">
        <li><strong>基础报酬：</strong> 认真完成所有流程且通过审核的被试，将获得【5元】的基础被试费。</li>
        <li><strong>额外奖金：</strong> 我们将邀请行业专家对作品的创造力进行盲审排名，排名前 15% 的创作者将获得额外【5元】的奖金，排名15%-65%的创作者将获得额外【2元】的奖金。</li>
        <li><strong>审核说明：</strong> 本研究谢绝自行使用AI生成答案，后台将检测作答质量，对于态度敷衍、胡乱作答或经检测发现违规使用AI生成的作品，将不予发放任何报酬。</li>
      </ul>
      <p class="text-body"><strong>4. 信息保密</strong> 您的所有数据仅用于学术研究分析，我们承诺您的个人身份信息及作答信息将会被严格保密。</p>
      <p class="text-body"><strong>5. 自愿参与与退出</strong> 参与本实验完全自愿。您可以在实验过程中的任何时间选择退出，但这将导致您无法获得实验报酬。</p>
      <p class="text-body"><strong>6. 联系方式</strong> 如对本研究有任何疑问，请联系研究负责人：刘锦洁 18513701922。</p>
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
.consent-wrap .text-h1 { font-size: 19px; }
.consent-wrap .file-container .text-body { font-size: 15px; }
.consent-wrap .file-container ul { margin: 8px 0; padding-left: 20px; font-size: 15px; }
.consent-wrap .file-container li { margin: 4px 0; }
.consent-wrap .checkbox-row { display: flex; align-items: center; gap: 8px; font-size: 15px; }
.file-container { width: 90%; max-width: 800px; }
.btn-row { margin-top: 16px; }
</style>
