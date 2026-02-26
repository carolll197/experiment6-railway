<template>
  <div class="round-wrap">
    <div class="collab-wrap">
      <div class="timer-bar text-score">{{ timeText }}</div>
      <div class="timer-note text-hint italic" style="text-align: center; font-size: 12px; margin-bottom: 8px;">倒计时结束将自动保存并提交已填内容</div>
      <div class="two-cols">
        <div class="left-col panel-border">
          <div class="left-top file-container panel-border">
            <h2 class="brief-eval-section-title">创意简报</h2>
            <BriefContent :content="briefQuestion3FullText" />
            <h2 class="brief-eval-section-title spacing-12">评价维度（与环节一相同）</h2>
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
let saveInterval = null;
const timeText = computed(() => `剩余${Math.floor(remaining.value / 60)}分${remaining.value % 60}秒`);

const innerStep = ref(1);
// 实验说明页之后直接进入协作页，从页面呈现起即开始10分钟计时
const phase2StartTime = ref(init?.phase2StartTime || null);

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
    innerStep: 1,
    aiSent: aiSent.value,
    aiDone: aiDone.value,
    phase2StartTime: phase2StartTime.value,
  });
}

function submitPlan(isAutoSaved) {
  if (timer) { clearInterval(timer); timer = null; }
  if (saveInterval) { clearInterval(saveInterval); saveInterval = null; }
  const endTime = new Date().toISOString();
  const payload = {
    subject_id: props.subjectId,
    name: props.name,
    phase: '环节二',
    question_no: 1,
    big_idea: form.value.big_idea,
    highlight_scene: form.value.highlight_scene,
    slogan: form.value.slogan,
    is_auto_saved: isAutoSaved ? 1 : 0,
    startTime: phase2StartTime.value || endTime,
    endTime,
  };
  fetch('/api/study1-subject/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    .then((r) => r.json())
    .then((data) => {
      if (data && data.ok) emit('next');
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
  // 页面呈现即开始10分钟倒计时；开始时间用于提交
  if (!phase2StartTime.value) phase2StartTime.value = new Date().toISOString();
  if (!timer) {
    timer = setInterval(() => {
      remaining.value--;
      if (remaining.value <= 0) submitPlan(true);
    }, 1000);
  }
  if (!saveInterval) saveInterval = setInterval(emitSave, 30000);
  setTimeout(emitSave, 500);
});
watch(() => ({ ...form.value }), () => { setTimeout(emitSave, 600); }, { deep: true });

onUnmounted(() => { if (timer) clearInterval(timer); if (saveInterval) clearInterval(saveInterval); });
</script>

<style scoped>
.round-wrap { min-height: 100vh; background: var(--color-page-bg); padding: 16px; }
.timer-bar { text-align: center; padding: 8px 0; position: sticky; top: 0; background: var(--color-page-bg); z-index: 10; }
.collab-wrap .two-cols { width: 90%; max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; }
/* 左上栏与环节一创作页格式、字号一致 */
.left-col { display: grid; grid-template-rows: 1fr 1fr; gap: 8px; max-height: calc(100vh - 80px); overflow: hidden; }
.left-top, .left-bottom { overflow: auto; padding: 16px; font-family: "SimSun", "Songti SC", serif; }
.left-top :deep(.brief-eval-section-title),
.left-top :deep(.brief-content .brief-title) { font-size: 17px; font-weight: 600; font-family: "SimSun", "Songti SC", serif; }
.left-top :deep(.brief-content .brief-subtitle),
.left-top :deep(.brief-content .text-body) { font-size: 15px; font-family: "SimSun", "Songti SC", serif; }
.left-top :deep(.brief-content .brief-subtitle strong) { font-weight: 700; }
/* 创意简报正文（含创意素材 1.2.3.）与环节一创作页格式统一：行距 1.5 */
.left-top :deep(.brief-content) { line-height: 1.5; }
.left-top :deep(.brief-content .text-body) { line-height: 1.5; margin: 2px 0; }
.left-top :deep(.eval-dimension) { font-size: 16px; font-family: "SimSun", "Songti SC", serif; line-height: 1.5; }
.left-top :deep(.eval-dimension .text-h3) { font-size: 16px; font-weight: 700; margin: 8px 0 2px; }
.left-top :deep(.eval-dimension .text-body) { font-size: 16px; margin: 2px 0; }
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
/* AI作品正文整体调大一号 */
.ai-msg-ai { background: #fff; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; border: 1px solid #eee; font-family: "SimSun", "Songti SC", serif; }
.ai-msg-ai :deep(.ai-subtitle) { font-size: 16px; }
.ai-msg-ai :deep(.ai-body) { font-size: 16px; }
.ai-done-tip { margin-top: 8px; }
/* 右边栏产出要求与环节一创作页格式一致；完成创作按钮居中 */
.right-col { display: flex; flex-direction: column; gap: 20px; max-height: calc(100vh - 80px); overflow: auto; padding: 12px; background: var(--color-page-bg); }
.right-col .module { padding: 12px; border: 1px solid var(--color-border-line); min-height: 120px; display: flex; flex-direction: column; flex-shrink: 0; }
.right-col .module-big { min-height: 280px; }
.right-col .brief-eval-section-title { font-size: 17px; font-weight: 600; font-family: "SimSun", "Songti SC", serif; }
.right-col .module-hint { font-style: normal; font-size: 15px; color: var(--color-text); line-height: 1.5; font-family: "SimSun", "Songti SC", serif; }
.right-col .module-hint :deep(.hint-label) { font-weight: 700; }
.right-col .module-hint :deep(.hint-content) { font-weight: 400; }
.right-col .module :deep(.base-textarea-wrap) { flex: 0 1 auto; display: flex; flex-direction: column; min-height: 0; max-height: 180px; }
.right-col .module :deep(textarea) { flex: 1; min-height: 100px; overflow-y: auto; resize: none; font-size: 16px; font-weight: 700; font-family: "FangSong", "仿宋", "STFangsong", serif; }
.right-col .module-big :deep(.base-textarea-wrap) { max-height: 200px; }
.right-col .module-big :deep(textarea) { min-height: 140px; font-size: 16px; font-weight: 700; font-family: "FangSong", "仿宋", "STFangsong", serif; }
.right-col .btn-row { margin-top: 24px; padding: 8px 0; display: flex; justify-content: center; }
@media (max-width: 900px) { .collab-wrap .two-cols { grid-template-columns: 1fr; } }
</style>
