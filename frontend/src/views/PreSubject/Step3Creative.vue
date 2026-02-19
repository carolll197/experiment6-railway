<template>
  <div class="creative-wrap">
    <div class="timer-bar text-score">{{ timeText }}</div>
    <div class="timer-note text-hint italic" style="text-align: center; font-size: 12px; margin-bottom: 8px;">倒计时结束将自动保存并提交已填内容</div>
    <div class="two-cols">
      <div class="left-col panel-border">
        <div class="left-top file-container panel-border">
          <h2 class="brief-eval-section-title">创意简报</h2>
          <p class="text-hint" style="margin: 8px 0;">“现象观察”仅用于激活思路，不要求参考，更不必全部参考。请按照右侧的产出要求进行撰写并填空。</p>
          <BriefContent :content="briefQuestion1" />
        </div>
        <div class="left-bottom file-container panel-border">
          <h2 class="text-h2">创造力维度</h2>
          <EvalDimension />
        </div>
      </div>
      <div class="right-col panel-border">
        <div class="module panel-border" v-for="(m, i) in modules" :key="i" :class="{ 'module-big': m.big }">
          <h2 class="text-h2" style="font-weight: 400;">{{ m.title }} <span class="text-label">（每栏至少20个字）</span></h2>
          <p class="text-hint" style="margin: 6px 0;" v-html="m.hint"></p>
          <BaseTextArea
            v-model="form[m.key]"
            :placeholder="m.placeholder"
            show-count
            :min-length="20"
          />
        </div>
        <div class="btn-row">
          <BasePrimaryButton label="完成创作" :enabled="true" @click="onSubmit" />
        </div>
      </div>
    </div>
    <BaseModal
      :visible="showFailModal"
      title="提交失败"
      confirm-text="继续填写"
      @confirm="showFailModal = false"
    >
      <p class="text-body">原因：{{ failReason }}</p>
    </BaseModal>
    <BaseModal
      :visible="showAutoSavedModal"
      confirm-text="确认"
      @confirm="onConfirmAutoSaved"
    >
      <p class="text-body">感谢您的作答，您的作品已被自动保存</p>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import BaseTextArea from '../../components/BaseTextArea.vue';
import BasePrimaryButton from '../../components/BasePrimaryButton.vue';
import BaseModal from '../../components/BaseModal.vue';
import EvalDimension from '../../components/EvalDimension.vue';
import BriefContent from '../../components/BriefContent.vue';
import { briefQuestion1 } from '../../content/preExperiment.js';

const props = defineProps({
  subjectId: String,
  name: String,
  visitorId: String,
  initialCreativeForm: { type: Object, default: () => ({}) },
  initialTimerRemaining: { type: Number, default: null },
  startTime: String,
});
const emit = defineEmits(['next', 'saveProgress']);

const TOTAL_SEC = 10 * 60;
const remaining = ref(
  props.initialTimerRemaining != null && props.initialTimerRemaining > 0 && props.initialTimerRemaining <= TOTAL_SEC
    ? props.initialTimerRemaining
    : TOTAL_SEC
);
let timer = null;
let saveProgressTimer = null;
let saveProgressInterval = null;

const timeText = computed(() => {
  const r = remaining.value;
  const m = Math.floor(r / 60);
  const s = r % 60;
  return `剩余${m}分${s}秒`;
});

const defaultForm = () => ({
  target_audience: '',
  pain_point: '',
  insight: '',
  big_idea: '',
  rationale: '',
});
const form = ref({ ...defaultForm() });

const modules = [
  {
    key: 'target_audience',
    title: '目标受众画像 (Target Audience)',
    hint: '您打算把这个产品卖给哪类人群？有典型人物吗？ta是一个怎样的人？',
    placeholder: '',
    big: false,
  },
  {
    key: 'pain_point',
    title: '痛点挖掘(The Pain Point)',
    hint: 'ta为什么这样做？ta在烦恼什么？',
    placeholder: '',
    big: false,
  },
  {
    key: 'insight',
    title: '核心洞察（Insight）',
    hint: '您发现了哪些ta的心里话？可以用"其实，我……"或"我渴望……"的句式描述。',
    placeholder: '',
    big: false,
  },
  {
    key: 'big_idea',
    title: '核心创意（The Big Idea）',
    hint: '请包含以下两方面 1）概括您的核心创意点，即您将如何解决ta的痛点？<br/>2）在广告中，您打算用什么比喻、反转、或视觉符号，来直观地展示产品？请简要描述某一视觉画面来呈现您最关键的创意设定。',
    placeholder: '',
    big: true,
  },
  {
    key: 'rationale',
    title: '创意理由（Rationale）',
    hint: '为什么这个创意点能打动这群人？',
    placeholder: '',
    big: false,
  },
];

const MIN_LEN = 20;
const labels = {
  target_audience: '目标受众画像',
  pain_point: '痛点挖掘',
  insight: '核心洞察',
  big_idea: '核心创意',
  rationale: '创意理由',
};

function wordCount(str) {
  return (str || '').replace(/\s/g, '').length;
}
function firstInvalidField() {
  for (const k of Object.keys(form.value)) {
    if (wordCount(form.value[k]) < MIN_LEN) return { key: k, label: labels[k] };
  }
  return null;
}

const showFailModal = ref(false);
const showAutoSavedModal = ref(false);
const failReason = ref('');

function onSubmit() {
  const invalid = firstInvalidField();
  if (invalid) {
    failReason.value = `${invalid.label}字数至少为20个字`;
    showFailModal.value = true;
    return;
  }
  submitPlan(false);
}

function submitPlan(isAutoSaved) {
  const payload = {
    subject_id: props.subjectId,
    name: props.name,
    target_audience: form.value.target_audience,
    pain_point: form.value.pain_point,
    insight: form.value.insight,
    big_idea: form.value.big_idea,
    rationale: form.value.rationale,
    is_auto_saved: isAutoSaved ? 1 : 0,
    startTime: props.startTime,
    endTime: new Date().toISOString(),
  };
  const h = { 'Content-Type': 'application/json' };
  if (props.visitorId) h['X-Visitor-Id'] = props.visitorId;
  fetch('/api/pre-subject/submit', {
    method: 'POST',
    headers: h,
    body: JSON.stringify(payload),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.ok) {
        // 倒计时结束自动提交时直接跳转，不需要用户确认
        emit('next');
      }
    })
    .catch(() => {
      // 即使网络异常也直接跳转，确保用户体验流畅
      emit('next');
    });
}

function onConfirmAutoSaved() {
  showAutoSavedModal.value = false;
  emit('next');
}

function emitProgress() {
  emit('saveProgress', { form: { ...form.value }, timerRemaining: remaining.value });
}

onMounted(() => {
  const init = props.initialCreativeForm;
  if (init && typeof init === 'object') {
    form.value = { ...defaultForm(), ...init };
  }
  if (props.initialTimerRemaining != null && props.initialTimerRemaining > 0 && props.initialTimerRemaining <= TOTAL_SEC) {
    remaining.value = props.initialTimerRemaining;
  }
  timer = setInterval(() => {
    remaining.value--;
    if (remaining.value <= 0) {
      if (timer) clearInterval(timer);
      submitPlan(true);
    }
  }, 1000);
  saveProgressInterval = setInterval(emitProgress, 30000);
});

watch(
  () => ({ ...form.value }),
  () => {
    if (saveProgressTimer) clearTimeout(saveProgressTimer);
    saveProgressTimer = setTimeout(emitProgress, 800);
  },
  { deep: true }
);

onUnmounted(() => {
  if (timer) clearInterval(timer);
  if (saveProgressTimer) clearTimeout(saveProgressTimer);
  if (saveProgressInterval) clearInterval(saveProgressInterval);
});
</script>

<style scoped>
.creative-wrap {
  min-height: 100vh;
  background: var(--color-page-bg);
  padding: 16px;
}
.timer-bar {
  text-align: center;
  padding: 8px 0;
  position: sticky;
  top: 0;
  background: var(--color-page-bg);
  z-index: 10;
}
.two-cols {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: start;
}
.left-col {
  display: grid;
  grid-template-rows: 70% 1fr;
  gap: 8px;
  max-height: calc(100vh - 80px);
  overflow: hidden;
}
.left-top, .left-bottom {
  overflow: auto;
  padding: 16px;
}
.right-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: calc(100vh - 80px);
  overflow: auto;
  padding: 12px;
  background: var(--color-page-bg);
}
.module {
  padding: 12px;
  border: 1px solid var(--color-border-line);
  border-radius: 0;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.module-big {
  min-height: 280px;
}
.module :deep(.base-textarea-wrap) {
  flex: 0 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: 180px;
}
.module :deep(textarea) {
  flex: 1;
  min-height: 100px;
  overflow-y: auto;
  resize: none;
}
.module-big :deep(.base-textarea-wrap) {
  max-height: 200px;
}
.module-big :deep(textarea) {
  min-height: 140px;
}
.brief-text {
  white-space: pre-wrap;
}
.btn-row {
  margin-top: 24px;
  padding: 8px 0;
  display: flex;
  justify-content: center;
}
@media (max-width: 900px) {
  .two-cols { grid-template-columns: 1fr; }
}
</style>
