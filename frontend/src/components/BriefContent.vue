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
const SUBTITLE_KEYS = [
  '产品背景：', '功能特点：', '现象观察：',
  '原料来源：', '口味数据：', '包装设计：',
  '成分技术：', '残酷特性：',
  '反向算法：', '目的地范围：', '绝对未知：',
];
// 产品背景、功能特点、现象观察 共12个字加粗，正文不加粗；功能特点下的分点前加 -
const BOLD_SUBTITLE_PREFIXES = ['产品背景', '功能特点', '现象观察'];
const FUNCTION_FEATURES_HEAD = '功能特点：';
const PHENOMENON_HEAD = '现象观察：';
const AFTER_FUNCTION_UNTIL = ['现象观察：', '产品背景：'];
const AFTER_PHENOMENON_UNTIL = ['产品背景：', '功能特点：'];
function getBoldPrefix(trimmed) {
  for (const p of BOLD_SUBTITLE_PREFIXES) {
    if (trimmed.startsWith(p)) return p;
  }
  return null;
}
// 带引号小标题
const SUBTITLE_QUOTED_RE = /^[""\u201c].+?[""\u201d].*?：/;

function isSubtitleLine(line) {
  const trimmed = line.trim();
  for (const key of SUBTITLE_KEYS) {
    if (trimmed.startsWith(key)) return true;
  }
  // 匹配 "xxx"xxx：格式
  if (SUBTITLE_QUOTED_RE.test(trimmed)) return true;
  // 匹配 样本库（xxx）：格式
  if (/^[^\s]{2,}（[^）]+）：/.test(trimmed)) return true;
  if (/^消费矛盾：/.test(trimmed)) return true;
  if (/^决策疲劳/.test(trimmed)) return true;
  if (/^剧透式旅行/.test(trimmed)) return true;
  if (/^环境的/.test(trimmed)) return true;
  if (/^对"/.test(trimmed)) return true;
  return false;
}

const parsedBlocks = computed(() => {
  if (!props.content) return [];
  const lines = props.content.split('\n');
  const blocks = [];
  let inFunctionFeatures = false;
  let inPhenomenonObs = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const inFunctionUntil = AFTER_FUNCTION_UNTIL.some((s) => trimmed.startsWith(s)) || TITLE_RE.test(trimmed);
    const inPhenomenonUntil = AFTER_PHENOMENON_UNTIL.some((s) => trimmed.startsWith(s)) || TITLE_RE.test(trimmed);
    if (inFunctionUntil) inFunctionFeatures = false;
    if (inPhenomenonUntil) inPhenomenonObs = false;
    const needDash = inFunctionFeatures || inPhenomenonObs;
    if (trimmed.startsWith(FUNCTION_FEATURES_HEAD)) inFunctionFeatures = true;
    if (trimmed.startsWith(PHENOMENON_HEAD)) inPhenomenonObs = true;
    const prefix = needDash ? '- ' : '';
    if (TITLE_RE.test(trimmed)) {
      blocks.push({ type: 'title', text: trimmed });
    } else if (isSubtitleLine(trimmed)) {
      const boldPrefix = getBoldPrefix(trimmed);
      blocks.push({ type: 'subtitle', text: trimmed, boldPrefix, prefix: boldPrefix ? '' : prefix });
    } else {
      blocks.push({ type: 'body', text: trimmed, prefix });
    }
  }
  return blocks;
});
</script>

