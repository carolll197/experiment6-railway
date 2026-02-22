<template>
  <div class="brief-content">
    <div v-for="(block, i) in parsedBlocks" :key="i">
      <h3 v-if="block.type === 'title'" class="brief-title text-h2" style="margin-top: 12px; margin-bottom: 4px; font-weight: 600;">{{ block.text }}</h3>
      <h4 v-else-if="block.type === 'subtitle'" class="brief-subtitle text-h3" style="margin-top: 6px; margin-bottom: 2px;">
        <template v-if="block.boldPrefix"><strong>{{ block.boldPrefix }}</strong>{{ block.text.slice(block.boldPrefix.length) }}</template>
        <template v-else>{{ block.prefix }}{{ block.text }}</template>
      </h4>
      <p v-else class="text-body" style="margin: 2px 0;">{{ block.prefix }}{{ block.text }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({
  content: { type: String, default: '' },
});

// 题目行 = 以"题目"开头的行（题目 / 题目 1 / 题目： 等）
const TITLE_RE = /^题目/;
// 四个小标题仅标题加粗：产品背景、创意素材、创意任务、创意目标
const BOLD_SUBTITLE_PREFIXES = ['产品背景', '创意素材', '创意任务', '创意目标'];
const SUBTITLE_KEYS = ['产品背景：', '创意素材：', '创意任务：', '创意目标：'];
function getBoldPrefix(trimmed) {
  for (const p of BOLD_SUBTITLE_PREFIXES) {
    if (trimmed.startsWith(p)) return p;
  }
  return null;
}
function isSubtitleLine(line) {
  const trimmed = line.trim();
  for (const key of SUBTITLE_KEYS) {
    if (trimmed.startsWith(key)) return true;
  }
  return false;
}

const parsedBlocks = computed(() => {
  if (!props.content) return [];
  const lines = props.content.split('\n');
  const blocks = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (TITLE_RE.test(trimmed)) {
      blocks.push({ type: 'title', text: trimmed });
    } else if (isSubtitleLine(trimmed)) {
      const boldPrefix = getBoldPrefix(trimmed);
      blocks.push({ type: 'subtitle', text: trimmed, boldPrefix, prefix: '' });
    } else {
      blocks.push({ type: 'body', text: trimmed, prefix: '' });
    }
  }
  return blocks;
});
</script>

<style scoped>
/* 创意简报：正文宋体，仅小标题文字加粗 */
.brief-content { font-size: 14px; line-height: 1.5; color: var(--color-text, #333); font-family: "SimSun", "Songti SC", serif; }
.brief-content .brief-title { font-size: 16px; font-weight: 600; font-family: "SimSun", "Songti SC", serif; }
.brief-content .brief-subtitle { font-size: 15px; font-weight: 400; font-family: "SimSun", "Songti SC", serif; }
.brief-content .brief-subtitle strong { font-weight: 700; }
.brief-content .text-body { font-size: 14px; font-weight: 400; }
</style>
