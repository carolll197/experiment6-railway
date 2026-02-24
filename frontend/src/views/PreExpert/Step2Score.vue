<template>
  <div class="score-page">
    <div class="two-cols">
      <div class="left-col">
        <div class="left-top file-container panel-border brief-big">
          <h2 class="brief-eval-section-title">创意简报</h2>
          <BriefContent :content="briefQuestion1" />
        </div>
        <div class="left-bottom file-container panel-border">
          <div class="plan-header-row">
            <div class="text-score counter">{{ currentIndex + 1 }}/{{ plans.length }}</div>
            <button type="button" class="btn-refresh" :disabled="loadingPlans" @click="refreshPlans">{{ loadingPlans ? '刷新中…' : '刷新方案列表' }}</button>
          </div>
          <h3 class="text-h3" style="margin: 8px 0;">被试编号：{{ currentPlan ? currentPlan.subject_id : '—' }}</h3>
          <div v-if="currentPlan" class="plan-blocks text-body">
            <p><strong>核心创意点与设定</strong></p>
            <p class="plan-text">{{ currentPlan.big_idea || '—' }}</p>
            <p style="margin-top: 6px;"><strong>高光画面描述</strong></p>
            <p class="plan-text">{{ currentPlan.highlight_scene || '—' }}</p>
            <p style="margin-top: 6px;"><strong>主打广告语</strong></p>
            <p class="plan-text">{{ currentPlan.slogan || '—' }}</p>
          </div>
          <div class="invalid-wrap">
            <BaseCheckbox v-model="currentInvalid" label="标记为无效数据" />
          </div>
        </div>
      </div>
      <div class="right-col panel-border">
        <h2 class="text-h2 center">创造力评分量表</h2>
        <div class="file-container scale-content">
          <template v-for="(item, idx) in creativityScaleItems" :key="item.no">
            <div class="scale-item" :class="{ 'scale-item-first': isFirstInDimension(idx) }">
              <span class="text-h3">{{ item.dimension }}：{{ item.text }}</span>
              <BaseScoreAxis :model-value="getScore(item.no)" @update:model-value="setScore(item.no, $event)" />
            </div>
          </template>
        </div>
        <div class="btn-row">
          <button
            type="button"
            class="btn-regular"
            :class="{ disabled: currentIndex === 0 }"
            :disabled="currentIndex === 0"
            @click="prev"
          >上一份</button>
          <button
            type="button"
            class="btn-regular"
            :class="{ disabled: !canNext }"
            :disabled="!canNext"
            @click="next"
          >下一份</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
let saveTimer = null;
import BaseCheckbox from '../../components/BaseCheckbox.vue';
import BaseScoreAxis from '../../components/BaseScoreAxis.vue';
import BriefContent from '../../components/BriefContent.vue';
import { briefQuestion1, creativityScaleItems } from '../../content/preExperiment.js';

const props = defineProps({
  expertName: { type: String, default: '' },
});
const emit = defineEmits(['next']);

const plans = ref([]);
const currentIndex = ref(0);
const loadingPlans = ref(false);
const scoresBySubject = ref({});
const invalidBySubject = ref({});

const currentPlan = computed(() => plans.value[currentIndex.value] || null);

function getScore(questionNo) {
  const sid = currentPlan.value?.subject_id;
  if (!sid) return null;
  const s = scoresBySubject.value[sid]?.scores || {};
  return s[questionNo] ?? null;
}
function setScore(questionNo, value) {
  const sid = currentPlan.value?.subject_id;
  if (!sid) return;
  if (!scoresBySubject.value[sid]) scoresBySubject.value[sid] = { scores: {} };
  scoresBySubject.value[sid].scores[questionNo] = value;
}

const currentInvalid = computed({
  get() {
    const sid = currentPlan.value?.subject_id;
    return sid ? !!invalidBySubject.value[sid] : false;
  },
  set(v) {
    const sid = currentPlan.value?.subject_id;
    if (sid) invalidBySubject.value[sid] = v;
  },
});

function isFirstInDimension(idx) {
  if (idx === 0) return true;
  return creativityScaleItems[idx].dimension !== creativityScaleItems[idx - 1].dimension;
}

const canNext = computed(() => {
  const sid = currentPlan.value?.subject_id;
  if (!sid) return false;
  // 标记为无效数据后可以直接点下一份
  if (invalidBySubject.value[sid]) return true;
  const s = scoresBySubject.value[sid]?.scores || {};
  for (let i = 1; i <= 11; i++) if (s[i] == null || s[i] === undefined) return false;
  return true;
});

function saveCurrentScores() {
  const plan = currentPlan.value;
  if (!plan) return;
  const sid = plan.subject_id;
  const isInvalid = !!invalidBySubject.value[sid];
  const s = scoresBySubject.value[sid]?.scores || {};
  const scores = [];
  for (let i = 1; i <= 11; i++) {
    const v = s[i];
    scores.push({ question_no: i, score: v != null ? v : 0 });
  }
  if (!isInvalid) {
    let filled = 0;
    for (let i = 1; i <= 11; i++) if (s[i] != null) filled++;
    if (filled !== 11) return;
  }
  return fetch('/api/pre-expert/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject_id: sid,
      expert_name: props.expertName || '',
      scores,
      is_invalid: isInvalid,
    }),
  }).then((r) => r.json());
}

function prev() {
  if (currentIndex.value <= 0) return;
  currentIndex.value--;
}

async function next() {
  if (!canNext.value) return;
  const plan = currentPlan.value;
  if (!plan) return;
  await saveCurrentScores();
  if (currentIndex.value + 1 >= plans.value.length) {
    emit('next');
    return;
  }
  currentIndex.value++;
}

// 分数或无效标记变更后自动保存，便于主试端同步
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveCurrentScores();
    saveTimer = null;
  }, 800);
}
watch(
  () => ({ sid: currentPlan.value?.subject_id, scores: scoresBySubject.value, invalid: invalidBySubject.value }),
  () => { if (currentPlan.value) scheduleSave(); },
  { deep: true }
);

function fetchPlans() {
  loadingPlans.value = true;
  fetch('/api/pre-expert/plans')
    .then((r) => r.json())
    .then((data) => {
      plans.value = Array.isArray(data) ? data : [];
      if (plans.value.length === 0) emit('next');
    })
    .catch(() => {})
    .finally(() => { loadingPlans.value = false; });
}
function refreshPlans() {
  fetchPlans();
}
onMounted(() => {
  fetchPlans();
});
</script>

<style scoped>
.score-page {
  min-height: 100vh;
  background: var(--color-page-bg);
  padding: 16px;
}
.two-cols {
  width: 95%;
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 70% 30%;
  gap: 12px;
  align-items: start;
}
.left-col {
  display: grid;
  grid-template-rows: 40% 1fr;
  gap: 8px;
  max-height: calc(100vh - 32px);
  overflow: hidden;
}
.left-top, .left-bottom {
  overflow: auto;
  padding: 16px;
  border: 1px solid var(--color-border-line);
}
.left-bottom { position: relative; }
.plan-header-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 8px;
}
.counter { flex-shrink: 0; }
.btn-refresh {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 4px;
  border: 1px solid var(--color-secondary);
  background: var(--color-page-bg);
  color: var(--color-text);
  cursor: pointer;
}
.btn-refresh:hover:not(:disabled) { background: var(--color-input-bg); }
.btn-refresh:disabled { opacity: 0.6; cursor: not-allowed; }
.plan-blocks p { margin: 2px 0; font-family: "SimSun", "Songti SC", serif; }
.plan-blocks .plan-text { white-space: pre-wrap; word-break: break-word; }
.invalid-wrap { margin-top: 16px; }
.right-col {
  position: sticky;
  top: 16px;
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 12px;
  background: var(--color-page-bg);
}
.scale-content { padding: 12px; overflow: auto; flex: 1; }
.scale-item {
  margin-top: 10px;
}
.scale-item-first { margin-top: 12px; }
.scale-item .text-h3 { display: block; margin-bottom: 4px; }
/* 专家版创意简报除标题外整体大两号 */
.brief-big :deep(.brief-content) { font-size: 16px; }
.brief-big :deep(.brief-content .brief-title) { font-size: 18px; }
.brief-big :deep(.brief-content .brief-subtitle) { font-size: 16px; }
.brief-big :deep(.brief-content .text-body) { font-size: 16px; }
.brief-text { white-space: pre-wrap; }
.btn-row {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 16px;
  flex-shrink: 0;
}
.btn-regular {
  width: 80px;
  height: 36px;
  border-radius: 4px;
  border: none;
  background: var(--color-active-bg);
  color: var(--color-text);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.btn-regular:hover:not(.disabled) { background: var(--color-secondary); }
.btn-regular.disabled {
  background: var(--color-btn-disabled-bg);
  color: var(--color-btn-disabled-text);
  cursor: not-allowed;
}
@media (max-width: 900px) {
  .two-cols { grid-template-columns: 1fr; }
  .right-col { position: static; }
}
</style>
