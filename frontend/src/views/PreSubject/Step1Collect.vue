<template>
  <div class="collect-wrap">
    <div class="file-container">
      <label class="collect-label">您的被试编号为？</label>
      <BaseTextInput v-model="localSubjectId" placeholder="请输入被试编号" />
    </div>
    <div class="file-container">
      <label class="collect-label">您的姓名是？</label>
      <BaseTextInput v-model="localName" placeholder="请输入姓名" />
    </div>
    <div class="btn-row">
      <BasePrimaryButton label="确定" :enabled="localSubjectId && localName" @click="onNext" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import BaseTextInput from '../../components/BaseTextInput.vue';
import BasePrimaryButton from '../../components/BasePrimaryButton.vue';

const props = defineProps({
  subjectId: String,
  name: String,
});

const emit = defineEmits(['next', 'update:subjectId', 'update:name']);

const localSubjectId = ref(props.subjectId || '');
const localName = ref(props.name || '');

watch(localSubjectId, (newVal) => {
  emit('update:subjectId', newVal);
});

watch(localName, (newVal) => {
  emit('update:name', newVal);
});

function onNext() {
  if (localSubjectId.value && localName.value) {
    emit('next');
  }
}
</script>

<style scoped>
.collect-wrap {
  min-height: 100vh;
  background: