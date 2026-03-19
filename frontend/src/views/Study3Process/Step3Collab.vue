<template>
  <div class="round-wrap">
    <div class="collab-wrap">
      <div class="two-cols">
        <div class="left-col panel-border">
          <div class="left-top file-container panel-border">
            <h2 class="brief-eval-section-title">创意简报</h2>
            <BriefContent :content="briefStudy3" />
            <h2 class="brief-eval-section-title spacing-12">产出要求</h2>
            <BriefContent :content="outputRequirementStudy3" />
            <h2 class="brief-eval-section-title spacing-12">评价维度</h2>
            <EvalDimension />
          </div>
          <div class="left-bottom panel-border ai-dialog">
            <div class="ai-header">
              <span class="ai-avatar">AI</span>
              <span class="ai-name">AI创意助手</span>
              <div class="ai-header-lines">
                <span class="ai-round-hint">（协作限时8分钟，信息收集完成或倒计时结束后AI助手会生成方案）</span>
                <span class="ai-round-hint tip-line">温馨提示：请先阅读题目后再开始协作</span>
              </div>
            </div>
            <div class="ai-chat-timer" v-if="chatStarted && !chatDone">
              <span class="text-score">协作倒计时：{{ chatTimeText }}</span>
            </div>
            <div class="ai-body" ref="chatBody">
              <div v-if="!chatStarted" class="ai-start-wrap">
                <button type="button" class="ai-send-btn start-btn" @click="startCollaboration">点击一键发送题目、产出要求及评价维度</button>
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
                <div v-else-if="showRetryGenerate" class="ai-retry-wrap">
                  <div class="text-hint retry-hint">AI 生成方案失败或返回格式异常，请点击重新生成。</div>
                  <button type="button" class="ai-send-btn-small retry-btn" :disabled="aiLoading" @click="retryGenerateFinalPlan">重新生成方案</button>
                </div>
              </template>
            </div>
            <div class="ai-input-bar" v-if="chatStarted && !chatDone">
              <textarea v-model="userInput" class="ai-input-textarea" placeholder="请输入您的想法" :disabled="aiLoading || chatDone" rows="3" @keydown.enter.exact.prevent="sendUserMessage" />
              <button type="button" class="ai-send-btn-small" :disabled="!userInput.trim() || aiLoading || chatDone" @click="sendUserMessage">发送</button>
            </div>
            <div v-else-if="chatDone" class="ai-done-bar">
              <p class="text-score ai-done-tip">您已完成协作，请阅读AI方案后完成右侧题目。</p>
            </div>
          </div>
        </div>

        <div class="right-col panel-border">
          <h2 class="brief-eval-section-title">请阅读AI生成的方案后完成以下题目</h2>
          <div class="scale-list">
            <template v-for="(section, si) in scaleSections" :key="si">
              <p class="scale-section-intro text-body">{{ section.intro }}</p>
              <div v-for="it in section.items" :key="it.key" class="scale-item">
                <span class="text-h3">{{ it.no }}. {{ it.text }}</span>
                <BaseScoreAxis :model-value="scores[it.key]" @update:model-value="setScore(it.key, $event)" />
              </div>
            </template>
            <div class="scale-item">
              <span class="text-h3">总的来说，您觉得AI方案水平如何？请分享您的想法和感受。</span>
              <BaseTextArea v-model="openText" placeholder="" show-count :min-length="0" />
            </div>
          </div>
          <div class="btn-row">
            <BasePrimaryButton label="完成" :enabled="canSubmit" @click="onSubmit" />
          </div>
        </div>
      </div>
    </div>

    <BaseModal :visible="showFailModal" title="提交失败" confirm-text="继续填写" @confirm="showFailModal = false">
      <p class="text-body">原因：{{ failReason }}</p>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import BaseTextArea from '../../components/BaseTextArea.vue';
import BasePrimaryButton from '../../components/BasePrimaryButton.vue';
import BaseModal from '../../components/BaseModal.vue';
import BaseScoreAxis from '../../components/BaseScoreAxis.vue';
import EvalDimension from '../../components/EvalDimension.vue';
import BriefContent from '../../components/BriefContent.vue';
import AiSuggestionContent from '../../components/AiSuggestionContent.vue';
import { briefStudy3, outputRequirementStudy3, study3ScaleSections, allScaleKeys } from '../../content/study3Content.js';
import { kimiSystemPrompt } from '../../content/study2Content.js';

const props = defineProps({
  subjectId: String,
  name: String,
  initialState: { type: Object, default: null },
});
const emit = defineEmits(['next', 'save']);

const CHAT_SEC = 8 * 60;
const init = props.initialState;
const scaleSections = study3ScaleSections;

const chatStarted = ref(!!(init?.chatStarted || (init?.chatMessages && init.chatMessages.length)));
const chatTimerRemaining = ref(init?.chatTimerRemaining != null && init.chatTimerRemaining > 0 ? init.chatTimerRemaining : CHAT_SEC);
const chatTimeText = computed(() => `剩余${Math.floor(chatTimerRemaining.value / 60)}分${chatTimerRemaining.value % 60}秒`);
let chatTimer = null;

const chatMessages = ref(init?.chatMessages || []);
const chatDone = ref(!!init?.chatDone);
const aiGeneratedPlan = ref(init?.aiGeneratedPlan || null);
const aiLoading = ref(false);
const userInput = ref('');
const chatBody = ref(null);
const finalPlanError = ref(!!init?.finalPlanError);

const systemMessage = ref({ role: 'system', content: kimiSystemPrompt });

const collabStartTime = ref(init?.collabStartTime || null);
const aiDoneTime = ref(init?.aiDoneTime || null);
const ratingStartTime = ref(init?.ratingStartTime || null);

function scrollChatBottom() {
  nextTick(() => {
    if (chatBody.value) chatBody.value.scrollTop = chatBody.value.scrollHeight;
  });
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
    } else i++;
  }
  return result;
}

function isValidAiPlan(plan) {
  return !!(plan && String(plan.big_idea || '').trim() && String(plan.highlight_scene || '').trim() && String(plan.slogan || '').trim());
}

function buildApiMessages(extraUserMessage) {
  const system = { role: 'system', content: (systemMessage.value && systemMessage.value.content) || kimiSystemPrompt };
  const turns = chatMessages.value.filter((m) => m.role !== 'system').map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: String(m.content ?? '') }));
  const list = [system, ...turns];
  if (extraUserMessage) list.push({ role: 'user', content: String(extraUserMessage) });
  return list;
}

const showRetryGenerate = computed(() => chatStarted.value && !chatDone.value && !aiLoading.value && finalPlanError.value && !isValidAiPlan(aiGeneratedPlan.value));

async function requestFinalPlan(trigger) {
  if (chatDone.value || aiLoading.value) return;
  finalPlanError.value = false;
  const finalPrompt = trigger === 'timer'
    ? '8分钟讨论已结束。请根据上述对话内容直接输出最终方案，仅输出以下规范格式：\n模块1：核心创意与设定\n（内容）\n模块2：高光画面描述\n（内容）\n模块3：主打广告语\n（内容）'
    : '信息已收集完毕。请根据上述对话内容直接输出最终方案，仅输出以下规范格式：\n模块1：核心创意与设定\n（内容）\n模块2：高光画面描述\n（内容）\n模块3：主打广告语\n（内容）';
  aiLoading.value = true;
  try {
    const apiMessages = buildApiMessages(finalPrompt);
    const resp = await fetch('/api/study3-subject/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: apiMessages, subject_id: props.subjectId }),
    });
    const data = await resp.json();
    if (!resp.ok || data.error) {
      const errMsg = data.error?.message || data.error || `请求失败（${resp.status}）`;
      chatMessages.value.push({ role: 'assistant', content: `AI 生成方案出错：${errMsg}`, isFinal: false });
      finalPlanError.value = true;
    } else {
      const aiContent = data.choices?.[0]?.message?.content || data.content || '';
      const parsed = parseAiPlan(aiContent);
      if (!isValidAiPlan(parsed)) {
        chatMessages.value.push({ role: 'assistant', content: 'AI 返回的方案格式不完整（缺少模块1/2/3）。请点击下方“重新生成方案”。', isFinal: false });
        finalPlanError.value = true;
      } else {
        const displayText = [`模块1：核心创意与设定\n${parsed.big_idea}`, `模块2：高光画面描述\n${parsed.highlight_scene}`, `模块3：主打广告语\n${parsed.slogan}`].join('\n\n');
        chatMessages.value.push({ role: 'assistant', content: displayText, isFinal: true });
        aiGeneratedPlan.value = parsed;
        chatDone.value = true;
        aiDoneTime.value = new Date().toISOString();
        if (chatTimer) { clearInterval(chatTimer); chatTimer = null; }
      }
    }
  } catch (e) {
    chatMessages.value.push({ role: 'assistant', content: 'AI 生成方案失败，请稍后重试。', isFinal: false });
    finalPlanError.value = true;
  }
  aiLoading.value = false;
  scrollChatBottom();
  emitSave();
}

function retryGenerateFinalPlan() {
  if (aiLoading.value || chatDone.value) return;
  requestFinalPlan('retry');
}

function startCollaboration() {
  chatStarted.value = true;
  collabStartTime.value = new Date().toISOString();
  chatTimerRemaining.value = CHAT_SEC;
  if (chatTimer) clearInterval(chatTimer);
  chatTimer = setInterval(() => {
    chatTimerRemaining.value--;
    if (chatTimerRemaining.value <= 0) {
      clearInterval(chatTimer);
      chatTimer = null;
      if (!chatDone.value && !aiLoading.value) requestFinalPlan('timer');
    }
  }, 1000);
  const firstPrompt = '请根据系统提示开始对话，先输出你的开场白（询问场景与角色），仅输出该段话，不要输出最终方案。';
  aiLoading.value = true;
  const systemContent = systemMessage.value?.content || kimiSystemPrompt;
  fetch('/api/study3-subject/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'system', content: systemContent }, { role: 'user', content: firstPrompt }], subject_id: props.subjectId }),
  })
    .then(async (r) => {
      const data = await r.json();
      if (!r.ok || data.error) {
        const errMsg = data.error?.message || data.error || `请求失败（${r.status}）`;
        chatMessages.value.push({ role: 'assistant', content: `AI 请求出错：${errMsg}\n\n请刷新页面重试。`, isFinal: false });
        return;
      }
      const content = data.choices?.[0]?.message?.content || '你好！我是你的广告创意助手。我们一步步来，首先，你希望这个故事发生在一个怎样与众不同的场景里？主角是谁？';
      chatMessages.value.push({ role: 'assistant', content, isFinal: false });
    })
    .catch(() => {
      chatMessages.value.push({ role: 'assistant', content: '你好！我是你的广告创意助手。我们一步步来，首先，你希望这个故事发生在一个怎样与众不同的场景里？主角是谁？', isFinal: false });
    })
    .finally(() => { aiLoading.value = false; scrollChatBottom(); emitSave(); });
}

async function sendUserMessage() {
  if (!userInput.value.trim() || aiLoading.value || chatDone.value) return;
  const text = userInput.value.trim();
  userInput.value = '';
  chatMessages.value.push({ role: 'user', content: text });
  scrollChatBottom();
  aiLoading.value = true;
  try {
    const apiMessages = buildApiMessages();
    const resp = await fetch('/api/study3-subject/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: apiMessages, subject_id: props.subjectId }),
    });
    const data = await resp.json();
    if (!resp.ok || data.error) {
      const errMsg = data.error?.message || data.error || `请求失败（${resp.status}）`;
      chatMessages.value.push({ role: 'assistant', content: `AI 请求出错：${errMsg}`, isFinal: false });
    } else {
      const aiContent = data.choices?.[0]?.message?.content || data.content || '';
      if (!aiContent) {
        chatMessages.value.push({ role: 'assistant', content: 'AI 返回了空内容，请重新尝试发送。', isFinal: false });
      } else {
        const parsed = parseAiPlan(aiContent);
        const hasAll = parsed.big_idea && parsed.highlight_scene && parsed.slogan;
        let display = aiContent;
        if (hasAll) display = [`模块1：核心创意与设定\n${parsed.big_idea}`, `模块2：高光画面描述\n${parsed.highlight_scene}`, `模块3：主打广告语\n${parsed.slogan}`].join('\n\n');
        chatMessages.value.push({ role: 'assistant', content: display, isFinal: hasAll });
        if (hasAll) {
          aiGeneratedPlan.value = parsed;
          chatDone.value = true;
          aiDoneTime.value = new Date().toISOString();
          if (chatTimer) { clearInterval(chatTimer); chatTimer = null; }
        }
      }
    }
  } catch (e) {
    chatMessages.value.push({ role: 'assistant', content: `AI 请求失败：${e.message || '网络错误'}`, isFinal: false });
  }
  aiLoading.value = false;
  scrollChatBottom();
  emitSave();
}

// Scale
const scores = ref(init?.scores || {});
const openText = ref(init?.openText || '');

function setScore(key, v) {
  if (!ratingStartTime.value) ratingStartTime.value = new Date().toISOString();
  scores.value = { ...scores.value, [key]: v };
}
watch(openText, () => { if (!ratingStartTime.value && openText.value.trim()) ratingStartTime.value = new Date().toISOString(); });

const canSubmit = computed(() => chatDone.value && allScaleKeys.every((k) => scores.value[k] != null) && !!openText.value.trim());

const showFailModal = ref(false);
const failReason = ref('');

function emitSave() {
  emit('save', {
    chatStarted: chatStarted.value,
    chatTimerRemaining: chatTimerRemaining.value,
    chatMessages: chatMessages.value,
    chatDone: chatDone.value,
    aiGeneratedPlan: aiGeneratedPlan.value,
    finalPlanError: finalPlanError.value,
    scores: scores.value,
    openText: openText.value,
    collabStartTime: collabStartTime.value,
    aiDoneTime: aiDoneTime.value,
    ratingStartTime: ratingStartTime.value,
  });
}

async function onSubmit() {
  if (!canSubmit.value) {
    failReason.value = '请先完成协作并填写完右侧所有题目';
    showFailModal.value = true;
    return;
  }
  const endTime = new Date().toISOString();
  const plan = aiGeneratedPlan.value || {};
  const payload = {
    subject_id: props.subjectId,
    name: props.name,
    group_type: 'process',
    ai_big_idea: plan.big_idea || '',
    ai_highlight_scene: plan.highlight_scene || '',
    ai_slogan: plan.slogan || '',
    chat_log: JSON.stringify(chatMessages.value),
    scores: scores.value,
    open_text: openText.value.trim(),
    collab_start_time: collabStartTime.value || '',
    ai_done_time: aiDoneTime.value || '',
    rating_start_time: ratingStartTime.value || '',
    end_time: endTime,
  };
  try {
    const r = await fetch('/api/study3-subject/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      throw new Error(d?.error || `提交失败（${r.status}）`);
    }
    emit('next');
  } catch (e) {
    failReason.value = e.message || '提交失败';
    showFailModal.value = true;
  }
}

onMounted(() => {
  fetch('/api/study3-subject/prompt').then((r) => r.json()).then((d) => {
    if (d?.content) systemMessage.value = { role: 'system', content: String(d.content).trim() };
  }).catch(() => {});

  if (chatStarted.value && !chatDone.value && chatTimerRemaining.value > 0 && !chatTimer) {
    chatTimer = setInterval(() => {
      chatTimerRemaining.value--;
      if (chatTimerRemaining.value <= 0) { clearInterval(chatTimer); chatTimer = null; if (!chatDone.value && !aiLoading.value) requestFinalPlan('timer'); }
    }, 1000);
  }
});
onUnmounted(() => { if (chatTimer) clearInterval(chatTimer); });
</script>

<style scoped>
.round-wrap { min-height: 100vh; background: var(--color-page-bg); padding: 16px; }
.collab-wrap .two-cols { width: 90%; max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; }
.left-col { display: grid; grid-template-rows: 2fr 3fr; gap: 8px; max-height: calc(100vh - 40px); overflow: hidden; }
.left-top, .left-bottom { overflow: auto; padding: 16px; font-family: "SimSun", "Songti SC", serif; }
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
.ai-msg-user { display: flex; justify-content: flex-end; margin-bottom: 8px; }
.msg-bubble { padding: 8px 12px; border-radius: 12px; max-width: 85%; }
.msg-user-bubble { background: var(--color-active-bg); }
.ai-msg-ai-wrap { margin-bottom: 8px; }
.ai-msg-ai { background: #fff; border-radius: 8px; padding: 10px 12px; border: 1px solid #eee; font-family: "SimSun", "Songti SC", serif; }
.ai-loading { padding: 8px; color: #999; font-style: italic; }
.ai-retry-wrap { padding: 10px 0 6px 0; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.retry-hint { text-align: center; }
.retry-btn { padding: 6px 18px; }
.ai-done-tip { margin: 8px 0; text-align: center; }
.ai-input-bar { display: flex; gap: 8px; padding: 10px 15px; border-top: 1px solid #e8e8e8; flex-shrink: 0; align-items: flex-end; }
.ai-input-textarea { flex: 1; min-height: 4.5em; max-height: 120px; padding: 8px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 13px; outline: none; resize: none; overflow-y: auto; line-height: 1.4; font-family: inherit; }
.ai-send-btn-small { padding: 6px 16px; border-radius: 18px; border: 1px solid var(--color-primary); background: var(--color-active-bg); color: var(--color-text); font-size: 13px; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
.right-col { display: flex; flex-direction: column; gap: 12px; max-height: calc(100vh - 40px); overflow: auto; padding: 12px; background: var(--color-page-bg); }
.scale-section-intro { font-size: 14px; color: #333; margin: 12px 0 8px 0; line-height: 1.6; font-weight: 500; padding: 8px 12px; background: #f5f5f5; border-radius: 6px; }
.scale-item { margin-bottom: 16px; }
.btn-row { margin-top: 12px; display: flex; justify-content: center; }
@media (max-width: 900px) { .collab-wrap .two-cols { grid-template-columns: 1fr; } }
</style>
