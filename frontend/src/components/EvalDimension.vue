<template>
  <div class="eval-dimension">
    <p class="text-body" style="margin-bottom: 4px;">{{ introText }}</p>
    <p class="text-h3" style="margin: 6px 0 2px;">独特性：</p>
    <p class="text-body" style="margin-bottom: 4px;">{{ evaluationDimensionCopy.uniqueness }}</p>
    <p class="text-body" style="margin: 4px 0;" v-for="(item, i) in evaluationDimensionCopy.subItems" :key="i">- {{ item }}</p>
    <p class="text-h3" style="margin: 8px 0 2px;">相关性：</p>
    <p class="text-body" style="margin-bottom: 2px;">{{ evaluationDimensionCopy.relevance }}</p>
    <p class="text-body" style="margin: 2px 0;">{{ evaluationDimensionCopy.relevanceDetail }}</p>
  </div>
</template>

<script setup>
import { evaluationDimensionCopy, evaluationStandardIntro } from '../content/preExperiment.js';

const props = defineProps({
  useStandardIntro: { type: Boolean, default: false },
});

const introText = props.useStandardIntro ? evaluationStandardIntro : evaluationDimensionCopy.intro;
</script>

<style scoped>
.eval-dimension { font-family: "SimSun", "Songti SC", serif; font-size: 14px; line-height: 1.5; color: var(--color-text, #333); }
.eval-dimension .text-body { font-size: 14px; font-family: "SimSun", "Songti SC", serif; }
.eval-dimension .text-h3 { font-size: 14px; font-weight: 700; font-family: "SimSun", "Songti SC", serif; }
</style>
