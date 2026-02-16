<template>
  <div class="admin-wrap">
    <header class="top-bar panel-border">
      <h1 class="text-h1 left">广告创意研究实验数据管理平台（预实验）</h1>
      <div class="top-actions">
        <a v-if="filters.dataType === 'plans'" :href="exportPlansUrlWithFilter" class="btn-primary" download>导出方案</a>
        <a v-else :href="exportScoresUrlWithFilter" class="btn-primary" download>导出专家评分</a>
      </div>
    </header>
    <div class="main-grid">
      <aside class="filter-panel panel-border">
        <h2 class="text-h2 center">数据筛选（预实验）</h2>
        <div class="filter-form">
          <label class="filter-label">实验类型</label>
          <select v-model="filters.experimentType" class="filter-select" disabled>
            <option value="pre">预实验</option>
          </select>
          <label class="filter-label">数据类型</label>
          <select v-model="filters.dataType" class="filter-select">
            <option value="plans">被试方案</option>
            <option value="scores">专家评分</option>
          </select>
          <label class="filter-label">被试/专家编号/姓名</label>
          <input
            v-model="filters.keyword"
            type="text"
            class="filter-input"
            placeholder="模糊搜索"
          />
          <label v-if="filters.dataType === 'scores'" class="filter-label">专家姓名</label>
          <input
            v-if="filters.dataType === 'scores'"
            v-model="filters.expertName"
            type="text"
            class="filter-input"
            placeholder="按专家姓名筛选"
          />
          <label class="filter-label">数据状态</label>
          <select v-model="filters.dataStatus" class="filter-select">
            <option value="">全部</option>
            <option value="valid">有效</option>
            <option value="invalid">无效</option>
          </select>
        </div>
      </aside>
      <section class="table-panel panel-border">
        <template v-if="filters.dataType === 'plans'">
          <div v-if="plans.length === 0" class="empty-hint text-hint center">暂无符合条件的数据</div>
          <div v-else class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th colspan="12" class="text-table-head">预实验/被试方案</th>
                </tr>
                <tr>
                  <th v-for="c in planColumns" :key="c.key" class="text-table-head th-sort" @click="sortPlanBy(c.key)">
                    {{ c.label }}
                    <span v-if="sortKey === c.key" class="sort-icon">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in paginatedPlans" :key="r.id">
                  <td>{{ r.subject_id }}</td>
                  <td class="cell-name">{{ r.name || '—' }}</td>
                  <td class="cell-body">{{ r.target_audience }}</td>
                  <td class="cell-body">{{ r.pain_point }}</td>
                  <td class="cell-body">{{ r.insight }}</td>
                  <td class="cell-body cell-big-idea">{{ r.big_idea }}</td>
                  <td class="cell-body">{{ r.rationale }}</td>
                  <td>{{ formatBeijingTime(r.submitted_at) }}</td>
                  <td>{{ r.is_auto_saved ? '是' : '否' }}</td>
                  <td :class="{ 'text-score invalid-cell': r.expert_marked_invalid }">{{ r.expert_marked_invalid ? '是' : '否' }}</td>
                  <td :class="{ 'text-score invalid-cell': r.expert_marked_invalid }">{{ r.plan_status }}</td>
                  <td :class="{ 'text-score invalid-cell': r.expert_marked_invalid }">{{ r.invalid_expert_names || '—' }}</td>
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
        <template v-else>
          <div v-if="scores.length === 0" class="empty-hint text-hint center">暂无符合条件的数据</div>
          <div v-else class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th colspan="7" class="text-table-head">预实验/专家评分</th>
                </tr>
                <tr>
                  <th v-for="c in scoreColumns" :key="c.key" class="text-table-head th-sort" @click="sortScoreBy(c.key)">
                    {{ c.label }}
                    <span v-if="sortKey === c.key" class="sort-icon">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in paginatedScores" :key="r.id">
                  <td>{{ r.subject_id }}</td>
                  <td class="cell-name">{{ r.subject_name || '—' }}</td>
                  <td>{{ r.expert_name }}</td>
                  <td>{{ r.question_no }}</td>
                  <td :class="{ 'text-score invalid': r.is_invalid }">{{ r.score }}</td>
                  <td :class="{ 'text-score invalid': r.is_invalid }">{{ r.is_invalid ? '是' : '否' }}</td>
                  <td>{{ formatBeijingTime(r.scored_at) }}</td>
                </tr>
              </tbody>
            </table>
            <div v-if="scoreTotal > pageSize" class="pagination text-score">
              <button type="button" class="page-btn" :disabled="page <= 1" @click="page = Math.max(1, page - 1)">上一页</button>
              <span>{{ page }} / {{ scoreTotalPages }}</span>
              <button type="button" class="page-btn" :disabled="page >= scoreTotalPages" @click="page = Math.min(scoreTotalPages, page + 1)">下一页</button>
            </div>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { formatBeijingTime } from '../../utils/formatBeijingTime.js';

const filters = ref({
  experimentType: 'pre',
  dataType: 'plans',
  keyword: '',
  expertName: '',
  dataStatus: '',
});

const plans = ref([]);
const scores = ref([]);
const expertInvalidSubjectIds = ref(new Set());
const invalidExpertNamesBySubject = ref({});
const sortKey = ref('');
const sortOrder = ref('asc');
const page = ref(1);
const pageSize = 20;

const planColumns = [
  { key: 'subject_id', label: '被试编号' },
  { key: 'name', label: '被试姓名' },
  { key: 'target_audience', label: '目标受众画像' },
  { key: 'pain_point', label: '痛点挖掘' },
  { key: 'insight', label: '核心洞察' },
  { key: 'big_idea', label: '核心创意' },
  { key: 'rationale', label: '创意理由' },
  { key: 'submitted_at', label: '提交时间' },
  { key: 'is_auto_saved', label: '是否自动保存' },
  { key: 'expert_marked_invalid', label: '专家标记无效' },
  { key: 'plan_status', label: '方案状态' },
  { key: 'invalid_expert_names', label: '标记无效的专家' },
];

const scoreColumns = [
  { key: 'subject_id', label: '被试编号' },
  { key: 'subject_name', label: '被试姓名' },
  { key: 'expert_name', label: '专家姓名' },
  { key: 'question_no', label: '题号' },
  { key: 'score', label: '分数' },
  { key: 'is_invalid', label: '是否标记无效' },
  { key: 'scored_at', label: '打分时间' },
];

const exportPlansUrlWithFilter = computed(() => {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  if (filters.value.dataStatus) q.set('dataStatus', filters.value.dataStatus);
  return `/api/admin/export/pre-plans?${q.toString()}`;
});
const exportScoresUrlWithFilter = computed(() => {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  if (filters.value.expertName) q.set('expertName', filters.value.expertName);
  if (filters.value.dataStatus) q.set('dataStatus', filters.value.dataStatus);
  return `/api/admin/export/pre-scores?${q.toString()}`;
});

function fetchPlans() {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  fetch(`/api/admin/pre/plans?${q.toString()}`)
    .then((r) => r.json())
    .then((data) => { plans.value = Array.isArray(data) ? data : []; })
    .catch(() => { plans.value = []; });
}

function fetchExpertInvalidSubjects() {
  fetch('/api/admin/pre/expert-invalid-subjects')
    .then((r) => {
      if (!r.ok) throw new Error(r.statusText);
      return r.json();
    })
    .then((data) => {
      let ids = [];
      let details = [];
      if (data != null) {
        if (Array.isArray(data)) {
          ids = data.map((id) => String(id ?? ''));
        } else if (Array.isArray(data.subjectIds)) {
          ids = data.subjectIds.map((id) => String(id ?? ''));
        }
        if (Array.isArray(data.details)) {
          details = data.details;
        }
      }
      expertInvalidSubjectIds.value = new Set(ids.filter(Boolean));
      const map = {};
      for (const d of details) {
        const sid = String(d.subject_id ?? '');
        const name = d.expert_name != null ? String(d.expert_name) : '';
        if (!sid) continue;
        if (!map[sid]) map[sid] = [];
        if (name && !map[sid].includes(name)) map[sid].push(name);
      }
      invalidExpertNamesBySubject.value = map;
    })
    .catch(() => {
      expertInvalidSubjectIds.value = new Set();
      invalidExpertNamesBySubject.value = {};
    });
}

function fetchScores() {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  if (filters.value.expertName) q.set('expertName', filters.value.expertName);
  if (filters.value.dataStatus) q.set('dataStatus', filters.value.dataStatus);
  fetch(`/api/admin/pre/scores?${q.toString()}`)
    .then((r) => r.json())
    .then((data) => { scores.value = Array.isArray(data) ? data : []; })
    .catch(() => { scores.value = []; });
}

watch(
  () => [filters.value.dataType, filters.value.keyword, filters.value.expertName, filters.value.dataStatus],
  () => {
    page.value = 1;
    sortKey.value = '';
    if (filters.value.dataType === 'plans') {
      fetchPlans();
      fetchExpertInvalidSubjects();
    } else {
      fetchScores();
    }
  },
  { immediate: true }
);

const plansWithInvalid = computed(() =>
  plans.value.map((r) => {
    const subjectIdStr = String(r.subject_id ?? '');
    const invalid = expertInvalidSubjectIds.value.has(subjectIdStr);
    const names = invalidExpertNamesBySubject.value[subjectIdStr];
    return {
      ...r,
      expert_marked_invalid: invalid,
      plan_status: invalid ? '无效' : '有效',
      invalid_expert_names: names && names.length ? names.join('、') : invalid ? '—' : '—',
    };
  })
);

const plansFilteredByStatus = computed(() => {
  const arr = plansWithInvalid.value;
  const status = filters.value.dataStatus;
  if (filters.value.dataType !== 'plans' || !status) return arr;
  if (status === 'invalid') return arr.filter((r) => r.expert_marked_invalid);
  if (status === 'valid') return arr.filter((r) => !r.expert_marked_invalid);
  return arr;
});

const sortedPlans = computed(() => {
  const arr = [...plansFilteredByStatus.value];
  if (!sortKey.value || !planColumns.some((c) => c.key === sortKey.value)) return arr;
  const key = sortKey.value;
  arr.sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    if (key === 'expert_marked_invalid') {
      const cmp = (va ? 1 : 0) - (vb ? 1 : 0);
      return sortOrder.value === 'asc' ? cmp : -cmp;
    }
    if (key === 'plan_status') {
      const cmp = String(va ?? '').localeCompare(String(vb ?? ''), 'zh');
      return sortOrder.value === 'asc' ? cmp : -cmp;
    }
    const cmp = String(va ?? '').localeCompare(String(vb ?? ''), 'zh');
    return sortOrder.value === 'asc' ? cmp : -cmp;
  });
  return arr;
});

const sortedScores = computed(() => {
  const arr = [...scores.value];
  if (!sortKey.value || !scoreColumns.some((c) => c.key === sortKey.value)) return arr;
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
const scoreTotal = computed(() => sortedScores.value.length);
const totalPages = computed(() => Math.max(1, Math.ceil(planTotal.value / pageSize)));
const scoreTotalPages = computed(() => Math.max(1, Math.ceil(scoreTotal.value / pageSize)));

const paginatedPlans = computed(() => {
  const start = (page.value - 1) * pageSize;
  return sortedPlans.value.slice(start, start + pageSize);
});

const paginatedScores = computed(() => {
  const start = (page.value - 1) * pageSize;
  return sortedScores.value.slice(start, start + pageSize);
});

function sortPlanBy(key) {
  if (sortKey.value === key) sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  else { sortKey.value = key; sortOrder.value = 'asc'; }
}

function sortScoreBy(key) {
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
}
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  flex-shrink: 0;
  margin-bottom: 10px;
}
.top-bar .text-h1 { margin: 0; }
.top-actions { display: flex; gap: 20px; }
.btn-primary {
  min-width: 120px;
  height: 36px;
  padding: 0 16px;
  white-space: nowrap;
  border-radius: 4px;
  background: var(--color-active-bg);
  color: var(--color-text);
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}
.btn-primary:hover { background: var(--color-secondary); }
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
.filter-hint { margin: 0; font-size: 12px; margin-top: -4px; }
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
.cell-name { min-width: 4em; word-break: keep-all; overflow-wrap: normal; }
.text-score.invalid { color: var(--color-invalid); }
.data-table td.invalid-cell { color: var(--color-invalid); font-weight: 500; }
.th-sort { cursor: pointer; }
.sort-icon { margin-left: 4px; }
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
