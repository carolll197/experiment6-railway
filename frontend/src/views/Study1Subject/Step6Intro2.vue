<template>
  <div class="intro-wrap">
    <h1 class="text-h1 center">环节二：实验内容说明</h1>
    <div class="file-container">
      <p class="text-body">接下来为「两轮协作」环节，您将依次完成两道创意简报题目，每道题均有规定作答时间。</p>
    </div>
    <div class="btn-row">
      <BasePrimaryButton label="开始实验" :enabled="true" @click="$emit('next')" />
    </div>
  </div>
</template>

<script setup>
import BasePrimaryButton from '../../components/BasePrimaryButton.vue';
defineEmits(['next']);
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
.btn-row { margin-top: 16px; }
</style>
