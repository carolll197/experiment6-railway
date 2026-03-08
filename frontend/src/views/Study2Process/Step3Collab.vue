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
              <div class="ai-header-lines">
                <span class="ai-round-hint">（3轮对话完成或倒计时结束后AI将生成方案供您参考）</span>
                <span class="ai-round-hint tip-line">温馨提示：为保证协作效率，请先阅读题目和右侧产出要求后再开始协作</span>
              </div>
            </div>
            <div class="ai-chat-timer" v-if="chatStarted && !chatDone">
              <span class="text-score">协作倒计时：{{ chatTimeText }}</span>
            </div>
            <div class="ai-body" ref="chatBody">
              <div v-if="!chatStarted" class="ai-start-wrap">
                <button type="button" class="ai-send-btn start-btn" @click="startCollaboration">开始协作</button>
              </div>
              <template v-else>
                <div v-for="(msg, i) in chatMessages" :key="i" :class="msg.role === 'user' ? 'ai-msg-user' : 'ai-msg-ai-wrap'">
                  <span v-if="msg.role === 'user'" class="msg-bubble msg-user-bubble text-body">{{ msg.content }}</span>
                  <div v-else class="ai-msg-ai">
                    <AiSuggestionContent v-if="msg.isFinal" :content="msg.content" />
                    <span v-else class="text-body">{{ msg.content }}</span>
                  </div>
                </div>
                <div v-if="aiLoading" class="ai-loading text-hint">AI 正在思考...</div>
              </template>
            </div>
            <div class="ai-input-bar" v-if="chatStarted && !chatDone">
              <input type="text" v-model="userInput" class="ai-input" :placeholder="chatInputPlaceholder" :disabled="aiLoading || chatDone" @keydown.enter="sendUserMessage" />
              <button type="button" class="ai-send-btn-small" :disabled="!userInput.trim() || aiLoading || chatDone" @click="sendUserMessage">发送</button>
            </div>
            <div v-else-if="chatDone" class="ai-done-bar">
              <p class="text-score ai-done-tip">AI已生成方案供您参考。</p>
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
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import BaseTextArea from '../../components/BaseTextArea.vue';
import BasePrimaryButton from '../../components/BasePrimaryButton.vue';
import BaseModal from '../../components/BaseModal.vue';
import EvalDimension from '../../components/EvalDimension.vue';
import BriefContent from '../../components/BriefContent.vue';
import AiSuggestionContent from '../../components/AiSuggestionContent.vue';
import { briefQuestion1Study2, kimiSystemPrompt, outputModules } from '../../content/study2Content.js';

const props = defineProps({
  subjectId: String,
  name: String,
  initialState: { type: Object, default: null },
});
const emit = defineEmits(['next', 'save']);

const TOTAL_SEC = 15 * 60;
const CHAT_SEC = 8 * 60;
const init = props.initialState;
const remaining = ref(
  init?.timerRemaining != null && init.timerRemaining > 0 && init.timerRemaining <= TOTAL_SEC ? init.timerRemaining : TOTAL_SEC
);
let timer = null;
let saveInterval = null;
let chatTimer = null;
const timeText = computed(() => `剩余${Math.floor(remaining.value / 60)}分${remaining.value % 60}秒`);

const chatStarted = ref(!!(init?.chatStarted || (init?.chatMessages && init.chatMessages.length)));
const chatTimerRemaining = ref(init?.chatTimerRemaining != null && init.chatTimerRemaining > 0 ? init.chatTimerRemaining : CHAT_SEC);
const chatTimeText = computed(() => `剩余${Math.floor(chatTimerRemaining.value / 60)}分${chatTimerRemaining.value % 60}秒`);

const startTime = ref(init?.startTime || null);
const aiDoneTime = ref(init?.aiDoneTime || null);

const modules = outputModules;
const defaultForm = () => ({ big_idea: '', highlight_scene: '', slogan: '' });
const form = ref(init?.form && typeof init.form === 'object' ? { ...defaultForm(), ...init.form } : defaultForm());

const chatMessages = ref(init?.chatMessages || []);
const userRoundCount = ref(init?.userRoundCount ?? 0);
const chatDone = ref(!!init?.chatDone);
const aiGeneratedPlan = ref(init?.aiGeneratedPlan || null);
const aiLoading = ref(false);
const userInput = ref('');
const chatBody = ref(null);
const chatInputPlaceholder = computed(() => chatDone.value ? '' : `请输入您的想法（第${userRoundCount.value + 1}/3轮）`);

const systemMessage = { role: 'system', content: kimiSystemPrompt };

const MIN_LEN = 50;
const labels = { big_idea: '核心创意点与设定', highlight_scene: '高光画面描述', slogan: '主打广告语' };
function wordCount(str) { return (str || '').replace(/\s/g, '').length; }
function firstInvalidField() {
  if (wordCount(form.value.big_idea) < MIN_LEN) return { key: 'big_idea', label: labels.big_idea };
  if (wordCount(form.value.highlight_scene) < MIN_LEN) return { key: 'highlight_scene', label: labels.highlight_scene };
  return null;
}

function parseAiPlan(content) {
  const s = (content || '').trim();
  const result = { big_idea: '', highlight_scene: '', slogan: '' };
  const lines = s.split(/\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^模块1[：:]/.test(line)) {
      const bodyLines = [];
      i++;
      while (i < lines.length && !/^模块\d[：:]/.test(lines[i])) { bodyLines.push(lines[i]); i++; }
      result.big_idea = bodyLines.join('\n').trim();
    } else if (/^模块2[：:]/.test(line)) {
      const bodyLines = [];
      i++;
      while (i < lines.length && !/^模块\d[：:]/.test(lines[i])) { bodyLines.push(lines[i]); i++; }
      result.highlight_scene = bodyLines.join('\n').trim();
    } else if (/^模块3[：:]/.test(line)) {
      const bodyLines = [];
      i++;
      while (i < lines.length && !/^模块\d[：:]/.test(lines[i])) { bodyLines.push(lines[i]); i++; }
      result.slogan = bodyLines.join('\n').trim();
    } else {
      i++;
    }
  }
  return result;
}

const showFailModal = ref(false);
const showAutoSavedModal = ref(false);
const failReason = ref('');

function scrollChatBottom() {
  nextTick(() => {
    if (chatBody.value) chatBody.value.scrollTop = chatBody.value.scrollHeight;
  });
}

function buildApiMessages(extraUserMessage) {
  const list = [systemMessage, ...chatMessages.value.filter((m) => m.role !== 'system').map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }))];
  if (extraUserMessage) list.push({ role: 'user', content: extraUserMessage });
  return list;
}

async function requestFinalPlan() {
  if (chatDone.value) return;
  const finalPrompt = '请根据目前对话内容，直接输出最终方案。请严格按以下格式输出：\n模块1：核心创意点与比喻（至少50字）\n（内容）\n模块2：高光画面描述（至少50字）\n（内容）\n模块3：主打广告语\n（内容）';
  aiLoading.value = true;
  try {
    const apiMessages = buildApiMessages(finalPrompt);
    const resp = await fetch('/api/study2-subject/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: apiMessages, subject_id: props.subjectId }),
    });
    const data = await resp.json();
    const aiContent = data.choices?.[0]?.message?.content || data.content || '';
    const parsed = parseAiPlan(aiContent);
    const displayText = [parsed.big_idea && `模块1：核心创意点与比喻（至少50字）\n${parsed.big_idea}`, parsed.highlight_scene && `模块2：高光画面描述（至少50字）\n${parsed.highlight_scene}`, parsed.slogan && `模块3：主打广告语\n${parsed.slogan}`].filter(Boolean).join('\n\n') || aiContent;
    chatMessages.value.push({ role: 'assistant', content: displayText, isFinal: true });
    aiGeneratedPlan.value = parsed;
    chatDone.value = true;
    aiDoneTime.value = new Date().toISOString();
    if (chatTimer) { clearInterval(chatTimer); chatTimer = null; }
  } catch (e) {
    chatMessages.value.push({ role: 'assistant', content: 'AI 生成方案失败，请稍后重试或继续填写右侧产出。', isFinal: false });
  }
  aiLoading.value = false;
  scrollChatBottom();
  emitSave();
}

function startCollaboration() {
  chatStarted.value = true;
  chatTimerRemaining.value = CHAT_SEC;
  if (chatTimer) clearInterval(chatTimer);
  chatTimer = setInterval(() => {
    chatTimerRemaining.value--;
    if (chatTimerRemaining.value <= 0) {
      clearInterval(chatTimer);
      chatTimer = null;
      requestFinalPlan();
    }
  }, 1000);
  aiLoading.value = true;
  fetch('/api/study2-subject/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [systemMessage], subject_id: props.subjectId }),
  })
    .then((r) => r.json())
    .then((data) => {
      const content = data.choices?.[0]?.message?.content || '你好！我是你的广告创意助手，我已充分了解题目内容及产出要求。写广告最怕没有头绪，我们一步步来。首先，为了让这款【丑苹果苏打水】脱颖而出，你希望这个故事发生在一个怎样与众不同的场景里？主角是谁，它是什么样的人或物？请把你的脑洞告诉我。';
      chatMessages.value.push({ role: 'assistant', content, isFinal: false });
    })
    .catch(() => {
      chatMessages.value.push({ role: 'assistant', content: '你好！我是你的广告创意助手，我已充分了解题目内容及产出要求。写广告最怕没有头绪，我们一步步来。首先，为了让这款【丑苹果苏打水】脱颖而出，你希望这个故事发生在一个怎样与众不同的场景里？主角是谁，它是什么样的人或物？请把你的脑洞告诉我。', isFinal: false });
    })
    .finally(() => { aiLoading.value = false; scrollChatBottom(); emitSave(); });
}

async function sendUserMessage() {
  if (!userInput.value.trim() || aiLoading.value || chatDone.value) return;
  const text = userInput.value.trim();
  userInput.value = '';
  chatMessages.value.push({ role: 'user', content: text });
  userRoundCount.value++;
  scrollChatBottom();

  aiLoading.value = true;
  try {
    const apiMessages = buildApiMessages();
    const resp = await fetch('/api/study2-subject/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: apiMessages, subject_id: props.subjectId }),
    });
    const data = await resp.json();
    const aiContent = data.choices?.[0]?.message?.content || data.content || 'AI 暂时无法回复，请稍后再试。';
    const parsed = parseAiPlan(aiContent);
    const hasModules = parsed.big_idea || parsed.highlight_scene || parsed.slogan;
    const isFinal = userRoundCount.value >= 3 || hasModules;
    let displayContent = aiContent;
    if (hasModules) {
      displayContent = [parsed.big_idea && `模块1：核心创意点与比喻（至少50字）\n${parsed.big_idea}`, parsed.highlight_scene && `模块2：高光画面描述（至少50字）\n${parsed.highlight_scene}`, parsed.slogan && `模块3：主打广告语\n${parsed.slogan}`].filter(Boolean).join('\n\n') || aiContent;
      aiGeneratedPlan.value = parsed;
      chatDone.value = true;
      aiDoneTime.value = new Date().toISOString();
      if (chatTimer) { clearInterval(chatTimer); chatTimer = null; }
    }
    chatMessages.value.push({ role: 'assistant', content: displayContent, isFinal: !!hasModules });
  } catch (e) {
    chatMessages.value.push({ role: 'assistant', content: 'AI 请求失败，请稍后再试。', isFinal: false });
  }
  aiLoading.value = false;
  scrollChatBottom();
  emitSave();
}

function emitSave() {
  emit('save', {
    form: { ...form.value },
    timerRemaining: remaining.value,
    chatMessages: chatMessages.value,
    userRoundCount: userRoundCount.value,
    chatDone: chatDone.value,
    chatStarted: chatStarted.value,
    chatTimerRemaining: chatTimerRemaining.value,
    aiGeneratedPlan: aiGeneratedPlan.value,
    startTime: startTime.value,
    aiDoneTime: aiDoneTime.value,
  });
}

function submitPlan(isAutoSaved) {
  if (timer) { clearInterval(timer); timer = null; }
  if (saveInterval) { clearInterval(saveInterval); saveInterval = null; }
  if (chatTimer) { clearInterval(chatTimer); chatTimer = null; }
  const endTime = new Date().toISOString();
  const plan = aiGeneratedPlan.value || {};
  const payload = {
    subject_id: props.subjectId,
    name: props.name,
    group_type: 'process',
    big_idea: form.value.big_idea,
    highlight_scene: form.value.highlight_scene,
    slogan: form.value.slogan,
    ai_big_idea: plan.big_idea || '',
    ai_highlight_scene: plan.highlight_scene || '',
    ai_slogan: plan.slogan || '',
    is_auto_saved: isAutoSaved ? 1 : 0,
    startTime: startTime.value || endTime,
    endTime,
    ai_done_time: aiDoneTime.value || '',
    chat_log: JSON.stringify(chatMessages.value),
  };
  fetch('/api/study2-subject/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    .then(() => emit('next'))
    .catch(() => emit('next'));
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

onMounted(() => {
  if (!startTime.value) startTime.value = new Date().toISOString();
  if (chatStarted.value && !chatDone.value && chatTimerRemaining.value > 0 && !chatTimer) {
    chatTimer = setInterval(() => {
      chatTimerRemaining.value--;
      if (chatTimerRemaining.value <= 0) {
        clearInterval(chatTimer);
        chatTimer = null;
        requestFinalPlan();
      }
    }, 1000);
  }
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
onUnmounted(() => { if (timer) clearInterval(timer); if (saveInterval) clearInterval(saveInterval); if (chatTimer) clearInterval(chatTimer); });
</script>

<style scoped>
.round-wrap { min-height: 100vh; background: var(--color-page-bg); padding: 16px; }
.timer-bar { text-align: center; padding: 8px 0; position: sticky; top: 0; background: var(--color-page-bg); z-index: 10; }
.collab-wrap .two-cols { width: 90%; max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; }
.left-col { display: grid; grid-template-rows: 1fr 1fr; gap: 8px; max-height: calc(100vh - 80px); overflow: hidden; }
.left-top, .left-bottom { overflow: auto; padding: 16px; font-family: "SimSun", "Songti SC", serif; }
.left-top :deep(.brief-eval-section-title),
.left-top :deep(.brief-content .brief-title) { font-size: 17px; font-weight: 600; font-family: "SimSun", "Songti SC", serif; }
.left-top :deep(.brief-content .brief-subtitle),
.left-top :deep(.brief-content .text-body) { font-size: 16px; font-family: "SimSun", "Songti SC", serif; }
.left-top :deep(.brief-content .brief-subtitle strong) { font-weight: 700; }
.left-top :deep(.brief-content) { line-height: 1.5; }
.left-top :deep(.eval-dimension) { font-size: 16px; font-family: "SimSun", "Songti SC", serif; line-height: 1.5; }

.ai-dialog { background: var(--color-input-bg); border: 1px solid var(--color-secondary); border-radius: 6px; padding: 0; display: flex; flex-direction: column; }
.ai-header { display: flex; align-items: center; gap: 8px; padding: 10px 15px; border-bottom: 1px solid #e8e8e8; flex-shrink: 0; flex-wrap: wrap; }
.ai-header-lines { display: flex; flex-direction: column; gap: 2px; }
.ai-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--color-primary); color: #fff; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ai-name { font-size: 14px; font-weight: 600; color: var(--color-text); }
.ai-round-hint { font-size: 12px; color: #999; }
.ai-round-hint.tip-line { color: #666; font-style: italic; }
.ai-chat-timer { padding: 4px 15px; border-bottom: 1px solid #eee; font-size: 13px; }
.ai-body { flex: 1; overflow-y: auto; padding: 12px 15px; }
.ai-start-wrap { display: flex; align-items: center; justify-content: center; min-height: 120px; }
.ai-send-btn.start-btn { padding: 12px 28px; border-radius: 20px; border: 1px solid var(--color-primary); background: var(--color-active-bg); color: var(--color-text); font-size: 15px; cursor: pointer; }
.ai-send-btn.start-btn:hover { background: var(--color-secondary); }
.ai-msg-user { display: flex; justify-content: flex-end; margin-bottom: 8px; }
.msg-bubble { padding: 8px 12px; border-radius: 12px; max-width: 85%; }
.msg-user-bubble { background: var(--color-active-bg); }
.ai-msg-ai-wrap { margin-bottom: 8px; }
.ai-msg-ai { background: #fff; border-radius: 8px; padding: 10px 12px; border: 1px solid #eee; font-family: "SimSun", "Songti SC", serif; }
.ai-msg-ai :deep(.ai-subtitle) { font-size: 16px; }
.ai-msg-ai :deep(.ai-body) { font-size: 16px; }
.ai-loading { padding: 8px; color: #999; font-style: italic; }
.ai-done-tip { margin: 8px 0; text-align: center; }

.ai-input-bar { display: flex; gap: 8px; padding: 10px 15px; border-top: 1px solid #e8e8e8; flex-shrink: 0; }
.ai-input { flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 18px; font-size: 13px; outline: none; }
.ai-input:focus { border-color: var(--color-primary); }
.ai-send-btn-small { padding: 6px 16px; border-radius: 18px; border: 1px solid var(--color-primary); background: var(--color-active-bg); color: var(--color-text); font-size: 13px; cursor: pointer; white-space: nowrap; }
.ai-send-btn-small:hover:not(:disabled) { background: var(--color-secondary); }
.ai-send-btn-small:disabled { opacity: 0.5; cursor: not-allowed; }
.ai-done-bar { padding: 10px 15px; border-top: 1px solid #e8e8e8; flex-shrink: 0; }

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
