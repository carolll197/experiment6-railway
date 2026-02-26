<template>
  <div class="round-wrap">
    <div v-if="innerStep === 0" class="issue-wrap">
      <div class="timer-bar text-score">{{ timeText }}</div>
      <div class="timer-note text-hint italic" style="text-align: center; font-size: 12px; margin-bottom: 8px;">倒计时结束将自动保存并提交已填内容</div>
      <p class="text-hint center" style="margin: 16px 0;">目前为"第1题（共两题）"，每道题目您均有10分钟时间作答。产出要求同环节一。</p>
      <div class="file-container panel-border brief-block">
        <h2 class="brief-eval-section-title">创意简报</h2>
        <BriefContent :content="briefQuestion2Full" />
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
      <div class="timer-note text-hint italic" style="text-align: center; font-size: 12px; margin-bottom: 8px;">倒计时结束将自动保存并提交已填内容</div>
      <div class="two-cols">
        <div class="left-col panel-border">
          <div class="left-top file-container panel-border">
            <h2 class="brief-eval-section-title">创意简报</h2>
            <BriefContent :content="briefQuestion2Full" />
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
                  <AiSuggestionContent :content="aiSuggestionQuestion2" />
                </div>
                <p v-if="aiDone" class="text-score ai-done-tip">AI已生成方案供您参考。</p>
              </div>
            </div>
          </div>
        </div>
        <div class="right-col panel-border">
          <div class="module panel-border" v-for="(m, i) in modules" :key="i" :class="{ 'module-big': m.big }">
            <h2 class="brief-eval-section-title">{{ m.title }} <span class="text-label">{{ m.lengthHint }}</span></h2>
            <p class="module-hint" style="margin: 6px 0;" v-html="m.hint"></p>
            <BaseTextArea v-model="form[m.key]" :placeholder="m.placeholder" show-count :min-length="m.minLength" />
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
import { briefQuestion2Full, aiSuggestionQuestion2 } from '../../content/study1Content.js';

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
let countdownTimer = null;
let saveInterval = null;
const timeText = computed(() => `剩余${Math.floor(remaining.value / 60)}分${remaining.value % 60}秒`);

const innerStep = ref(init?.innerStep === 1 ? 1 : 0);
const countdown = ref(init?.countdown != null ? Math.max(0, Number(init.countdown)) : 10);

const AI_NODES = ['分析题目及评价维度', '分析产出要求', '构思方案', '生成方案'];
const aiSent = ref(!!init?.aiSent);
const aiNodes = ref(init?.aiSent ? [...AI_NODES] : []);
const aiDone = ref(!!init?.aiDone);

const defaultForm = () => ({ big_idea: '', highlight_scene: '', slogan: '' });
const form = ref(init?.form && typeof init.form === 'object' ? { ...defaultForm(), ...init.form } : defaultForm());
const modules = [
  { key: 'big_idea', title: '模块1：核心创意点与设定（The Big Idea）', lengthHint: '至少50字', minLength: 50, hint: '如果这是一支视频广告，请概括你这支广告的"核心脑洞"，以下要素仅供参考：<br/>- 场景/世界观设定：故事发生在哪里？有什么特别之处？<br/>- 角色：主角是什么人或什么物？本产品在其中扮演了什么角色？<br/>- 核心故事线/反转：发生了什么事情？<br/><span class="hint-label">思维发散提示：</span><span class="hint-content">你可以把它当成任何一种电影类型来构思（如：科幻宇宙、悬疑探案、武侠江湖、奇幻动画等），也可以把它设定在极其特殊的时空场景，或者把它比作任何意想不到的人或事物。视角越出人意料越好，但也请记得创意目标。</span>', placeholder: '', big: true },
  { key: 'highlight_scene', title: '模块2：高光画面描述（The Highlight Scene）', lengthHint: '至少50字', minLength: 50, hint: '如果这是一支视频广告，请描绘其中最精彩、最抓人眼球的那一幕画面。<br/><span class="hint-label">画面丰富度提示：</span><span class="hint-content">请尽量调动观众的多重感官！补充丰富的视觉细节（如：冷暖光影、特写镜头、极具反差的色彩）、听觉细节（如：特殊的音效、背景音乐、环境音）以及角色的细微动作或表情。细节越丰满、戏剧张力越强越好！</span>', placeholder: '', big: true },
  { key: 'slogan', title: '模块3：主打广告语（The Slogan）', lengthHint: '无最低字数限制', minLength: 0, hint: '请为你的广告写一句作为结尾的"点睛之笔"（一句话广告语）。<br/><span class="hint-label">金句提示：</span><span class="hint-content">不需要像传统的促销口号，它可以是一句极具态度的宣言、一个充满画面感的神级反转，或者一句直击灵魂的感叹。</span>', placeholder: '', big: false },
];

const MIN_LEN = 50;
const labels = { big_idea: '核心创意点与设定', highlight_scene: '高光画面描述', slogan: '主打广告语' };
function wordCount(str) { return (str || '').replace(/\s/g, '').length; }
function firstInvalidField() {
  if (wordCount(form.value.big_idea) < MIN_LEN) return { key: 'big_idea', label: labels.big_idea };
  if (wordCount(form.value.highlight_scene) < MIN_LEN) return { key: 'highlight_scene', label: labels.highlight_scene };
  return null;
}

const showFailModal = ref(false);
const showAutoSavedModal = ref(false);
const failReason = ref('');

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

function submitPlan(isAutoSaved) {
  if (timer) { clearInterval(timer); timer = null; }
  if (saveInterval) { clearInterval(saveInterval); saveInterval = null; }
  const payload = {
    subject_id: props.subjectId,
    name: props.name,
    phase: '环节二题目2',
    question_no: 2,
    big_idea: form.value.big_idea,
    highlight_scene: form.value.highlight_scene,
    slogan: form.value.slogan,
    is_auto_saved: isAutoSaved ? 1 : 0,
  };
  fetch('/api/study1-subject/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    .then((r) => r.json())
    .then((data) => {
      if (data.ok) emit('next');
      else emit('next');
    })
    .catch(() => {
      emit('next');
    });
}

function onSubmit() {
  const invalid = firstInvalidField();
  if (invalid) { failReason.value = `${invalid.label}字数至少为50个字`; showFailModal.value = true; return; }
  submitPlan(false);
}

function onConfirmAutoSaved() {
  showAutoSavedModal.value = false;
  emit('next');
}

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

onMounted(() => {
  if (innerStep.value === 0) {
    if (countdown.value > 0) {
      countdownTimer = setInterval(() => {
        if (countdown.value > 0) countdown.value--;
        else if (countdownTimer) clearInterval(countdownTimer);
      }, 1000);
    }
  } else if (innerStep.value === 1 && !timer) {
    timer = setInterval(() => {
      remaining.value--;
      if (remaining.value <= 0) submitPlan(true);
    }, 1000);
    saveInterval = setInterval(emitSave, 30000);
  }
  setTimeout(emitSave, 500);
});

watch(innerStep, (val) => {
  if (val === 1 && !timer) {
    timer = setInterval(() => {
      remaining.value--;
      if (remaining.value <= 0) submitPlan(true);
    }, 1000);
    if (!saveInterval) saveInterval = setInterval(emitSave, 30000);
    emitSave();
  }
});
watch(() => ({ ...form.value }), () => { setTimeout(emitSave, 600); }, { deep: true });

onUnmounted(() => { if (timer) clearInterval(timer); if (countdownTimer) clearInterval(countdownTimer); if (saveInterval) clearInterval(saveInterval); });
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
.module :deep(textarea) { flex: 1; min-height: 100px; overflow-y: auto; resize: none; font-size: 16px; font-family: "FangSong", "仿宋", "STFangsong", serif; }
.module-big :deep(.base-textarea-wrap) { max-height: 200px; }
.module-big :deep(textarea) { min-height: 140px; font-size: 16px; font-family: "FangSong", "仿宋", "STFangsong", serif; }
.brief-eval-section-title { font-size: 16px; font-weight: 600; font-family: "SimSun", "Songti SC", serif; }
.module-hint { font-style: normal; font-size: 14px; color: var(--color-text); line-height: 1.5; font-family: "SimSun", "Songti SC", serif; }
.module-hint :deep(.hint-label) { font-weight: 700; font-family: "SimSun", "Songti SC", serif; }
.module-hint :deep(.hint-content) { font-weight: 400; font-family: "SimSun", "Songti SC", serif; }
@media (max-width: 900px) { .collab-wrap .two-cols { grid-template-columns: 1fr; } }
</style>
