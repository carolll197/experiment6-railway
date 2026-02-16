<template>
  <div class="page-wrap">
    <p class="label-q">姓名</p>
    <BaseTextInput v-model="name" placeholder="请输入姓名" class="mb-q" />
    <div style="margin-top: 20px; text-align: center;">
      <BasePrimaryButton label="确认" :enabled="canNext" @click="onConfirm" />
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
.label-q {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  margin: 12px 0;
  text-align: left;
}
.mb-q { margin-bottom: 4px; }
</style>
