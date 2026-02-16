<template>
  <div class="page-wrap">
    <h1 class="text-h1">实验内容说明-<span style="font-weight: 400;">环节二</span></h1>
    <div class="text-body" style="margin: 16px 0;">
      <p>恭喜您完成了第一个环节，现在进入"AI辅助撰写"环节，您共需要完成两轮广告创意策划方案的撰写。在每轮中，系统内置的AI均会生成一份方案供您参考，您同样需要在10分钟内完成创作与提交，谢绝自行使用AI生成答案，我们会进行AI查重，一经发现则取消发放被试费。</p>
      <p class="text-h3" style="margin-top: 12px;">奖励机制（与环节一相同）：</p>
      <p class="text-body" style="margin-top: 4px;">您提交的最终作品将参与评审打分，所有作品综合排名前 20% 的创作者将获得额外【10元】的奖金，排名20%-80%的创作者将获得额外【5元】的奖金。</p>
    </div>
    <div class="panel-border p-module gap-module" style="margin: 12px 0;">
      <h2 class="brief-eval-section-title spacing-12 left">评价维度（与环节一相同）</h2>
      <EvalDimension />
    </div>
    <p class="text-hint center" style="margin: 16px 0;">如果已确定全部了解以上信息，请点击按钮以开始实验。</p>
    <div class="flex justify-center">
      <BasePrimaryButton label="开始实验" :enabled="countdown === 0" :countdown="countdown" @click="$emit('next')" />
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
  timer = setInterval(() => { if (countdown.value > 0) countdown.value--; else if (timer) clearInterval(timer); }, 1000);
});
onUnmounted(() => { if (timer) clearInterval(timer); });

defineEmits(['next']);
</script>
