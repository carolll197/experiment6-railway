<template>
  <div class="ai-suggestion">
    <div v-for="(block, i) in parsedBlocks" :key="i">
      <h4 v-if="block.type === 'section'" class="ai-section-title" style="margin-top: 10px; margin-bottom: 4px; font-size: 14px; font-weight: 600; color: var(--color-text);">{{ block.text }}</h4>
      <p v-else-if="block.type === 'subtitle'" style="margin: 4px 0; font-size: 13px; font-weight: 500; color: var(--color-text);">{{ block.text }}</p>
      <p v-else class="text-hint" style="margin: 2px 0;">{{ block.text }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({
  content: { type: String, default: '' },
});

// Section headers: "1. 目标受众画像 (Target Audience)" etc.
const SECTION_RE = /^\d+\.\s*.+\(.+\)/;
// Sub-items: lines starting with key phrases
const SUBTITLE_KEYS = [
  '典型人物', '画像描述', '生活状态', '受众描述', '目标人群',
  '1）', '2）',
  '心里话', '核心点', '创意点',
  '他为什么烦恼',
];

const parsedBlocks = computed(() => {
  if (!props.content) return [];
  const lines = props.content.split('\n');
  const blocks = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (SECTION_RE.test(trimmed)) {
      blocks.push({ type: 'section', text: trimmed });
    } else if (SUBTITLE_KEYS.some(k => trimmed.startsWith(k)) || trimmed.startsWith('* ')) {
      blocks.push({ type: 'subtitle', text: trimmed });
    } else {
      blocks.push({ type: 'body', text: trimmed });
    }
  }
  return blocks;
});
</script>
