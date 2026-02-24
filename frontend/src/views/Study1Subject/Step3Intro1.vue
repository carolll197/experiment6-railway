<template>
  <div class="intro-wrap">
    <h1 class="text-h1 center">环节一：实验内容说明</h1>
    <div class="file-container">
      <p class="text-body">接下来为「独立撰写」环节，系统将提供创意简报题目，您需要在规定时间内完成一份广告创意策划方案。</p>
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
