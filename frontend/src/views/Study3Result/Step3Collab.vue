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
            </div>
            <div class="ai-body">
              <div v-if="!aiSent" class="ai-placeholder">
                <button type="button" class="ai-send-btn" @click="sendAi">点击一键发送题目、产出要求及评价维度</button>
              </div>
              <div v-else class="ai-messages">
                <div class="ai-msg-user">
                  <span class="msg-bubble msg-user-bubble text-body">已发送题目、产出要求及评价维度</span>
                </div>
                <div class="ai-msg-system">
                  <p v-for="(line, i) in aiNodes" :key="'n'+i" class="ai-node text-hint">▶ {{ line }}</p>
                </div>
                <div v-if="aiDone" class="ai-msg-ai">
                  <AiSuggestionContent :content="aiSuggestionText" />
                </div>
                <p v-if="aiDone" class="text-score ai-done-tip">您已完成协作，请阅读AI方案后完成右侧题目。</p>
              </div>
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import BaseTextArea from '../../components/BaseTextArea.vue';
import BasePrimaryButton from '../../components/BasePrimaryButton.vue';
import BaseModal from '../../components/BaseModal.vue';
import BaseScoreAxis from '../../components/BaseScoreAxis.vue';
import EvalDimension from '../../components/EvalDimension.vue';
import BriefContent from '../../components/BriefContent.vue';
import AiSuggestionContent from '../../components/AiSuggestionContent.vue';
import { briefStudy3, outputRequirementStudy3, study3ScaleSections, allScaleKeys } from '../../content/study3Content.js';

const props = defineProps({
  subjectId: String,
  name: String,
  initialState: { type: Object, default: null },
});
const emit = defineEmits(['next', 'save']);

const init = props.initialState;
const scaleSections = study3ScaleSections;

const AI_NODES = ['分析题目及评价维度', '分析产出要求', '构思方案', '生成方案'];
const aiSent = ref(!!init?.aiSent);
const aiNodes = ref(init?.aiSent ? [...AI_NODES] : []);
const aiDone = ref(!!init?.aiDone);
const aiSuggestionText = ref(init?.aiSuggestionText || '');

const assignedPlanSubjectId = ref(init?.assignedPlanSubjectId || '');
const assignedPlanName = ref(init?.assignedPlanName || '');
const assignedPlanContent = ref(init?.assignedPlanContent || null);

const collabStartTime = ref(init?.collabStartTime || null);
const aiDoneTime = ref(init?.aiDoneTime || null);
const ratingStartTime = ref(init?.ratingStartTime || null);

// Scale
const scores = ref(init?.scores || {});
const openText = ref(init?.openText || '');

function setScore(key, v) {
  if (!ratingStartTime.value) ratingStartTime.value = new Date().toISOString();
  scores.value = { ...scores.value, [key]: v };
}
watch(openText, () => { if (!ratingStartTime.value && openText.value.trim()) ratingStartTime.value = new Date().toISOString(); });

const canSubmit = computed(() => aiDone.value && allScaleKeys.every((k) => scores.value[k] != null) && !!openText.value.trim());

const showFailModal = ref(false);
const failReason = ref('');

function emitSave() {
  emit('save', {
    aiSent: aiSent.value,
    aiDone: aiDone.value,
    aiSuggestionText: aiSuggestionText.value,
    assignedPlanSubjectId: assignedPlanSubjectId.value,
    assignedPlanName: assignedPlanName.value,
    assignedPlanContent: assignedPlanContent.value,
    scores: scores.value,
    openText: openText.value,
    collabStartTime: collabStartTime.value,
    aiDoneTime: aiDoneTime.value,
    ratingStartTime: ratingStartTime.value,
  });
}

function sendAi() {
  aiSent.value = true;
  collabStartTime.value = new Date().toISOString();
  let i = 0;
  const addNode = () => {
    if (i < AI_NODES.length) {
      aiNodes.value.push(AI_NODES[i]);
      i++;
      setTimeout(addNode, 600);
    } else {
      fetch(`/api/study3-subject/random-plan?subject_id=${encodeURIComponent(props.subjectId || '')}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && (data.big_idea || data.highlight_scene || data.slogan)) {
            assignedPlanSubjectId.value = data.subject_id || '';
            assignedPlanName.value = data.name || '';
            assignedPlanContent.value = { big_idea: data.big_idea || '', highlight_scene: data.highlight_scene || '', slogan: data.slogan || '' };
            const lines = [];
            if (data.big_idea) lines.push(`模块1：核心创意与设定\n${data.big_idea}`);
            if (data.highlight_scene) lines.push(`模块2：高光画面描述\n${data.highlight_scene}`);
            if (data.slogan) lines.push(`模块3：主打广告语\n${data.slogan}`);
            aiSuggestionText.value = lines.join('\n\n');
          } else {
            aiSuggestionText.value = '模块1：核心创意与设定\n暂无过程组方案可供参考。\n\n模块2：高光画面描述\n暂无。\n\n模块3：主打广告语\n暂无。';
          }
          aiDone.value = true;
          aiDoneTime.value = new Date().toISOString();
          emitSave();
        })
        .catch(() => {
          aiSuggestionText.value = 'AI 方案获取失败，请稍后重试。';
          aiDone.value = true;
          aiDoneTime.value = new Date().toISOString();
          emitSave();
        });
    }
  };
  setTimeout(addNode, 400);
}

async function onSubmit() {
  if (!canSubmit.value) {
    failReason.value = '请先生成AI方案并完成右侧所有题目';
    showFailModal.value = true;
    return;
  }
  const endTime = new Date().toISOString();
  const payload = {
    subject_id: props.subjectId,
    name: props.name,
    group_type: 'result',
    assigned_plan_subject_id: assignedPlanSubjectId.value || '',
    assigned_plan_name: assignedPlanName.value || '',
    ai_big_idea: assignedPlanContent.value?.big_idea ?? '',
    ai_highlight_scene: assignedPlanContent.value?.highlight_scene ?? '',
    ai_slogan: assignedPlanContent.value?.slogan ?? '',
    scores: scores.value,
    open_text: openText.value.trim(),
    collab_start_time: collabStartTime.value || '',
    ai_done_time: aiDoneTime.value || '',
    rating_start_time: ratingStartTime.value || '',
    end_time: endTime,
    chat_log: '',
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

onMounted(() => {});
onUnmounted(() => {});
</script>

<style scoped>
.round-wrap { min-height: 100vh; background: var(--color-page-bg); padding: 16px; }
.collab-wrap .two-cols { width: 90%; max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; }
.left-col { display: grid; grid-template-rows: 3fr 2fr; gap: 8px; max-height: calc(100vh - 40px); overflow: hidden; }
.left-top, .left-bottom { overflow: auto; padding: 16px; font-family: "SimSun", "Songti SC", serif; }
.ai-dialog { background: var(--color-input-bg); border: 1px solid var(--color-secondary); border-radius: 6px; padding: 0; display: flex; flex-direction: column; }
.ai-header { display: flex; align-items: center; gap: 8px; padding: 10px 15px; border-bottom: 1px solid #e8e8e8; flex-shrink: 0; flex-wrap: wrap; }
.ai-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--color-primary); color: #fff; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ai-name { font-size: 14px; font-weight: 600; color: var(--color-text); }
.ai-body { flex: 1; overflow-y: auto; padding: 12px 15px; }
.ai-placeholder { display: flex; align-items: center; justify-content: center; min-height: 120px; }
.ai-send-btn { padding: 12px 28px; border-radius: 20px; border: 1px solid var(--color-primary); background: var(--color-active-bg); color: var(--color-text); font-size: 15px; cursor: pointer; }
.ai-msg-user { display: flex; justify-content: flex-end; margin-bottom: 8px; }
.msg-bubble { padding: 8px 12px; border-radius: 12px; max-width: 85%; }
.msg-user-bubble { background: var(--color-active-bg); }
.ai-node { margin: 4px 0; }
.ai-done-tip { margin: 8px 0; text-align: center; }
.right-col { display: flex; flex-direction: column; gap: 12px; max-height: calc(100vh - 40px); overflow: auto; padding: 12px; background: var(--color-page-bg); }
.scale-section-intro { font-size: 14px; color: #333; margin: 12px 0 8px 0; line-height: 1.6; font-weight: 500; padding: 8px 12px; background: #f5f5f5; border-radius: 6px; }
.scale-item { margin-bottom: 16px; }
.btn-row { margin-top: 12px; display: flex; justify-content: center; }
@media (max-width: 900px) { .collab-wrap .two-cols { grid-template-columns: 1fr; } }
</style>
