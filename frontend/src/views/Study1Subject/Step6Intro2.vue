<template>
  <div class="intro-wrap">
    <h1 class="text-h1 center">实验内容说明-环节二</h1>
    <div class="file-container">
      <p class="text-body">恭喜您完成了第一个环节，现在进入"AI辅助撰写"环节，您同样需要完成一份广告创意策划方案的撰写，系统内置的AI会生成一份方案供您参考，您同样需要在10分钟内完成创作与提交，谢绝自行使用AI生成答案。</p>
      <p class="text-body">奖励机制（与环节一相同）：您提交的最终作品将参与评审打分，最终综合排名前 20% 的创作者将获得额外【5元】的奖金，排名20%-70%的创作者将获得额外【2元】的奖金。</p>
    </div>
    <div class="file-container">
      <h2 class="text-h2">评价维度（与环节一相同）：</h2>
      <div class="file-container">
        <h3 class="text-h3">独特性</h3>
        <p class="text-body">广告包含的元素具有差异、新颖、独特等特质，包含 5 个核心子维度：</p>
        <ul class="text-body">
          <li>原创性：您的方案是否"与众不同"让人眼前一亮？</li>
          <li>灵活性：是否能在想法或概念间灵活切换？</li>
          <li>合成性：是否将不相关的概念巧妙结合？</li>
          <li>详尽性：是否包含了大量细节信息？</li>
          <li>艺术价值：您描述的画面是否生动有表现力？</li>
        </ul>
        <h3 class="text-h3">相关性</h3>
        <p class="text-body">相关性：广告的创意构思与产品核心特征及给定任务目标的紧密契合程度。也就是说：方案是否抓住了产品特征，是否切题？</p>
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
onUnmounted(() => {
  if (timer) clearInterval(timer);
});

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
.text-h1 { font-size: 20px; font-weight: 600; color: #333333; text-align: center; margin: 16px 0; }
.text-h2 { font-size: 18px; font-weight: 500; color: #333333; text-align: left; margin: 12px 0; }
.text-h3 { font-size: 17px; font-weight: 500; color: #333333; text-align: left; margin: 8px 0; }
.text-body { font-size: 16px; font-weight: 400; color: #333333; line-height: 1.4; margin: 8px 0; }
.text-hint { font-size: 15px; font-weight: 400; color: #666666; line-height: 1.3; font-style: italic; text-align: center; margin: 16px 0; }
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
ul { margin: 8px 0; padding-left: 20px; }
li { margin: 4px 0; }
.btn-row { margin-top: 16px; display: flex; justify-content: center; align-items: center; gap: 8px; }
.countdown-badge { font-size: 14px; }
</style>
