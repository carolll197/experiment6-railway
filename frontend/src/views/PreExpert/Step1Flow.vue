<template>
  <div class="page-wrap">
    <h1 class="text-h1">流程说明</h1>
    <div class="text-body" style="margin: 16px 0;">
      <p>欢迎进入正式评分阶段。在开始之前，请仔细阅读以下信息。您的评分将直接决定本项研究关于"人机协作创造力"的结论方向。</p>
      <p style="margin-top: 8px;">- 1.评估对象：您将看到一系列针对虚拟品牌的广告创意策划文案，这些作品的作者信息已匿名处理。</p>
      <p style="margin-top: 4px;">- 2.计费标准：每完成一份作品的评估支付2元。</p>
      <p style="margin-top: 4px;">- 3.评估标准 如下</p>
    </div>
    <div class="panel-border p-module" style="margin: 12px 0;">
      <h2 class="text-h2 spacing-12">评估标准</h2>
      <div class="file-container" style="margin-top: 8px;">
        <EvalDimension :use-standard-intro="true" />
      </div>
    </div>
    <div style="margin: 20px 0;">
      <BaseCheckbox v-model="checked" label="我已阅读并理解以上内容。" />
    </div>
    <div class="flex justify-center">
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
import EvalDimension from '../../components/EvalDimension.vue';

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
