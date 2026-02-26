<template>
  <div class="ai-suggestion file-container">
    <template v-if="parsed.length">
      <div v-for="(block, i) in parsed" :key="i" class="ai-block">
        <p class="ai-subtitle text-h3">{{ block.title }}</p>
        <p class="text-body ai-body">{{ block.body }}</p>
      </div>
    </template>
    <p v-else class="text-body">{{ content || '—' }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  content: { type: String, default: '' },
});

// 按「模块1」「模块2」「模块3」分块，每块有小标题和正文
const parsed = computed(() => {
  const s = (props.content || '').trim();
  if (!s) return [];
  const lines = s.split(/\n/);
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^模块\d/.test(line)) {
      const title = line.trim();
      const bodyLines = [];
      i++;
      while (i < lines.length && !/^模块\d/.test(lines[i])) {
        bodyLines.push(lines[i]);
        i++;
      }
      blocks.push({ title, body: bodyLines.join('\n').trim() });
    } else {
      i++;
    }
  }
  return blocks;
});
</script>

<style scoped>
.ai-suggestion { margin-top: 8px; }
.ai-block { margin-bottom: 12px; }
.ai-block:last-child { margin-bottom: 0; }
.ai-subtitle { font-weight: 600; margin: 0 0 4px 0; }
.ai-body { white-space: pre-wrap; margin: 0; }
</style>
