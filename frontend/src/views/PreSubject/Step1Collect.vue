<template>
  <div class="page-wrap page-consent">
    <p class="label-q">您的被试编号为？</p>
    <BaseTextInput v-model="subjectId" placeholder="请输入被试编号" class="mb-q" />
    <p class="label-q">您的姓名是？</p>
    <BaseTextInput v-model="name" placeholder="请输入姓名" class="mb-q" />
    <div style="margin-top: 20px; text-align: center;">
      <BasePrimaryButton
        label="确定"
        :enabled="canNext"
        @click="onConfirm"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import BaseTextInput from '../../components/BaseTextInput.vue';
import BasePrimaryButton from '../../components/BasePrimaryButton.vue';

const subjectId = defineModel('subjectId', { type: String, default: '' });
const name = defineModel('name', { type: String, default: '' });

const canNext = computed(() => (subjectId.value || '').trim() !== '' && (name.value || '').trim() !== '');

function onConfirm() {
  if (!canNext.value) return;
  emit('next');
}
const emit = defineEmits(['next']);
</script>

<style scoped>
.label-q {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text);
  margin: 12px 0;
  text-align: left;
}
.mb-q { margin-bottom: 4px; }
</style>
