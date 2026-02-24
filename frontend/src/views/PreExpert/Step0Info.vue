<template>
  <div class="collect-wrap">
    <div class="file-container">
      <label class="collect-label">您的姓名是？</label>
      <BaseTextInput v-model="name" placeholder="请输入姓名" />
    </div>
    <div class="btn-row">
      <BasePrimaryButton label="确定" :enabled="canNext" @click="onConfirm" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import BaseTextInput from '../../components/BaseTextInput.vue';
import BasePrimaryButton from '../../components/BasePrimaryButton.vue';

const name = defineModel('name', { type: String, default: '' });
const canNext = computed(() => (name.value || '').trim() !== '');

function onConfirm() {
  if (!canNext.value) return;
  emit('next');
}
const emit = defineEmits(['next']);
</script>

<style scoped>
.collect-wrap {
  min-height: 100vh;
  background: var(--color-page-bg);
  padding: 16px;
}
.collect-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333333;
  margin-bottom: 12px;
}
.file-container {
  margin-bottom: 12px;
}
.btn-row {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
