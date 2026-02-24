<template>
  <div class="ai-suggestion file-container">
    <p class="text-body">{{ content || '—' }}</p>
  </div>
</template>

<script setup>
defineProps({
  content: { type: String, default: '' },
});
</script>

<style scoped>
.ai-suggestion { margin-top: 8px; }
</style>
