<template>
  <div class="round-wrap">
    <div class="collab-wrap">
      <div class="timer-bar text-score">{{ timeText }}</div>
      <div class="timer-note text-hint italic" style="text-align: center; font-size: 12px; margin-bottom: 8px;">创作限时15分钟，倒计时结束将自动保存并提交已填内容</div>
      <div class="two-cols">
        <div class="left-col panel-border">
          <div class="left-top file-container panel-border">
            <h2 class="brief-eval-section-title">创意简报</h2>
            <BriefContent :content="briefQuestion1Study2" />
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
                  <AiSuggestionContent :content="aiSuggestionText" />
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
import { briefQuestion1Study2, outputModules } from '../../content/study2Content.js';

const props = defineProps({
  subjectId: String,
  name: String,
  initialState: { type: Object, default: null },
});
const emit = defineEmits(['next', 'save']);

const TOTAL_SEC = 15 * 60;
const init = props.initialState;
const remaining = ref(
  init?.timerRemaining != null && init.timerRemaining > 0 && init.timerRemaining <= TOTAL_SEC ? init.timerRemaining : TOTAL_SEC
);
let timer = null;
let saveInterval = null;
const timeText = computed(() => `剩余${Math.floor(remaining.value / 60)}分${remaining.value % 60}秒`);

const startTime = ref(init?.startTime || null);
const aiDoneTime = ref(init?.aiDoneTime || null);

const modules = outputModules;
const defaultForm = () => ({ big_idea: '', highlight_scene: '', slogan: '' });
const form = ref(init?.form && typeof init.form === 'object' ? { ...defaultForm(), ...init.form } : defaultForm());

const AI_NODES = ['分析题目及评价维度', '分析产出要求', '构思方案', '生成方案'];
const aiSent = ref(!!init?.aiSent);
const aiNodes = ref(init?.aiSent ? [...AI_NODES] : []);
const aiDone = ref(!!init?.aiDone);
const aiSuggestionText = ref(init?.aiSuggestionText || '');
const assignedPlanSubjectId = ref(init?.assignedPlanSubjectId || '');
const assignedPlanName = ref(init?.assignedPlanName || '');
const assignedPlanContent = ref(init?.assignedPlanContent || null);

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
    aiSent: aiSent.value,
    aiDone: aiDone.value,
    aiSuggestionText: aiSuggestionText.value,
    startTime: startTime.value,
    aiDoneTime: aiDoneTime.value,
    assignedPlanSubjectId: assignedPlanSubjectId.value,
    assignedPlanName: assignedPlanName.value,
    assignedPlanContent: assignedPlanContent.value,
  });
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
      fetch(`/api/study2-subject/random-plan?subject_id=${encodeURIComponent(props.subjectId || '')}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && (data.big_idea || data.highlight_scene || data.slogan)) {
            assignedPlanSubjectId.value = data.subject_id || '';
            assignedPlanName.value = data.name || '';
            assignedPlanContent.value = { big_idea: data.big_idea || '', highlight_scene: data.highlight_scene || '', slogan: data.slogan || '' };
            const lines = [];
            if (data.big_idea) lines.push(`模块1：核心创意与设定\n${data.big_idea}`);
            if (data.highlight_scene) lines.push(`模块2：高光画面描述（The Highlight Scene）\n${data.highlight_scene}`);
            if (data.slogan) lines.push(`模块3：主打广告语（The Slogan）\n${data.slogan}`);
            aiSuggestionText.value = lines.join('\n');
          } else {
            aiSuggestionText.value = '模块1：核心创意与设定\n暂无过程组方案可供参考。\n模块2：高光画面描述\n暂无。\n模块3：主打广告语\n暂无。';
          }
          aiDone.value = true;
          aiDoneTime.value = new Date().toISOString();
          emitSave();
        })
        .catch(() => {
          aiSuggestionText.value = 'AI 方案获取失败，请继续独立完成创作。';
          aiDone.value = true;
          aiDoneTime.value = new Date().toISOString();
          emitSave();
        });
    }
  };
  setTimeout(addNode, 400);
}

function submitPlan(isAutoSaved) {
  if (timer) { clearInterval(timer); timer = null; }
  if (saveInterval) { clearInterval(saveInterval); saveInterval = null; }
  const endTime = new Date().toISOString();
  fetch('/api/study2-subject/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject_id: props.subjectId, name: props.name, group_type: 'result',
      big_idea: form.value.big_idea, highlight_scene: form.value.highlight_scene, slogan: form.value.slogan,
      is_auto_saved: isAutoSaved ? 1 : 0,
      startTime: startTime.value || endTime, endTime,
      ai_done_time: aiDoneTime.value || '',
      chat_log: '',
      assigned_plan_subject_id: assignedPlanSubjectId.value || '',
      assigned_plan_name: assignedPlanName.value || '',
      ai_big_idea: assignedPlanContent.value?.big_idea ?? '',
      ai_highlight_scene: assignedPlanContent.value?.highlight_scene ?? '',
      ai_slogan: assignedPlanContent.value?.slogan ?? '',
    }),
  }).then(() => emit('next')).catch(() => emit('next'));
}

function onSubmit() {
  const invalid = firstInvalidField();
  if (invalid) { failReason.value = `${invalid.label}字数至少为50个字`; showFailModal.value = true; return; }
  submitPlan(false);
}

function onConfirmAutoSaved() { showAutoSavedModal.value = false; emit('next'); }

onMounted(() => {
  if (!startTime.value) startTime.value = new Date().toISOString();
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
.left-col { display: grid; grid-template-rows: 1fr 2fr; gap: 8px; max-height: calc(100vh - 80px); overflow: hidden; }
.left-top, .left-bottom { overflow: auto; padding: 16px; font-family: "SimSun", "Songti SC", serif; }
.left-top :deep(.brief-eval-section-title),
.left-top :deep(.brief-content .brief-title) { font-size: 17px; font-weight: 600; font-family: "SimSun", "Songti SC", serif; }
.left-top :deep(.brief-content .brief-subtitle),
.left-top :deep(.brief-content .text-body) { font-size: 16px; font-family: "SimSun", "Songti SC", serif; }
.left-top :deep(.brief-content) { line-height: 1.5; }
.left-top :deep(.eval-dimension) { font-size: 16px; font-family: "SimSun", "Songti SC", serif; line-height: 1.5; }
.ai-dialog { background: var(--color-input-bg); border: 1px solid var(--color-secondary); border-radius: 6px; padding: 0; display: flex; flex-direction: column; }
.ai-header { display: flex; align-items: center; gap: 8px; padding: 10px 15px; border-bottom: 1px solid #e8e8e8; flex-shrink: 0; }
.ai-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--color-primary); color: #fff; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; }
.ai-name { font-size: 14px; font-weight: 600; }
.ai-body { flex: 1; overflow-y: auto; padding: 12px 15px; }
.ai-placeholder { display: flex; justify-content: center; align-items: flex-end; min-height: 80px; padding-bottom: 12px; }
.ai-send-btn { padding: 8px 20px; min-width: 200px; height: 36px; border-radius: 18px; border: 1px solid var(--color-primary); background: var(--color-active-bg); color: var(--color-text); font-size: 13px; cursor: pointer; }
.ai-send-btn:hover { background: var(--color-secondary); }
.ai-msg-user { display: flex; justify-content: flex-end; margin-bottom: 8px; }
.msg-bubble { padding: 8px 12px; border-radius: 12px; max-width: 85%; }
.msg-user-bubble { background: var(--color-active-bg); }
.ai-msg-system { margin-bottom: 8px; }
.ai-node { margin: 4px 0; }
.ai-msg-ai { background: #fff; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; border: 1px solid #eee; font-family: "SimSun", "Songti SC", serif; }
.ai-msg-ai :deep(.ai-subtitle) { font-size: 16px; }
.ai-msg-ai :deep(.ai-body) { font-size: 16px; }
.ai-done-tip { margin-top: 8px; }
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
.brief-eval-section-title { font-size: 17px; font-weight: 600; font-family: "SimSun", "Songti SC", serif; }
.spacing-12 { margin-top: 12px; }
@media (max-width: 900px) { .collab-wrap .two-cols { grid-template-columns: 1fr; } }
</style>
