<template>
  <div class="creative-wrap">
    <div class="timer-bar text-score">{{ timeText }}</div>
    <div class="timer-note text-hint italic" style="text-align: center; font-size: 12px; margin-bottom: 8px;">倒计时结束将自动保存并提交已填内容</div>
    <div class="two-cols">
      <div class="left-col panel-border">
        <div class="left-top file-container panel-border">
          <h2 class="brief-eval-section-title">创意简报</h2>
          <BriefContent :content="briefQuestion1" />
        </div>
        <div class="left-bottom file-container panel-border">
          <h2 class="brief-eval-section-title spacing-12">创造力维度</h2>
          <EvalDimension />
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
import { briefQuestion1 } from '../../content/study1Content.js';

const props = defineProps({
  subjectId: String,
  name: String,
  initialForm: { type: Object, default: null },
  initialTimerRemaining: { type: Number, default: null },
  startTime: String,
});
const emit = defineEmits(['next', 'save']);

const TOTAL_SEC = 10 * 60;
const defaultForm = () => ({ big_idea: '', highlight_scene: '', slogan: '' });
const remaining = ref(
  props.initialTimerRemaining != null && props.initialTimerRemaining > 0 && props.initialTimerRemaining <= TOTAL_SEC
    ? props.initialTimerRemaining
    : TOTAL_SEC
);
let timer = null;
let saveInterval = null;
const timeText = computed(() => {
  const r = remaining.value;
  return `剩余${Math.floor(r / 60)}分${r % 60}秒`;
});

const form = ref({ ...defaultForm() });

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

function onSubmit() {
  const invalid = firstInvalidField();
  if (invalid) { failReason.value = `${invalid.label}字数至少为50个字`; showFailModal.value = true; return; }
  submitPlan(false);
}

function submitPlan(isAutoSaved) {
  if (timer) { clearInterval(timer); timer = null; }
  if (saveInterval) { clearInterval(saveInterval); saveInterval = null; }
  const payload = {
    subject_id: props.subjectId,
    name: props.name,
    phase: '环节一',
    question_no: 1,
    big_idea: form.value.big_idea,
    highlight_scene: form.value.highlight_scene,
    slogan: form.value.slogan,
    is_auto_saved: isAutoSaved ? 1 : 0,
    startTime: props.startTime,
    endTime: new Date().toISOString(),
  };
  fetch('/api/study1-subject/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then((r) => r.json())
    .then(() => { emit('next', { ...form.value }); })
    .catch(() => { emit('next', { ...form.value }); });
}

function onConfirmAutoSaved() {
  showAutoSavedModal.value = false;
  emit('next', { ...form.value });
}

function emitSave() {
  emit('save', { step4Form: { ...form.value }, step4TimerRemaining: remaining.value });
}

onMounted(() => {
  const init = props.initialForm;
  if (init && typeof init === 'object') form.value = { ...defaultForm(), ...init };
  if (props.initialTimerRemaining != null && props.initialTimerRemaining > 0 && props.initialTimerRemaining <= TOTAL_SEC)
    remaining.value = props.initialTimerRemaining;
  timer = setInterval(() => {
    remaining.value--;
    if (remaining.value <= 0) { if (timer) clearInterval(timer); submitPlan(true); }
  }, 1000);
  saveInterval = setInterval(emitSave, 30000);
  setTimeout(emitSave, 500);
});

watch(() => ({ ...form.value }), () => { setTimeout(emitSave, 600); }, { deep: true });

onUnmounted(() => {
  if (timer) clearInterval(timer);
  if (saveInterval) clearInterval(saveInterval);
});
</script>

<style scoped>
.creative-wrap { min-height: 100vh; background: var(--color-page-bg); padding: 24px 16px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.timer-bar { text-align: center; padding: 8px 0; position: sticky; top: 0; background: var(--color-page-bg); z-index: 10; }
.two-cols { width: 90%; max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; }
.left-col { display: grid; grid-template-rows: 1fr 1fr; gap: 8px; max-height: calc(100vh - 80px); overflow: hidden; }
.left-top, .left-bottom { overflow: auto; padding: 16px; }
.right-col { display: flex; flex-direction: column; gap: 20px; max-height: calc(100vh - 80px); overflow: auto; padding: 12px; background: var(--color-page-bg); }
.module { padding: 12px; border: 1px solid var(--color-border-line); min-height: 120px; display: flex; flex-direction: column; flex-shrink: 0; }
.module-big { min-height: 280px; }
.module :deep(.base-textarea-wrap) { flex: 0 1 auto; display: flex; flex-direction: column; min-height: 0; max-height: 180px; }
.module :deep(textarea) { flex: 1; min-height: 100px; overflow-y: auto; resize: none; }
.module-big :deep(.base-textarea-wrap) { max-height: 200px; }
.module-big :deep(textarea) { min-height: 140px; }
.brief-text { white-space: pre-wrap; }
.brief-eval-section-title { font-size: 17px; font-weight: 600; font-family: "SimSun", "Songti SC", serif; }
.creative-wrap :deep(.brief-content) { font-size: 15px; }
.creative-wrap :deep(.brief-content .brief-title) { font-size: 17px; }
.creative-wrap :deep(.brief-content .brief-subtitle),
.creative-wrap :deep(.brief-content .text-body) { font-size: 15px; }
.module-hint { font-style: normal; font-size: 15px; color: var(--color-text); line-height: 1.5; font-family: "SimSun", "Songti SC", serif; }
.module-hint :deep(.hint-label) { font-weight: 700; font-family: "SimSun", "Songti SC", serif; }
.module-hint :deep(.hint-content) { font-weight: 400; font-family: "SimSun", "Songti SC", serif; }
/* 左下栏“创造力维度”五字不变，其下评价维度内容字号调大一号 */
.creative-wrap .left-bottom .brief-eval-section-title { font-size: 17px; }
.creative-wrap .left-bottom :deep(.eval-dimension) { font-size: 16px; }
.btn-row { margin-top: 24px; padding: 8px 0; display: flex; justify-content: center; }
@media (max-width: 900px) { .two-cols { grid-template-columns: 1fr; } }
</style>
