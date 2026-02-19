<template>
  <div class="compare-wrap">
    <!-- 顶部区 20% -->
    <div class="top-section">
      <div class="file-container panel-border top-desc">
        <p class="text-body">感谢您的创作！下面我们为您提供了一份AI作品，请您为您的作品和AI作品的创造力分别打分，并选择其一提交作为第一环节的最终作品。</p>
        <p class="text-hint" style="margin-top: 8px;">奖励机制： 您提交的最终作品将参与评审打分，所有作品综合排名前 20% 的创作者将获得额外【10元】的奖金，排名20%-80%的创作者将获得额外【5元】的奖金。</p>
      </div>
      <div class="file-container panel-border top-brief">
        <div class="brief-preview text-body">{{ briefPreview }}</div>
        <div class="brief-actions">
          <button type="button" class="btn-regular" @click="briefExpanded = !briefExpanded">{{ briefExpanded ? '折叠' : '展开' }}</button>
        </div>
      </div>
    </div>

    <!-- 简报展开悬浮框 -->
    <div v-if="briefExpanded" class="brief-overlay" @click.self="briefExpanded = false">
      <div class="brief-modal panel-border">
        <BriefContent :content="briefQuestion1" />
      </div>
    </div>

    <!-- 中间区 45% 作品对比 -->
    <div class="mid-section">
      <div class="file-container panel-border work-col" :style="{ order: leftFirst ? 1 : 2 }">
        <h2 class="text-h2 center work-label">{{ leftLabel }}</h2>
        <div class="work-blocks text-body">
          <p><strong>目标受众画像</strong></p>
          <p class="work-text">{{ leftWork.target_audience || '—' }}</p>
          <p style="margin-top: 6px;"><strong>痛点挖掘</strong></p>
          <p class="work-text">{{ leftWork.pain_point || '—' }}</p>
          <p style="margin-top: 6px;"><strong>核心洞察</strong></p>
          <p class="work-text">{{ leftWork.insight || '—' }}</p>
          <p style="margin-top: 6px;"><strong>核心创意</strong></p>
          <p class="work-text">{{ leftWork.big_idea || '—' }}</p>
          <p style="margin-top: 6px;"><strong>创意理由</strong></p>
          <p class="work-text">{{ leftWork.rationale || '—' }}</p>
        </div>
      </div>
      <div class="file-container panel-border work-col" :style="{ order: leftFirst ? 2 : 1 }">
        <h2 class="text-h2 center work-label">{{ rightLabel }}</h2>
        <div class="work-blocks text-body">
          <p><strong>目标受众画像</strong></p>
          <p class="work-text">{{ rightWork.target_audience || '—' }}</p>
          <p style="margin-top: 6px;"><strong>痛点挖掘</strong></p>
          <p class="work-text">{{ rightWork.pain_point || '—' }}</p>
          <p style="margin-top: 6px;"><strong>核心洞察</strong></p>
          <p class="work-text">{{ rightWork.insight || '—' }}</p>
          <p style="margin-top: 6px;"><strong>核心创意</strong></p>
          <p class="work-text">{{ rightWork.big_idea || '—' }}</p>
          <p style="margin-top: 6px;"><strong>创意理由</strong></p>
          <p class="work-text">{{ rightWork.rationale || '—' }}</p>
        </div>
      </div>
    </div>

    <!-- 底部区 35% 评分/提交 -->
    <div class="bottom-section panel-border">
      <template v-if="!submitStep">
        <h2 class="text-h2" style="margin: 8px 0;">请对两个方案进行评分。</h2>
        <div class="file-container scale-block">
          <div v-for="(item, idx) in creativityScaleItems" :key="item.no" class="scale-row">
            <div class="scale-header">
              <span class="text-h3">{{ item.dimension }}：{{ item.text }}</span>
            </div>
            <div class="scale-axes">
              <!-- 左侧作品对应第一个打分轴，右侧作品对应第二个，与上方作品栏随机顺序一致 -->
              <div class="axis-item" :style="{ order: leftFirst ? 1 : 2 }">
                <span class="axis-label">{{ leftLabel }}:</span>
                <BaseScoreAxis :model-value="getScore(item.no, leftFirst ? 'yours' : 'ai')" @update:model-value="setScore(item.no, leftFirst ? 'yours' : 'ai', $event)" />
              </div>
              <div class="axis-item" :style="{ order: leftFirst ? 2 : 1 }">
                <span class="axis-label">{{ rightLabel }}:</span>
                <BaseScoreAxis :model-value="getScore(item.no, leftFirst ? 'ai' : 'yours')" @update:model-value="setScore(item.no, leftFirst ? 'ai' : 'yours', $event)" />
              </div>
            </div>
          </div>
        </div>
        <div class="btn-row">
          <BasePrimaryButton label="下一步" :enabled="scoresFilled" @click="submitStep = true" />
        </div>
      </template>
      <template v-else>
        <h2 class="text-h2" style="margin: 10px 0;">您最终选择提交的作品是</h2>
        <div class="radio-row">
          <!-- 左侧选项：展示与 value 一致，避免 leftFirst 随机时点选与提交相反 -->
          <label class="radio-label" :style="{ order: 1 }">
            <span class="custom-radio" :class="{ checked: chosenSide === leftOptionValue }"></span>
            <input type="radio" class="sr-only" :name="radioName" :value="leftOptionValue" v-model="chosenSide" />
            <span>{{ leftLabel }}</span>
          </label>
          <label class="radio-label" :style="{ order: 2 }">
            <span class="custom-radio" :class="{ checked: chosenSide === rightOptionValue }"></span>
            <input type="radio" class="sr-only" :name="radioName" :value="rightOptionValue" v-model="chosenSide" />
            <span>{{ rightLabel }}</span>
          </label>
        </div>
        <div class="btn-row">
          <BasePrimaryButton label="确认提交" :enabled="!!chosenSide" @click="onConfirmSubmit" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import BaseScoreAxis from '../../components/BaseScoreAxis.vue';
import BasePrimaryButton from '../../components/BasePrimaryButton.vue';
import BriefContent from '../../components/BriefContent.vue';
import { briefQuestion1, study1AiWork } from '../../content/study1Content.js';
import { creativityScaleItems } from '../../content/preExperiment.js';

const props = defineProps({
  phase1Plan: { type: Object, default: () => ({}) },
  subjectId: String,
  initialScores: { type: Object, default: null },
  initialSubmitStep: { type: Boolean, default: false },
  initialChosenSide: { type: String, default: '' },
  initialLeftFirst: { type: Boolean, default: null },
});
const emit = defineEmits(['next', 'save']);

// 恢复或随机左右顺序
const leftFirst = ref(props.initialLeftFirst !== null && props.initialLeftFirst !== undefined ? props.initialLeftFirst : Math.random() >= 0.5);
const leftLabel = computed(() => (leftFirst.value ? '您的作品' : 'AI作品'));
const rightLabel = computed(() => (leftFirst.value ? 'AI作品' : '您的作品'));
const leftOptionValue = computed(() => (leftFirst.value ? 'yours' : 'ai'));
const rightOptionValue = computed(() => (leftFirst.value ? 'ai' : 'yours'));

const leftWork = computed(() => (leftFirst.value ? props.phase1Plan : study1AiWork));
const rightWork = computed(() => (leftFirst.value ? study1AiWork : props.phase1Plan));

onMounted(() => {
  if (props.initialLeftFirst === null || props.initialLeftFirst === undefined) leftFirst.value = Math.random() >= 0.5;
});

const briefExpanded = ref(false);
const briefPreview = computed(() => {
  const s = briefQuestion1.replace(/\n/g, ' ').slice(0, 80);
  return s + (briefQuestion1.length > 80 ? '…' : '');
});

const scores = ref(props.initialScores && typeof props.initialScores === 'object' ? { ...props.initialScores } : {});
function getScore(questionNo, which) {
  const k = `${questionNo}_${which}`;
  return scores.value[k] ?? null;
}
function setScore(questionNo, which, value) {
  const k = `${questionNo}_${which}`;
  scores.value[k] = value;
}
const scoresFilled = computed(() => {
  for (const item of creativityScaleItems) {
    if (getScore(item.no, 'yours') == null || getScore(item.no, 'ai') == null) return false;
  }
  return true;
});

const submitStep = ref(!!props.initialSubmitStep);
const chosenSide = ref(props.initialChosenSide || '');
const radioName = 'phase1_choice_' + Math.random();

let saveTimer = null;
function emitSave() {
  emit('save', {
    step5Scores: { ...scores.value },
    step5SubmitStep: submitStep.value,
    step5ChosenSide: chosenSide.value,
    step5LeftFirst: leftFirst.value,
  });
}
watch(
  () => ({ scores: { ...scores.value }, submitStep: submitStep.value, chosenSide: chosenSide.value }),
  () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(emitSave, 500);
  },
  { deep: true }
);

function buildScoresJson() {
  const arr = [];
  for (const item of creativityScaleItems) {
    arr.push({
      question_no: item.no,
      your_score: getScore(item.no, 'yours'),
      ai_score: getScore(item.no, 'ai'),
    });
  }
  return arr;
}

function onConfirmSubmit() {
  if (!chosenSide.value) return;
  const chosen = chosenSide.value === 'yours' ? '您的作品' : 'AI作品';
  fetch('/api/study1-subject/phase1-choice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject_id: props.subjectId,
      chosen,
      scores_json: buildScoresJson(),
    }),
  })
    .then((r) => r.json())
    .then((data) => { if (data.ok) emit('next'); })
    .catch(() => {});
}
</script>

<style scoped>
.compare-wrap {
  height: 100vh;
  background: var(--color-page-bg);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  overflow: hidden;
}
/* 顶部区 */
.top-section { flex: 0 0 auto; max-height: 20vh; display: flex; flex-direction: column; gap: 0; overflow: hidden; }
.top-desc, .top-brief { padding: 10px; overflow: auto; }
.brief-preview { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.brief-actions { text-align: center; margin-top: 6px; }
.btn-regular { width: 80px; height: 36px; border-radius: 4px; border: none; background: var(--color-active-bg); color: var(--color-text); font-size: 14px; cursor: pointer; }
.btn-regular:hover { background: var(--color-secondary); }
/* 简报悬浮框 */
.brief-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.15);
  display: flex; align-items: center; justify-content: center;
  z-index: 100; padding: 40px 20px;
}
.brief-modal {
  background: #F5FBFF; border: 1px solid var(--color-secondary);
  border-radius: 6px; padding: 20px;
  max-width: 90%; max-height: 80%; overflow: auto;
}
/* 中间区 作品对比：用 flex + order 控制左右顺序，与打分栏一致 */
.mid-section { flex: 1 1 45%; min-height: 0; display: flex; gap: 10px; }
.work-col { flex: 1; min-width: 0; overflow-y: auto; padding: 16px; }
.work-label { color: #333333; font-weight: 600; margin: 0 0 8px 0; }
.work-blocks p { margin: 2px 0; }
.work-text { white-space: pre-wrap; }
/* 底部区 评分/提交 */
.bottom-section { flex: 1 1 35%; min-height: 0; overflow-y: auto; padding: 10px; background: var(--color-input-bg); }
.scale-block { padding: 10px; margin-top: 6px; }
.scale-row { margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #eee; }
.scale-row:last-child { border-bottom: none; }
.scale-header { margin-bottom: 4px; }
.scale-header .text-h3 { display: block; }
/* 两个打分轴水平排列 */
.scale-axes { display: flex; gap: 24px; align-items: center; flex-wrap: wrap; }
.axis-item { display: flex; align-items: center; gap: 6px; }
.axis-label { font-size: 13px; font-weight: 500; color: var(--color-text); white-space: nowrap; min-width: 60px; }
.btn-row { margin-top: 10px; display: flex; justify-content: center; }
/* 单选框行 */
.radio-row { display: flex; gap: 20px; margin: 12px 0; }
.radio-label { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; color: var(--color-text); cursor: pointer; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
.custom-radio {
  display: inline-block; width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid #BDBDBD; background: #fff; flex-shrink: 0;
  transition: all 0.15s; box-shadow: 0 0 0 1px rgba(0,0,0,0.05);
}
.custom-radio.checked { border-color: var(--color-primary); background: var(--color-primary); }
@media (max-width: 900px) {
  .mid-section { flex-direction: column; }
  .scale-axes { flex-direction: column; gap: 4px; }
}
</style>
