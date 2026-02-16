<template>
  <div class="admin-wrap">
    <header class="top-bar panel-border">
      <h1 class="text-h1 left">广告创意研究实验数据管理平台（研究一）</h1>
      <div class="top-actions">
        <a :href="exportUrls.plans" class="btn-primary" download>导出被试的方案</a>
        <a v-if="filters.dataType === 'cse'" :href="exportUrls.cse" class="btn-primary" download>导出CSE量表数据</a>
        <a v-if="filters.dataType === 'phase1-choices'" :href="exportUrls.phase1Scores" class="btn-primary" download>导出环节一打分</a>
        <span class="btn-primary disabled-btn">导出专家每道题目的评分</span>
      </div>
    </header>
    <div class="main-grid">
      <aside class="filter-panel panel-border">
        <h2 class="text-h2 center">数据筛选（研究一）</h2>
        <div class="filter-form">
          <label class="filter-label">实验类型</label>
          <select v-model="filters.experimentType" class="filter-select" disabled>
            <option value="study1">研究一</option>
          </select>

          <label class="filter-label">数据类型</label>
          <select v-model="filters.dataType" class="filter-select">
            <option value="plans">被试方案</option>
            <option value="cse">CSE量表数据</option>
            <option value="phase1-choices">环节一选择与打分</option>
          </select>

          <label class="filter-label">被试编号/姓名</label>
          <input
            v-model="filters.keyword"
            type="text"
            class="filter-input"
            placeholder="模糊搜索"
          />

          <label class="filter-label">数据状态</label>
          <select class="filter-select" disabled>
            <option value="">全部</option>
          </select>

          <label class="filter-label">创作环节</label>
          <select v-model="filters.phase" class="filter-select">
            <option value="">全部</option>
            <option value="环节一">环节一</option>
            <option value="环节二题目2">环节二题目2</option>
            <option value="环节二题目3">环节二题目3</option>
          </select>
        </div>
      </aside>
      <section class="table-panel panel-border">
        <!-- 被试方案 -->
        <template v-if="filters.dataType === 'plans'">
          <div v-if="plans.length === 0" class="empty-hint text-hint center">暂无符合条件的数据</div>
          <div v-else class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th :colspan="planColumns.length" class="text-table-head">研究一/被试方案</th>
                </tr>
                <tr>
                  <th
                    v-for="c in planColumns"
                    :key="c.key"
                    class="text-table-head th-sort"
                    @click="toggleSort(c.key)"
                  >
                    {{ c.label }}
                    <span v-if="sortKey === c.key" class="sort-icon">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in paginatedPlans" :key="r.id">
                  <td>{{ r.subject_id }}</td>
                  <td>{{ r.name }}</td>
                  <td>{{ r.phase }}</td>
                  <td>{{ r.question_no }}</td>
                  <td class="cell-body">{{ r.target_audience }}</td>
                  <td class="cell-body">{{ r.pain_point }}</td>
                  <td class="cell-body">{{ r.insight }}</td>
                  <td class="cell-body cell-big-idea">{{ r.big_idea }}</td>
                  <td class="cell-body">{{ r.rationale }}</td>
                  <td>{{ r.submitted_at || '—' }}</td>
                  <td>{{ r.is_auto_saved ? '是' : '否' }}</td>
                  <td>{{ getChoice(r.subject_id) }}</td>
                </tr>
              </tbody>
            </table>
            <div v-if="planTotal > pageSize" class="pagination text-score">
              <button type="button" class="page-btn" :disabled="page <= 1" @click="page = Math.max(1, page - 1)">上一页</button>
              <span>{{ page }} / {{ totalPages }}</span>
              <button type="button" class="page-btn" :disabled="page >= totalPages" @click="page = Math.min(totalPages, page + 1)">下一页</button>
            </div>
          </div>
        </template>
        <!-- CSE量表数据（与其他表格同格式：被试编号 + 题1～题4 及打分） -->
        <template v-else-if="filters.dataType === 'cse'">
          <div v-if="cseList.length === 0" class="empty-hint text-hint center">暂无CSE量表数据</div>
          <div v-else class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th colspan="5" class="text-table-head">研究一/CSE量表数据</th>
                </tr>
                <tr>
                  <th class="text-table-head th-sort" @click="toggleSortCse('subject_id')">被试编号 <span v-if="sortKey === 'subject_id'" class="sort-icon">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span></th>
                  <th class="text-table-head">题1</th>
                  <th class="text-table-head">题2</th>
                  <th class="text-table-head">题3</th>
                  <th class="text-table-head">题4</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, idx) in paginatedCse" :key="r.id != null ? r.id : 'cse-' + r.subject_id + '-' + idx">
                  <td>{{ r.subject_id }}</td>
                  <td class="text-score">{{ r.q1 != null ? r.q1 : '—' }}</td>
                  <td class="text-score">{{ r.q2 != null ? r.q2 : '—' }}</td>
                  <td class="text-score">{{ r.q3 != null ? r.q3 : '—' }}</td>
                  <td class="text-score">{{ r.q4 != null ? r.q4 : '—' }}</td>
                </tr>
              </tbody>
            </table>
            <div v-if="cseTotal > pageSize" class="pagination text-score">
              <button type="button" class="page-btn" :disabled="page <= 1" @click="page = Math.max(1, page - 1)">上一页</button>
              <span>{{ page }} / {{ cseTotalPages }}</span>
              <button type="button" class="page-btn" :disabled="page >= cseTotalPages" @click="page = Math.min(cseTotalPages, page + 1)">下一页</button>
            </div>
          </div>
        </template>
        <!-- 环节一选择与打分：纵向13题，横向您的作品/AI作品，按题号呈现 -->
        <template v-else-if="filters.dataType === 'phase1-choices'">
          <div v-if="choices.length === 0" class="empty-hint text-hint center">暂无环节一选择数据</div>
          <div v-else class="table-wrap phase1-scores-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th :colspan="2 + 13 * 2" class="text-table-head">研究一/环节一选择与打分（创造力评价13题）</th>
                </tr>
                <tr>
                  <th class="text-table-head th-sort" @click="toggleSortChoice('subject_id')">被试编号 <span v-if="sortKey === 'subject_id'" class="sort-icon">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span></th>
                  <th class="text-table-head">最终提交作品</th>
                  <th v-for="n in 13" :key="n" colspan="2" class="text-table-head">题{{ n }}</th>
                </tr>
                <tr>
                  <th class="text-table-head"></th>
                  <th class="text-table-head"></th>
                  <template v-for="n in 13" :key="n">
                    <th class="text-table-head text-table-sub">您的作品</th>
                    <th class="text-table-head text-table-sub">AI作品</th>
                  </template>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in paginatedChoices" :key="r.subject_id">
                  <td>{{ r.subject_id }}</td>
                  <td>{{ r.chosen || '—' }}</td>
                  <template v-for="n in 13" :key="n">
                    <td class="text-score">{{ getScoreByQuestion(r, n).yours }}</td>
                    <td class="text-score">{{ getScoreByQuestion(r, n).ai }}</td>
                  </template>
                </tr>
              </tbody>
            </table>
            <div v-if="choicesTotal > pageSize" class="pagination text-score">
              <button type="button" class="page-btn" :disabled="page <= 1" @click="page = Math.max(1, page - 1)">上一页</button>
              <span>{{ page }} / {{ choicesTotalPages }}</span>
              <button type="button" class="page-btn" :disabled="page >= choicesTotalPages" @click="page = Math.min(choicesTotalPages, page + 1)">下一页</button>
            </div>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const filters = ref({
  experimentType: 'study1',
  dataType: 'plans',
  keyword: '',
  phase: '',
});

const plans = ref([]);
const choices = ref([]);
const cseList = ref([]);
const sortKey = ref('');
const sortOrder = ref('asc');
const page = ref(1);
const pageSize = 20;

const planColumns = [
  { key: 'subject_id', label: '被试编号' },
  { key: 'name', label: '姓名' },
  { key: 'phase', label: '创作环节' },
  { key: 'question_no', label: '题号' },
  { key: 'target_audience', label: '目标受众画像' },
  { key: 'pain_point', label: '痛点挖掘' },
  { key: 'insight', label: '核心洞察' },
  { key: 'big_idea', label: '核心创意' },
  { key: 'rationale', label: '创意理由' },
  { key: 'submitted_at', label: '提交时间' },
  { key: 'is_auto_saved', label: '是否自动保存' },
  { key: 'chosen', label: '环节一最终提交作品' },
];

const exportUrls = {
  plans: '/api/admin/export/study1-plans',
  cse: '/api/admin/export/study1-cse',
  phase1Scores: '/api/admin/export/study1-phase1-scores',
};

function fetchPlans() {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  if (filters.value.phase) q.set('phase', filters.value.phase);
  fetch(`/api/admin/study1/plans?${q.toString()}`)
    .then((r) => r.json())
    .then((data) => { plans.value = Array.isArray(data) ? data : []; })
    .catch(() => { plans.value = []; });
}

function fetchChoices() {
  fetch('/api/admin/study1/phase1-choices')
    .then((r) => r.json())
    .then((data) => { choices.value = Array.isArray(data) ? data : []; })
    .catch(() => { choices.value = []; });
}

function fetchCse() {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  fetch(`/api/admin/study1/cse?${q.toString()}`)
    .then((r) => {
      if (!r.ok) return [];
      return r.json();
    })
    .then((data) => { cseList.value = Array.isArray(data) ? data : []; })
    .catch(() => { cseList.value = []; });
}

// 初始加载 + 监听筛选与数据类型
watch(
  () => [filters.value.keyword, filters.value.phase, filters.value.dataType],
  () => {
    page.value = 1;
    sortKey.value = '';
    if (filters.value.dataType === 'plans') {
      fetchPlans();
      fetchChoices();
    } else if (filters.value.dataType === 'cse') {
      fetchCse();
    } else if (filters.value.dataType === 'phase1-choices') {
      fetchChoices();
    }
  },
  { immediate: true }
);

// 环节一选择与方案表都用 choices，统一用 subject_id 字符串做 key 保证匹配
const choiceMap = computed(() => {
  const map = {};
  for (const c of choices.value) {
    const sid = c.subject_id != null ? String(c.subject_id) : '';
    map[sid] = c;
  }
  return map;
});

function getChoice(subjectId) {
  const sid = subjectId != null ? String(subjectId) : '';
  const ch = choiceMap.value[sid];
  return ch ? ch.chosen : '—';
}

function parseScoresJson(ch) {
  if (!ch || !ch.scores_json) return null;
  try {
    const data = typeof ch.scores_json === 'string' ? JSON.parse(ch.scores_json) : ch.scores_json;
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

function getScoresYours(subjectId) {
  const sid = subjectId != null ? String(subjectId) : '';
  const arr = parseScoresJson(choiceMap.value[sid]);
  if (!arr || !arr.length) return '—';
  return arr.map((d) => `Q${d.question_no}:${d.your_score ?? '—'}`).join(' ');
}

function getScoresAi(subjectId) {
  const sid = subjectId != null ? String(subjectId) : '';
  const arr = parseScoresJson(choiceMap.value[sid]);
  if (!arr || !arr.length) return '—';
  return arr.map((d) => `Q${d.question_no}:${d.ai_score ?? '—'}`).join(' ');
}

// 环节一选择表格：按题号取单题您的作品/AI作品分数（13题）
function getScoreByQuestion(row, questionNo) {
  const arr = parseScoresJson(row);
  if (!arr || !arr.length) return { yours: '—', ai: '—' };
  const item = arr.find((d) => Number(d.question_no) === questionNo);
  if (!item) return { yours: '—', ai: '—' };
  return {
    yours: item.your_score != null ? item.your_score : '—',
    ai: item.ai_score != null ? item.ai_score : '—',
  };
}

const sortedPlans = computed(() => {
  const arr = [...plans.value];
  if (!sortKey.value) return arr;
  const key = sortKey.value;
  arr.sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va ?? '').localeCompare(String(vb ?? ''), 'zh');
    return sortOrder.value === 'asc' ? cmp : -cmp;
  });
  return arr;
});

const planTotal = computed(() => sortedPlans.value.length);
const totalPages = computed(() => Math.max(1, Math.ceil(planTotal.value / pageSize)));

const paginatedPlans = computed(() => {
  const start = (page.value - 1) * pageSize;
  return sortedPlans.value.slice(start, start + pageSize);
});

// CSE 列表排序与分页
const sortedCse = computed(() => {
  const arr = [...cseList.value];
  const key = sortKey.value;
  if (!key) return arr;
  arr.sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va ?? '').localeCompare(String(vb ?? ''), 'zh');
    return sortOrder.value === 'asc' ? cmp : -cmp;
  });
  return arr;
});
const cseTotal = computed(() => sortedCse.value.length);
const cseTotalPages = computed(() => Math.max(1, Math.ceil(cseTotal.value / pageSize)));
const paginatedCse = computed(() => {
  const start = (page.value - 1) * pageSize;
  return sortedCse.value.slice(start, start + pageSize);
});
function toggleSortCse(key) {
  if (sortKey.value === key) sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  else { sortKey.value = key; sortOrder.value = 'asc'; }
}

// 环节一选择列表排序与分页
const sortedChoices = computed(() => {
  const arr = [...choices.value];
  const key = sortKey.value;
  if (!key) return arr;
  arr.sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va ?? '').localeCompare(String(vb ?? ''), 'zh');
    return sortOrder.value === 'asc' ? cmp : -cmp;
  });
  return arr;
});
const choicesTotal = computed(() => sortedChoices.value.length);
const choicesTotalPages = computed(() => Math.max(1, Math.ceil(choicesTotal.value / pageSize)));
const paginatedChoices = computed(() => {
  const start = (page.value - 1) * pageSize;
  return sortedChoices.value.slice(start, start + pageSize);
});
function toggleSortChoice(key) {
  if (sortKey.value === key) sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  else { sortKey.value = key; sortOrder.value = 'asc'; }
}

function toggleSort(key) {
  if (sortKey.value === key) sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  else { sortKey.value = key; sortOrder.value = 'asc'; }
}
</script>

<style scoped>
.admin-wrap {
  min-height: 100vh;
  background: var(--color-page-bg);
  padding: 10px;
  display: flex;
  flex-direction: column;
  width: 95%;
  max-width: 1600px;
  margin: 0 auto;
}
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  flex-shrink: 0;
  margin-bottom: 10px;
}
.top-bar .text-h1 { margin: 0; text-align: left; }
.top-actions { display: flex; gap: 20px; }
.btn-primary {
  min-width: 120px;
  height: 36px;
  padding: 0 16px;
  border-radius: 4px;
  background: var(--color-active-bg);
  color: var(--color-text);
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
}
.btn-primary:hover:not(.disabled-btn) { background: var(--color-secondary); }
.disabled-btn {
  background: var(--color-btn-disabled-bg) !important;
  color: var(--color-btn-disabled-text) !important;
  cursor: not-allowed;
}
.main-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 20% 70%;
  gap: 10px;
  justify-content: center;
}
.filter-panel {
  padding: 12px;
  overflow: auto;
}
.filter-panel .text-h2 { margin: 8px 0; }
.filter-form { display: flex; flex-direction: column; gap: 12px; }
.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  text-align: left;
}
.filter-select, .filter-input {
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-bottom: 1px solid var(--color-secondary);
  background: var(--color-input-bg);
  font-size: 14px;
  color: var(--color-text);
}
.filter-select:disabled, .filter-input:disabled { opacity: 0.7; }
.table-panel {
  overflow: auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.empty-hint {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}
.table-wrap { flex: 1; min-height: 0; overflow: auto; }
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  font-weight: 400;
  color: var(--color-text);
  line-height: 1.2;
}
.data-table th,
.data-table td {
  border: 1px solid var(--color-border-line);
  padding: 8px;
  text-align: left;
}
.data-table th {
  background: var(--color-table-head);
  color: #fff;
  font-weight: 500;
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 1;
}
.data-table td.cell-body { white-space: pre-wrap; word-break: break-word; }
.data-table td.cell-big-idea { white-space: pre-wrap; word-break: break-word; }
.th-sort { cursor: pointer; }
.sort-icon { margin-left: 4px; }
.text-table-sub { font-size: 12px; }
.phase1-scores-wrap .data-table { min-width: 1100px; }
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 12px;
}
.page-btn {
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  background: var(--color-active-bg);
  color: var(--color-text);
  cursor: pointer;
  font-size: 14px;
}
.page-btn:disabled {
  background: var(--color-btn-disabled-bg);
  color: var(--color-btn-disabled-text);
  cursor: not-allowed;
}
@media (max-width: 900px) {
  .main-grid { grid-template-columns: 1fr; }
}
</style>
