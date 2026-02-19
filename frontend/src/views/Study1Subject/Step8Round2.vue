<template>
  <div class="round-wrap">
    <div v-if="innerStep === 0" class="issue-wrap">
      <div class="timer-bar text-score">{{ timeText }}</div>
      <p class="text-hint center" style="margin: 16px 0;">目前为"第2题（共两题）"，每道题目您均有10分钟时间作答。产出要求与之前相同。</p>
      <div class="file-container panel-border brief-block">
        <h2 class="brief-eval-section-title">创意简报</h2>
        <p class="text-hint" style="margin: 8px 0;">"现象观察"仅用于激活思路，不要求参考，更不必全部参考。</p>
        <BriefContent :content="briefQuestion3FullText" />
      </div>
      <div class="file-container panel-border eval-block">
        <h2 class="brief-eval-section-title spacing-12">评价维度</h2>
        <EvalDimension />
      </div>
      <div class="btn-row">
        <BasePrimaryButton label="开始协作" :enabled="countdown === 0" :countdown="countdown" @click="innerStep = 1" />
      </div>
    </div>
    <div v-else class="collab-wrap">
      <div class="timer-bar text-score">{{ timeText }}</div>
      <div class="two-cols">
        <div class="left-col panel-border">
          <div class="left-top file-container panel-border">
            <h2 class="brief-eval-section-title">创意简报</h2>
            <p class="text-hint" style="margin: 8px 0;">"现象观察"仅用于激活思路，不要求参考，更不必全部参考。</p>
            <BriefContent :content="briefQuestion3FullText" />
            <h2 class="brief-eval-section-title spacing-12">评价维度</h2>
            <EvalDimension />
          </div>
          <div class="left-bottom panel-border ai-dialog">
            <div class="ai-header">
              <span class="ai-avatar">AI</span>
              <span class="ai-name">AI创意助手</span>
            </div>
            <div class="ai-body">
              <div v-if="!aiSent" class="ai-placeholder">
                <button type="button" class="ai-send-btn" @click="sendAi">点击一键发送题目、评价维度及产出要求</button>
              </div>
              <div v-else class="ai-messages">
                <div class="ai-msg-user" v-if="aiSent">
                  <span class="msg-bubble msg-user-bubble text-body">已发送题目、评价维度及产出要求</span>
                </div>
                <div class="ai-msg-system">
                  <p v-for="(line, i) in aiNodes" :key="'n'+i" class="ai-node text-hint">▶ {{ line }}</p>
                </div>
                <div v-if="aiDone" class="ai-msg-ai">
                  <AiSuggestionContent :content="aiSuggestionQuestion3" />
                </div>
                <p v-if="aiDone" class="text-score ai-done-tip">AI已生成方案供您参考。</p>
              </div>
            </div>
          </div>
        </div>
        <div class="right-col panel-border">
          <div class="module panel-border" v-for="(m, i) in modules" :key="i" :class="{ 'module-big': m.big }">
            <h2 class="text-h2" style="font-weight: 400;">{{ m.title }} <span class="text-label">（每栏至少20个字）</span></h2>
            <p class="text-hint" style="margin: 6px 0;" v-html="m.hint"></p>
            <BaseTextArea v-model="form[m.key]" :placeholder="m.placeholder" show-count :min-length="20" />
          </div>
          <div class="btn-row">
            <BasePrimaryButton label="完成创作" :enabled="true" @click="onSubmit" />
          </div>
        </div>
      </div>
    </div>
    <BaseModal :visible="showFailModal" title="提交失败" confirm-text="继续填写" @confirm="showFailModal = false">
      <p class="text-body">原因：{{ failReason }}</p>
    </BaseModal>
    <BaseModal :visible="showAutoSavedModal" confirm-text="确认" @confirm="onConfirmAutoSaved">
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
import AiSuggestionContent from '../../components/AiSuggestionContent.vue';
import { briefQuestion3FullText, aiSuggestionQuestion3 } from '../../content/study1Content.js';

const props = defineProps({
  subjectId: String,
  name: String,
  initialState: { type: Object, default: null },
});
const emit = defineEmits(['next', 'save']);

const TOTAL_SEC = 10 * 60;
const init = props.initialState;
const remaining = ref(
  init?.timerRemaining != null && init.timerRemaining > 0 && init.timerRemaining <= TOTAL_SEC ? init.timerRemaining : TOTAL_SEC
);
let timer = null;
const timeText = computed(() => `剩余${Math.floor(remaining.value / 60)}分${remaining.value % 60}秒`);

const innerStep = ref(init?.innerStep === 1 ? 1 : 0);
const countdown = ref(init?.countdown != null ? Math.max(0, Number(init.countdown)) : 10);
let countdownTimer = null;
let saveInterval = null;

function emitSave() {
  emit('save', {
    form: { ...form.value },
    timerRemaining: remaining.value,
    innerStep: innerStep.value,
    countdown: countdown.value,
    aiSent: aiSent.value,
    aiDone: aiDone.value,
  });
}

onMounted(() => {
  if (innerStep.value === 0 && (init?.countdown == null || init?.innerStep !== 0)) {
    countdown.value = 10;
    countdownTimer = setInterval(() => {
      if (countdown.value > 0) countdown.value--;
      else if (countdownTimer) clearInterval(countdownTimer);
    }, 1000);
  } else if (innerStep.value === 1 && !timer) {
    if (init?.timerRemaining != null && init.timerRemaining > 0) remaining.value = init.timerRemaining;
    timer = setInterval(() => {
      remaining.value--;
      if (remaining.value <= 0) {
        if (timer) clearInterval(timer);
        submitPlan(true);
      }
    }, 1000);
    saveInterval = setInterval(emitSave, 30000);
  }
});

watch(innerStep, (val) => {
  if (val === 1 && !timer) {
    timer = setInterval(() => {
      remaining.value--;
      if (remaining.value <= 0) {
        if (timer) clearInterval(timer);
        submitPlan(true);
      }
    }, 1000);
    if (!saveInterval) saveInterval = setInterval(emitSave, 30000);
  }
});
watch(() => ({ ...form.value }), () => { setTimeout(emitSave, 600); }, { deep: true });

onUnmounted(() => { if (timer) clearInterval(timer); if (countdownTimer) clearInterval(countdownTimer); if (saveInterval) clearInterval(saveInterval); });

const AI_NODES = ['分析题目及评价维度', '分析产出要求', '构思方案', '生成方案'];
const aiSent = ref(!!init?.aiSent);
const aiNodes = ref(init?.aiSent ? [...AI_NODES] : []);
const aiDone = ref(!!init?.aiDone);

function sendAi() {
  aiSent.value = true;
  let i = 0;
  const addNode = () => {
    if (i < AI_NODES.length) {
      aiNodes.value.push(AI_NODES[i]);
      i++;
      setTimeout(addNode, 600);
    } else {
      aiDone.value = true;
    }
  };
  setTimeout(addNode, 400);
}

const defaultForm = () => ({ target_audience: '', pain_point: '', insight: '', big_idea: '', rationale: '' });
const form = ref(init?.form && typeof init.form === 'object' ? { ...defaultForm(), ...init.form } : defaultForm());
const modules = [
  { key: 'target_audience', title: '目标受众画像 (Target Audience)', hint: '您打算把这个产品卖给哪类人群？有典型人物吗？ta是一个怎样的人？', placeholder: '', big: false },
  { key: 'pain_point', title: '痛点挖掘(The Pain Point)', hint: 'ta为什么这样做？ta在烦恼什么？', placeholder: '', big: false },
  { key: 'insight', title: '核心洞察（Insight）', hint: '您发现了哪些ta的心里话？可以用"其实，我……"或"我渴望……"的句式描述。', placeholder: '', big: false },
  { key: 'big_idea', title: '核心创意（The Big Idea）', hint: '请包含以下两方面 1）概括您的核心创意点，即您将如何解决ta的痛点？<br/>2）在广告中，您打算用什么比喻、反转、或视觉符号，来直观地展示产品？请简要描述某一视觉画面来呈现您最关键的创意设定。', placeholder: '', big: true },
  { key: 'rationale', title: '创意理由（Rationale）', hint: '为什么这个创意点能打动这群人？', placeholder: '', big: false },
];

const MIN_LEN = 20;
const labels = { target_audience: '目标受众画像', pain_point: '痛点挖掘', insight: '核心洞察', big_idea: '核心创意', rationale: '创意理由' };
function wordCount(str) { return (str || '').replace(/\s/g, '').length; }
function firstInvalidField() {
  for (const k of Object.keys(form.value)) { if (wordCount(form.value[k]) < MIN_LEN) return { key: k, label: labels[k] }; }
  return null;
}

const showFailModal = ref(false);
const showAutoSavedModal = ref(false);
const failReason = ref('');

function onSubmit() {
  const invalid = firstInvalidField();
  if (invalid) { failReason.value = `${invalid.label}字数至少为20个字`; showFailModal.value = true; return; }
  submitPlan(false);
}

function submitPlan(isAutoSaved) {
  const payload = {
    subject_id: props.subjectId,
    name: props.name,
    phase: '环节二题目3',
    question_no: 3,
    target_audience: form.value.target_audience,
    pain_point: form.value.pain_point,
    insight: form.value.insight,
    big_idea: form.value.big_idea,
    rationale: form.value.rationale,
    is_auto_saved: isAutoSaved ? 1 : 0,
  };
  fetch('/api/study1-subject/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    .then((r) => r.json())
    .then((data) => {
      if (data.ok) {
        if (isAutoSaved) showAutoSavedModal.value = true;
        else emit('next');
      }
    })
    .catch(() => {
      if (isAutoSaved) {
        showAutoSavedModal.value = true;
      } else {
        failReason.value = '网络异常，请检查网络后重试';
        showFailModal.value = true;
      }
    });
}

function onConfirmAutoSaved() {
  showAutoSavedModal.value = false;
  emit('next');
}
</script>

<style scoped>
.round-wrap { min-height: 100vh; background: var(--color-page-bg); padding: 16px; }
.timer-bar { text-align: center; padding: 8px 0; position: sticky; top: 0; background: var(--color-page-bg); z-index: 10; }
.issue-wrap { width: 90%; max-width: 800px; margin: 0 auto; padding: 15px; }
.brief-block, .eval-block { padding: 16px; margin: 12px 0; }
.brief-text { white-space: pre-wrap; }
.btn-row { margin: 24px 0 12px; padding: 8px 0; text-align: center; }
.btn-regular { width: 120px; height: 36px; border-radius: 4px; border: none; background: var(--color-active-bg); color: var(--color-text); font-size: 14px; cursor: pointer; }
.collab-wrap .two-cols { width: 90%; max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; }
.left-col { display: grid; grid-template-rows: 30% 1fr; gap: 8px; max-height: calc(100vh - 80px); overflow: hidden; }
.left-top, .left-bottom { overflow: auto; padding: 16px; }
.ai-dialog { background: var(--color-input-bg); border: 1px solid var(--color-secondary); border-radius: 6px; padding: 0; display: flex; flex-direction: column; }
.ai-header { display: flex; align-items: center; gap: 8px; padding: 10px 15px; border-bottom: 1px solid #e8e8e8; flex-shrink: 0; }
.ai-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--color-primary); color: #fff; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ai-name { font-size: 14px; font-weight: 600; color: var(--color-text); }
.ai-body { flex: 1; overflow-y: auto; padding: 12px 15px; }
.ai-placeholder { display: flex; justify-content: center; align-items: flex-end; min-height: 80px; padding-bottom: 12px; }
.ai-send-btn { padding: 8px 20px; min-width: 200px; height: 36px; border-radius: 18px; border: 1px solid var(--color-primary); background: var(--color-active-bg); color: var(--color-text); font-size: 13px; cursor: pointer; white-space: nowrap; }
.ai-send-btn:hover { background: var(--color-secondary); }
.ai-messages {}
.ai-msg-user { display: flex; justify-content: flex-end; margin-bottom: 8px; }
.msg-bubble { padding: 8px 12px; border-radius: 12px; max-width: 85%; }
.msg-user-bubble { background: var(--color-active-bg); }
.ai-msg-system { margin-bottom: 8px; }
.ai-node { margin: 4px 0; }
.ai-msg-ai { background: #fff; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; border: 1px solid #eee; }
.ai-done-tip { margin-top: 8px; }
.right-col { display: flex; flex-direction: column; gap: 20px; max-height: calc(100vh - 80px); overflow: auto; padding: 12px; background: var(--color-page-bg); }
.module { padding: 12px; border: 1px solid var(--color-border-line); min-height: 120px; display: flex; flex-direction: column; flex-shrink: 0; }
.module-big { min-height: 280px; }
.module :deep(.base-textarea-wrap) { flex: 0 1 auto; display: flex; flex-direction: column; min-height: 0; max-height: 180px; }
.module :deep(textarea) { flex: 1; min-height: 100px; overflow-y: auto; resize: none; }
.module-big :deep(.base-textarea-wrap) { max-height: 200px; }
.module-big :deep(textarea) { min-height: 140px; }
@media (max-width: 900px) { .collab-wrap .two-cols { grid-template-columns: 1fr; } }
</style>
