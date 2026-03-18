<template>
  <div class="admin-wrap">
    <header class="top-bar panel-border">
      <h1 class="text-h1 left">广告创意研究实验数据管理平台（研究三）</h1>
      <div class="top-actions">
        <template v-if="filters.dataType === 'records'">
          <a :href="exportRecordsUrl" class="btn-primary" download>导出记录</a>
          <button type="button" class="btn-primary btn-danger" :disabled="selectedIds.size === 0" @click="deleteSelected">批量删除选中</button>
        </template>
        <template v-else-if="filters.dataType === 'cse'">
          <a :href="exportCseUrl" class="btn-primary" download>导出CSE量表</a>
          <button type="button" class="btn-primary btn-danger" :disabled="selectedIds.size === 0" @click="deleteSelected">批量删除选中</button>
        </template>
        <template v-else-if="filters.dataType === 'chatlogs'">
          <a :href="exportChatlogsUrl" class="btn-primary" download>导出对话记录</a>
          <a :href="exportChatlogsFullUrl" class="btn-primary" download>导出完整对话记录</a>
          <button type="button" class="btn-primary btn-danger" :disabled="selectedIds.size === 0" @click="deleteSelected">批量删除选中</button>
        </template>
      </div>
    </header>

    <div class="main-grid">
      <aside class="filter-panel panel-border">
        <h2 class="text-h2 center">数据筛选（研究三）</h2>
        <div class="filter-form">
          <label class="filter-label">数据类型</label>
          <select v-model="filters.dataType" class="filter-select">
            <option value="records">被试记录</option>
            <option value="cse">CSE量表数据</option>
            <option value="chatlogs">对话记录（过程组）</option>
          </select>

          <template v-if="filters.dataType !== 'chatlogs'">
            <label class="filter-label">组别</label>
            <select v-model="filters.groupType" class="filter-select">
              <option value="">全部</option>
              <option value="process">过程组</option>
              <option value="result">结果组</option>
            </select>
          </template>

          <label class="filter-label">被试编号/姓名</label>
          <input v-model="filters.keyword" type="text" class="filter-input" placeholder="模糊搜索" />
        </div>
      </aside>

      <section class="table-panel panel-border">
        <template v-if="filters.dataType === 'records'">
          <div v-if="records.length === 0" class="empty-hint text-hint center">暂无数据</div>
          <div v-else class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="text-table-head th-checkbox"><input type="checkbox" :checked="allSelected" :indeterminate="someSelected" @change="toggleAll(paginated)" /></th>
                  <th class="text-table-head">被试编号</th>
                  <th class="text-table-head">被试姓名</th>
                  <th class="text-table-head">组别</th>
                  <th class="text-table-head">抽到的过程组编号</th>
                  <th class="text-table-head">抽到的过程组姓名</th>
                  <th class="text-table-head">情绪1</th>
                  <th class="text-table-head">情绪2</th>
                  <th class="text-table-head">情绪3</th>
                  <th class="text-table-head">情绪4</th>
                  <th class="text-table-head">情绪5</th>
                  <th class="text-table-head">期望落差1</th>
                  <th class="text-table-head">期望落差2</th>
                  <th class="text-table-head">满意度1</th>
                  <th class="text-table-head">满意度2</th>
                  <th class="text-table-head">满意度3</th>
                  <th class="text-table-head">满意度4</th>
                  <th class="text-table-head">所有权1</th>
                  <th class="text-table-head">所有权2</th>
                  <th class="text-table-head">所有权3</th>
                  <th class="text-table-head">所有权4</th>
                  <th class="text-table-head">控制感1</th>
                  <th class="text-table-head">控制感2</th>
                  <th class="text-table-head">控制感3</th>
                  <th class="text-table-head">填空题</th>
                  <th class="text-table-head">开始协作</th>
                  <th class="text-table-head">AI生成方案</th>
                  <th class="text-table-head">开始作答</th>
                  <th class="text-table-head">完成时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in paginated" :key="r.id">
                  <td class="td-checkbox"><input type="checkbox" :checked="selectedIds.has(r.id)" @change="toggleId(r.id)" /></td>
                  <td>{{ r.subject_id }}</td>
                  <td class="cell-name">{{ r.display_name || r.name || '—' }}</td>
                  <td>{{ r.group_type === 'process' ? '过程组' : '结果组' }}</td>
                  <td>{{ r.assigned_plan_subject_id || '—' }}</td>
                  <td class="cell-name">{{ r.assigned_plan_name || '—' }}</td>
                  <td class="text-score">{{ r.emotion_1 ?? '—' }}</td>
                  <td class="text-score">{{ r.emotion_2 ?? '—' }}</td>
                  <td class="text-score">{{ r.emotion_3 ?? '—' }}</td>
                  <td class="text-score">{{ r.emotion_4 ?? '—' }}</td>
                  <td class="text-score">{{ r.emotion_5 ?? '—' }}</td>
                  <td class="text-score">{{ r.gap_1 ?? '—' }}</td>
                  <td class="text-score">{{ r.gap_2 ?? '—' }}</td>
                  <td class="text-score">{{ r.satisfaction_1 ?? '—' }}</td>
                  <td class="text-score">{{ r.satisfaction_2 ?? '—' }}</td>
                  <td class="text-score">{{ r.satisfaction_3 ?? '—' }}</td>
                  <td class="text-score">{{ r.satisfaction_4 ?? '—' }}</td>
                  <td class="text-score">{{ r.ownership_1 ?? '—' }}</td>
                  <td class="text-score">{{ r.ownership_2 ?? '—' }}</td>
                  <td class="text-score">{{ r.ownership_3 ?? '—' }}</td>
                  <td class="text-score">{{ r.ownership_4 ?? '—' }}</td>
                  <td class="text-score">{{ r.control_1 ?? '—' }}</td>
                  <td class="text-score">{{ r.control_2 ?? '—' }}</td>
                  <td class="text-score">{{ r.control_3 ?? '—' }}</td>
                  <td class="cell-body cell-open-text">{{ r.open_text || '—' }}</td>
                  <td class="cell-time">{{ fmt(r.collab_start_time) }}</td>
                  <td class="cell-time">{{ fmt(r.ai_done_time) }}</td>
                  <td class="cell-time">{{ fmt(r.rating_start_time) }}</td>
                  <td class="cell-time">{{ fmt(r.end_time) }}</td>
                </tr>
              </tbody>
            </table>
            <div v-if="total > pageSize" class="pagination text-score">
              <button type="button" class="page-btn" :disabled="page <= 1" @click="page--">上一页</button>
              <span>{{ page }} / {{ totalPages }}</span>
              <button type="button" class="page-btn" :disabled="page >= totalPages" @click="page++">下一页</button>
            </div>
          </div>
        </template>

        <template v-else-if="filters.dataType === 'cse'">
          <div v-if="cseList.length === 0" class="empty-hint text-hint center">暂无数据</div>
          <div v-else class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="text-table-head th-checkbox"><input type="checkbox" :checked="allCseSelected" :indeterminate="someCseSelected" @change="toggleAll(paginatedCse)" /></th>
                  <th class="text-table-head">被试编号</th>
                  <th class="text-table-head">被试姓名</th>
                  <th class="text-table-head">组别</th>
                  <th class="text-table-head">题1</th>
                  <th class="text-table-head">题2</th>
                  <th class="text-table-head">题3</th>
                  <th class="text-table-head">题4</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in paginatedCse" :key="r.id">
                  <td class="td-checkbox"><input type="checkbox" :checked="selectedIds.has(r.id)" @change="toggleId(r.id)" /></td>
                  <td>{{ r.subject_id }}</td>
                  <td class="cell-name">{{ r.display_name || '—' }}</td>
                  <td>{{ r.group_type === 'process' ? '过程组' : '结果组' }}</td>
                  <td class="text-score">{{ r.q1 ?? '—' }}</td>
                  <td class="text-score">{{ r.q2 ?? '—' }}</td>
                  <td class="text-score">{{ r.q3 ?? '—' }}</td>
                  <td class="text-score">{{ r.q4 ?? '—' }}</td>
                </tr>
              </tbody>
            </table>
            <div v-if="cseList.length > pageSize" class="pagination text-score">
              <button type="button" class="page-btn" :disabled="page <= 1" @click="page--">上一页</button>
              <span>{{ page }} / {{ cseTotalPages }}</span>
              <button type="button" class="page-btn" :disabled="page >= cseTotalPages" @click="page++">下一页</button>
            </div>
          </div>
        </template>

        <!-- 对话记录 -->
        <template v-else-if="filters.dataType === 'chatlogs'">
          <div v-if="chatLogs.length === 0" class="empty-hint text-hint center">暂无对话记录</div>
          <div v-else class="table-wrap">
            <table class="data-table">
              <thead>
                <tr><th :colspan="12" class="text-table-head">研究三/过程组对话记录</th></tr>
                <tr>
                  <th class="text-table-head th-checkbox"><input type="checkbox" :checked="allChatSelected" :indeterminate="someChatSelected" @change="toggleAll(paginatedChats)" /></th>
                  <th class="text-table-head">被试编号</th><th class="text-table-head">被试姓名</th>
                  <th class="text-table-head">第1轮输入</th><th class="text-table-head">第2轮输入</th><th class="text-table-head">第3轮输入</th><th class="text-table-head">第4轮输入</th><th class="text-table-head">第5轮输入</th>
                  <th class="text-table-head">互动轮次</th><th class="text-table-head">用户输入字数</th><th class="text-table-head">AI提问次数</th>
                  <th class="text-table-head">完整对话</th>
                  <th class="text-table-head">AI输出方案</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in paginatedChats" :key="r.id">
                  <td class="td-checkbox"><input type="checkbox" :checked="selectedIds.has(r.id)" @change="toggleId(r.id)" /></td>
                  <td>{{ r.subject_id }}</td>
                  <td class="cell-name">{{ r.display_name || r.name || '—' }}</td>
                  <td class="cell-body">{{ r.round1 }}</td>
                  <td class="cell-body">{{ r.round2 }}</td>
                  <td class="cell-body">{{ r.round3 }}</td>
                  <td class="cell-body">{{ r.round4 }}</td>
                  <td class="cell-body">{{ r.round5 }}</td>
                  <td class="text-score">{{ r.interaction_rounds }}</td>
                  <td class="text-score">{{ r.user_input_chars }}</td>
                  <td class="text-score">{{ r.ai_ask_count }}</td>
                  <td><button type="button" class="btn-link" @click="showChat(r)">查看</button></td>
                  <td><button type="button" class="btn-link" :disabled="!hasAiPlan(r)" @click="showAiPlan(r)">查看</button></td>
                </tr>
              </tbody>
            </table>
            <div v-if="totalChats > pageSize" class="pagination text-score">
              <button type="button" class="page-btn" :disabled="page <= 1" @click="page--">上一页</button>
              <span>{{ page }} / {{ chatTotalPages }}</span>
              <button type="button" class="page-btn" :disabled="page >= chatTotalPages" @click="page++">下一页</button>
            </div>
          </div>
        </template>
      </section>
    </div>

    <!-- 对话详情弹窗 -->
    <div v-if="chatModalVisible" class="modal-overlay" @click.self="chatModalVisible = false">
      <div class="modal-box">
        <h3 class="text-h2">对话详情 - {{ chatModalData.subject_id }}</h3>
        <div class="chat-log-body">
          <div v-for="(msg, i) in chatModalMessages" :key="i" :class="msg.role === 'user' ? 'chat-user' : 'chat-ai'">
            <strong>{{ msg.role === 'user' ? '被试' : 'AI' }}：</strong>
            <span>{{ msg.content }}</span>
          </div>
        </div>
        <div style="text-align: right; margin-top: 12px;"><button type="button" class="btn-primary" @click="chatModalVisible = false">关闭</button></div>
      </div>
    </div>

    <!-- AI方案详情弹窗 -->
    <div v-if="aiPlanModalVisible" class="modal-overlay" @click.self="aiPlanModalVisible = false">
      <div class="modal-box">
        <h3 class="text-h2">AI输出方案 - {{ aiPlanModalData.subject_id }}</h3>
        <div class="ai-plan-body">
          <div v-if="aiPlanModalData.ai_big_idea" class="plan-section"><strong>模块1：核心创意与设定</strong><p>{{ aiPlanModalData.ai_big_idea }}</p></div>
          <div v-if="aiPlanModalData.ai_highlight_scene" class="plan-section"><strong>模块2：高光画面描述</strong><p>{{ aiPlanModalData.ai_highlight_scene }}</p></div>
          <div v-if="aiPlanModalData.ai_slogan" class="plan-section"><strong>模块3：主打广告语</strong><p>{{ aiPlanModalData.ai_slogan }}</p></div>
        </div>
        <div style="text-align: right; margin-top: 12px;"><button type="button" class="btn-primary" @click="aiPlanModalVisible = false">关闭</button></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const filters = ref({ dataType: 'records', groupType: '', keyword: '' });
const records = ref([]);
const cseList = ref([]);
const chatLogs = ref([]);
const page = ref(1);
const pageSize = 20;
const selectedIds = ref(new Set());

const chatModalVisible = ref(false);
const chatModalData = ref({});
const chatModalMessages = ref([]);
const aiPlanModalVisible = ref(false);
const aiPlanModalData = ref({});

function fmt(t) {
  if (!t) return '—';
  try {
    const d = new Date(t);
    if (isNaN(d.getTime())) return t;
    return d.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
  } catch { return t; }
}

function toggleId(id) { const s = new Set(selectedIds.value); if (s.has(id)) s.delete(id); else s.add(id); selectedIds.value = s; }
function toggleAll(rows) {
  if (rows.every((r) => selectedIds.value.has(r.id))) selectedIds.value = new Set();
  else selectedIds.value = new Set(rows.map((r) => r.id));
}

const total = computed(() => records.value.length);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));
const paginated = computed(() => records.value.slice((page.value - 1) * pageSize, page.value * pageSize));
const allSelected = computed(() => paginated.value.length > 0 && paginated.value.every((r) => selectedIds.value.has(r.id)));
const someSelected = computed(() => paginated.value.some((r) => selectedIds.value.has(r.id)) && !allSelected.value);

const cseTotalPages = computed(() => Math.max(1, Math.ceil(cseList.value.length / pageSize)));
const paginatedCse = computed(() => cseList.value.slice((page.value - 1) * pageSize, page.value * pageSize));
const allCseSelected = computed(() => paginatedCse.value.length > 0 && paginatedCse.value.every((r) => selectedIds.value.has(r.id)));
const someCseSelected = computed(() => paginatedCse.value.some((r) => selectedIds.value.has(r.id)) && !allCseSelected.value);

const totalChats = computed(() => chatLogs.value.length);
const chatTotalPages = computed(() => Math.max(1, Math.ceil(totalChats.value / pageSize)));
const paginatedChats = computed(() => chatLogs.value.slice((page.value - 1) * pageSize, page.value * pageSize));
const allChatSelected = computed(() => paginatedChats.value.length > 0 && paginatedChats.value.every((r) => selectedIds.value.has(r.id)));
const someChatSelected = computed(() => paginatedChats.value.some((r) => selectedIds.value.has(r.id)) && !allChatSelected.value);

const exportChatlogsUrl = computed(() => {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  return `/api/admin/export/study3-chatlogs?${q}`;
});
const exportChatlogsFullUrl = computed(() => {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  return `/api/admin/export/study3-chatlogs-full?${q}`;
});

function hasAiPlan(r) {
  return !!(r.ai_big_idea || r.ai_highlight_scene || r.ai_slogan);
}
function showChat(r) {
  chatModalData.value = r;
  chatModalMessages.value = (r.messages || []).filter((m) => m.role !== 'system');
  chatModalVisible.value = true;
}
function showAiPlan(r) {
  aiPlanModalData.value = r;
  aiPlanModalVisible.value = true;
}

const exportRecordsUrl = computed(() => {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  if (filters.value.groupType) q.set('group_type', filters.value.groupType);
  return `/api/admin/export/study3-records?${q}`;
});
const exportCseUrl = computed(() => {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  if (filters.value.groupType) q.set('group_type', filters.value.groupType);
  return `/api/admin/export/study3-cse?${q}`;
});

function fetchRecords() {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  if (filters.value.groupType) q.set('group_type', filters.value.groupType);
  fetch(`/api/admin/study3/records?${q}`).then((r) => r.json()).then((d) => { records.value = Array.isArray(d) ? d : []; }).catch(() => { records.value = []; });
}
function fetchCse() {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  if (filters.value.groupType) q.set('group_type', filters.value.groupType);
  fetch(`/api/admin/study3/cse?${q}`).then((r) => r.json()).then((d) => { cseList.value = Array.isArray(d) ? d : []; }).catch(() => { cseList.value = []; });
}

function fetchChatLogs() {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  fetch(`/api/admin/study3/records?group_type=process&${q}`).then((r) => r.json()).then((d) => {
    const rows = Array.isArray(d) ? d : [];
    chatLogs.value = rows.map((r) => {
      let msgs = [];
      try { msgs = JSON.parse(r.chat_log || '[]'); } catch (_) {}
      const userMsgs = msgs.filter((m) => m.role === 'user');
      const assistantNonFinal = msgs.filter((m) => m.role === 'assistant' && !m.isFinal);
      return {
        ...r,
        messages: msgs,
        round1: userMsgs[0]?.content || '',
        round2: userMsgs[1]?.content || '',
        round3: userMsgs[2]?.content || '',
        round4: userMsgs[3]?.content || '',
        round5: userMsgs[4]?.content || '',
        interaction_rounds: userMsgs.length,
        user_input_chars: userMsgs.reduce((s, m) => s + String(m.content || '').length, 0),
        ai_ask_count: assistantNonFinal.length,
      };
    });
  }).catch(() => { chatLogs.value = []; });
}

function refreshData() {
  if (filters.value.dataType === 'records') fetchRecords();
  else if (filters.value.dataType === 'cse') fetchCse();
  else if (filters.value.dataType === 'chatlogs') fetchChatLogs();
}

function deleteSelected() {
  if (selectedIds.value.size === 0) return;
  const dt = filters.value.dataType;
  const ids = [...selectedIds.value];
  let url = '';
  if (dt === 'records' || dt === 'chatlogs') url = '/api/admin/study3/records';
  else url = '/api/admin/study3/cse';
  if (!confirm(`确定删除选中的 ${ids.length} 条数据吗？`)) return;
  fetch(url, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) })
    .then((r) => r.json()).then((d) => { if (d.ok) { selectedIds.value = new Set(); refreshData(); } }).catch(() => {});
}

watch(
  () => [filters.value.dataType, filters.value.groupType, filters.value.keyword],
  () => { page.value = 1; selectedIds.value = new Set(); refreshData(); },
  { immediate: true }
);
</script>

<style scoped>
.admin-wrap { min-height: 100vh; background: var(--color-page-bg); padding: 10px; display: flex; flex-direction: column; width: 95%; max-width: 1800px; margin: 0 auto; }
.top-bar { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; margin-bottom: 10px; }
.top-actions { display: flex; gap: 12px; }
.btn-primary { min-width: 120px; height: 36px; padding: 0 16px; border-radius: 4px; background: var(--color-active-bg); color: var(--color-text); font-size: 14px; font-weight: 500; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; cursor: pointer; white-space: nowrap; border: none; }
.btn-primary.btn-danger { background: #c62828; color: #fff; }
.main-grid { flex: 1; min-height: 0; display: grid; grid-template-columns: 200px 1fr; gap: 10px; }
.filter-panel { padding: 12px; overflow: auto; }
.filter-form { display: flex; flex-direction: column; gap: 12px; }
.filter-label { font-size: 14px; font-weight: 500; }
.filter-select, .filter-input { width: 100%; padding: 8px 10px; border: none; border-bottom: 1px solid var(--color-secondary); background: var(--color-input-bg); }
.table-panel { overflow: auto; display: flex; flex-direction: column; min-height: 0; }
.empty-hint { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px; }
.table-wrap { flex: 1; min-height: 0; overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { border: 1px solid var(--color-border-line); padding: 6px 8px; white-space: nowrap; }
.data-table th { background: #B8D4E8; position: sticky; top: 0; z-index: 1; font-family: "SimSun", "Songti SC", serif; text-align: center; font-size: 12px; }
.data-table td.cell-body { white-space: pre-wrap; word-break: break-word; }
.data-table td.cell-open-text { white-space: pre-wrap; word-break: break-word; max-width: 200px; }
.cell-name { min-width: 4em; word-break: keep-all; }
.cell-time { font-size: 12px; white-space: nowrap; }
.th-checkbox, .td-checkbox { width: 36px; text-align: center; vertical-align: middle; }
.pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 12px; }
.page-btn { padding: 6px 12px; border-radius: 4px; border: none; background: var(--color-active-bg); cursor: pointer; }
.btn-link { background: none; border: none; color: #1976d2; cursor: pointer; font-size: 13px; text-decoration: underline; padding: 0; }
.btn-link:disabled { color: #999; cursor: default; text-decoration: none; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal-box { background: #fff; border-radius: 8px; padding: 20px 24px; width: 90%; max-width: 700px; max-height: 80vh; overflow: auto; box-shadow: 0 4px 24px rgba(0,0,0,.2); }
.chat-log-body { max-height: 50vh; overflow: auto; margin: 12px 0; }
.chat-user { margin: 8px 0; padding: 6px 10px; background: #e3f2fd; border-radius: 6px; }
.chat-ai { margin: 8px 0; padding: 6px 10px; background: #f5f5f5; border-radius: 6px; white-space: pre-wrap; word-break: break-word; }
.ai-plan-body { margin: 12px 0; }
.plan-section { margin-bottom: 12px; }
.plan-section p { white-space: pre-wrap; word-break: break-word; margin: 4px 0; }
@media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }
</style>
