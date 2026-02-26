<template>
  <div class="admin-wrap">
    <header class="top-bar panel-border">
      <h1 class="text-h1 left">广告创意研究实验数据管理平台（研究一）</h1>
      <div class="top-actions">
        <template v-if="filters.dataType === 'plans-phase1'">
          <a :href="exportPlansPhase1Url" class="btn-primary" download>导出环节一方案</a>
          <a :href="exportExpertScoresUrl" class="btn-primary" download>导出专家评分</a>
          <button type="button" class="btn-primary btn-danger" :disabled="selectedPlanIds.size === 0" @click="deleteSelectedPlans">删除选中方案</button>
        </template>
        <template v-else-if="filters.dataType === 'phase1-choices'">
          <a :href="exportPhase1ScoresUrl" class="btn-primary" download>导出环节一打分</a>
          <button type="button" class="btn-primary btn-danger" :disabled="selectedChoiceSubjectIds.size === 0" @click="deleteSelectedPhase1Choices">删除选中记录</button>
        </template>
        <template v-else-if="filters.dataType === 'plans-phase2'">
          <a :href="exportPlansPhase2Url" class="btn-primary" download>导出环节二作品</a>
          <button type="button" class="btn-primary btn-danger" :disabled="selectedPlanIds.size === 0" @click="deleteSelectedPlans">删除选中方案</button>
        </template>
        <template v-else-if="filters.dataType === 'cse'">
          <a :href="exportCseUrl" class="btn-primary" download>导出CSE量表数据</a>
          <button type="button" class="btn-primary btn-danger" :disabled="selectedCseIds.size === 0" @click="deleteSelectedCseData">删除选中数据</button>
        </template>
        <template v-else-if="filters.dataType === 'expert-scores'">
          <a :href="exportExpertScoresUrl" class="btn-primary" download>导出专家评分</a>
        </template>
      </div>
    </header>
    <div class="main-grid">
      <aside class="filter-panel panel-border">
        <h2 class="text-h2 center">数据筛选（研究一）</h2>
        <div class="filter-form">
          <label class="filter-label">数据类型</label>
          <select v-model="filters.dataType" class="filter-select">
            <option value="plans-phase1">环节一被试方案</option>
            <option value="phase1-choices">环节一被试评分</option>
            <option value="plans-phase2">环节二作品</option>
            <option value="cse">CSE量表数据</option>
            <option value="expert-scores">研究一专家评分</option>
          </select>

          <label class="filter-label">被试编号/姓名</label>
          <input
            v-model="filters.keyword"
            type="text"
            class="filter-input"
            placeholder="模糊搜索"
          />

          <template v-if="filters.dataType === 'plans-phase1' || filters.dataType === 'expert-scores'">
            <label class="filter-label">专家姓名</label>
            <input
              v-model="filters.expertName"
              type="text"
              class="filter-input"
              placeholder="筛选专家姓名"
            />
          </template>
        </div>
      </aside>
      <section class="table-panel panel-border">

        <!-- 环节一被试方案（不含专家评分列） -->
        <template v-if="filters.dataType === 'plans-phase1'">
          <div v-if="plansPhase1.length === 0" class="empty-hint text-hint center">暂无符合条件的数据</div>
          <div v-else class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th :colspan="phase1ColumnsNoExpert.length + 1" class="text-table-head">研究一/环节一被试方案</th>
                </tr>
                <tr>
                  <th class="text-table-head th-checkbox">
                    <input type="checkbox" :checked="allPhase1PlansSelected" :indeterminate="somePhase1PlansSelected" @change="toggleAllPlans(paginatedPhase1)" />
                  </th>
                  <th
                    v-for="c in phase1ColumnsNoExpert"
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
                <tr v-for="r in paginatedPhase1" :key="r.id">
                  <td class="td-checkbox">
                    <input type="checkbox" :checked="selectedPlanIds.has(r.id)" @change="togglePlanId(r.id)" />
                  </td>
                  <td>{{ r.subject_id }}</td>
                  <td class="cell-name">{{ r.name || '—' }}</td>
                  <td class="cell-body cell-big-idea">{{ r.big_idea }}</td>
                  <td class="cell-body">{{ r.highlight_scene }}</td>
                  <td class="cell-body">{{ r.slogan }}</td>
                  <td>{{ formatBeijingTime(r.start_time) }}</td>
                  <td>{{ formatBeijingTime(r.end_time) }}</td>
                  <td>{{ formatBeijingTime(r.submitted_at) }}</td>
                  <td>{{ r.is_auto_saved ? '是' : '否' }}</td>
                  <td>{{ getChoice(r.subject_id) }}</td>
                </tr>
              </tbody>
            </table>
            <div v-if="phase1Total > pageSize" class="pagination text-score">
              <button type="button" class="page-btn" :disabled="page <= 1" @click="page = Math.max(1, page - 1)">上一页</button>
              <span>{{ page }} / {{ phase1TotalPages }}</span>
              <button type="button" class="page-btn" :disabled="page >= phase1TotalPages" @click="page = Math.min(phase1TotalPages, page + 1)">下一页</button>
            </div>
          </div>
        </template>

        <!-- 环节一被试评分（被试给自己作品和AI作品打分） -->
        <template v-else-if="filters.dataType === 'phase1-choices'">
          <div v-if="choices.length === 0" class="empty-hint text-hint center">暂无环节一评分数据</div>
          <div v-else class="table-wrap phase1-scores-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th :colspan="4 + 11 * 2" class="text-table-head">研究一/环节一被试评分（创造力评价11题）</th>
                </tr>
                <tr>
                  <th class="text-table-head th-checkbox">
                    <input type="checkbox" :checked="allChoicesSelected" :indeterminate="someChoicesSelected" @change="toggleAllChoices" />
                  </th>
                  <th class="text-table-head th-sort" @click="toggleSort('subject_id')">被试编号 <span v-if="sortKey === 'subject_id'" class="sort-icon">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span></th>
                  <th class="text-table-head">被试姓名</th>
                  <th class="text-table-head">最终提交作品</th>
                  <th v-for="n in 11" :key="n" colspan="2" class="text-table-head">题{{ n }}</th>
                </tr>
                <tr>
                  <th class="text-table-head"></th>
                  <th class="text-table-head"></th>
                  <th class="text-table-head"></th>
                  <th class="text-table-head"></th>
                  <template v-for="n in 11" :key="n">
                    <th class="text-table-head text-table-sub">您的作品</th>
                    <th class="text-table-head text-table-sub">AI作品</th>
                  </template>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in paginatedChoices" :key="r.subject_id">
                  <td class="td-checkbox">
                    <input type="checkbox" :checked="selectedChoiceSubjectIds.has(r.subject_id)" @change="toggleChoice(r.subject_id)" />
                  </td>
                  <td>{{ r.subject_id }}</td>
                  <td class="cell-name">{{ r.name || '—' }}</td>
                  <td>{{ r.chosen || '—' }}</td>
                  <template v-for="n in 11" :key="n">
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

        <!-- 环节二作品 -->
        <template v-else-if="filters.dataType === 'plans-phase2'">
          <div v-if="plansPhase2.length === 0" class="empty-hint text-hint center">暂无环节二作品数据</div>
          <div v-else class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th :colspan="phase2Columns.length + 1" class="text-table-head">研究一/环节二作品</th>
                </tr>
                <tr>
                  <th class="text-table-head th-checkbox">
                    <input type="checkbox" :checked="allPhase2PlansSelected" :indeterminate="somePhase2PlansSelected" @change="toggleAllPlans(paginatedPhase2)" />
                  </th>
                  <th
                    v-for="c in phase2Columns"
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
                <tr v-for="r in paginatedPhase2" :key="r.id">
                  <td class="td-checkbox">
                    <input type="checkbox" :checked="selectedPlanIds.has(r.id)" @change="togglePlanId(r.id)" />
                  </td>
                  <td>{{ r.subject_id }}</td>
                  <td class="cell-name">{{ r.name || '—' }}</td>
                  <td class="cell-body cell-big-idea">{{ r.big_idea }}</td>
                  <td class="cell-body">{{ r.highlight_scene }}</td>
                  <td class="cell-body">{{ r.slogan }}</td>
                  <td>{{ formatBeijingTime(r.start_time) }}</td>
                  <td>{{ formatBeijingTime(r.end_time) }}</td>
                  <td>{{ formatBeijingTime(r.submitted_at) }}</td>
                  <td>{{ r.is_auto_saved ? '是' : '否' }}</td>
                </tr>
              </tbody>
            </table>
            <div v-if="phase2Total > pageSize" class="pagination text-score">
              <button type="button" class="page-btn" :disabled="page <= 1" @click="page = Math.max(1, page - 1)">上一页</button>
              <span>{{ page }} / {{ phase2TotalPages }}</span>
              <button type="button" class="page-btn" :disabled="page >= phase2TotalPages" @click="page = Math.min(phase2TotalPages, page + 1)">下一页</button>
            </div>
          </div>
        </template>

        <!-- 研究一专家评分 -->
        <template v-else-if="filters.dataType === 'expert-scores'">
          <div v-if="expertScoreRows.length === 0" class="empty-hint text-hint center">暂无专家评分数据</div>
          <div v-else class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th :colspan="14" class="text-table-head">研究一/专家评分</th>
                </tr>
                <tr>
                  <th class="text-table-head th-sort" @click="toggleSort('subject_id')">被试编号 <span v-if="sortKey === 'subject_id'" class="sort-icon">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span></th>
                  <th class="text-table-head">被试姓名</th>
                  <th class="text-table-head th-sort" @click="toggleSort('expert_name')">专家姓名 <span v-if="sortKey === 'expert_name'" class="sort-icon">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span></th>
                  <th v-for="n in 11" :key="n" class="text-table-head">题{{ n }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in paginatedExpertScoreRows" :key="row.key">
                  <td>{{ row.subject_id }}</td>
                  <td class="cell-name">{{ row.subject_name || '—' }}</td>
                  <td>{{ row.expert_name || '—' }}</td>
                  <td v-for="n in 11" :key="n" class="text-score">{{ row['q' + n] != null ? row['q' + n] : '—' }}</td>
                </tr>
              </tbody>
            </table>
            <div v-if="expertScoreRowsTotal > pageSize" class="pagination text-score">
              <button type="button" class="page-btn" :disabled="page <= 1" @click="page = Math.max(1, page - 1)">上一页</button>
              <span>{{ page }} / {{ expertScoreRowsPages }}</span>
              <button type="button" class="page-btn" :disabled="page >= expertScoreRowsPages" @click="page = Math.min(expertScoreRowsPages, page + 1)">下一页</button>
            </div>
          </div>
        </template>

        <!-- CSE量表数据 -->
        <template v-else-if="filters.dataType === 'cse'">
          <div v-if="cseList.length === 0" class="empty-hint text-hint center">暂无CSE量表数据</div>
          <div v-else class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th :colspan="7" class="text-table-head">研究一/CSE量表数据</th>
                </tr>
                <tr>
                  <th class="text-table-head th-checkbox">
                    <input type="checkbox" :checked="allCseSelected" :indeterminate="someCseSelected" @change="toggleAllCse" />
                  </th>
                  <th class="text-table-head th-sort" @click="toggleSort('subject_id')">被试编号 <span v-if="sortKey === 'subject_id'" class="sort-icon">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span></th>
                  <th class="text-table-head">被试姓名</th>
                  <th class="text-table-head">题1</th>
                  <th class="text-table-head">题2</th>
                  <th class="text-table-head">题3</th>
                  <th class="text-table-head">题4</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, idx) in paginatedCse" :key="r.id != null ? r.id : 'cse-' + r.subject_id + '-' + idx">
                  <td class="td-checkbox">
                    <input type="checkbox" :checked="selectedCseIds.has(r.id != null ? r.id : 'cse-' + r.subject_id + '-' + idx)" @change="toggleCse(r.id != null ? r.id : 'cse-' + r.subject_id + '-' + idx)" />
                  </td>
                  <td>{{ r.subject_id }}</td>
                  <td class="cell-name">{{ r.name || '—' }}</td>
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

      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { formatBeijingTime } from '../../utils/formatBeijingTime.js';

const filters = ref({
  dataType: 'plans-phase1',
  keyword: '',
  expertName: '',
});

const plansPhase1 = ref([]);
const plansPhase2 = ref([]);
const choices = ref([]);
const cseList = ref([]);
const expertScores = ref([]);
const sortKey = ref('');
const sortOrder = ref('asc');
const page = ref(1);
const pageSize = 20;
const selectedPlanIds = ref(new Set());
const selectedCseIds = ref(new Set());
const selectedChoiceSubjectIds = ref(new Set());

const phase1Columns = [
  { key: 'subject_id', label: '被试编号' },
  { key: 'name', label: '被试姓名' },
  { key: 'big_idea', label: '核心创意点与设定' },
  { key: 'highlight_scene', label: '高光画面描述' },
  { key: 'slogan', label: '主打广告语' },
  { key: 'start_time', label: '开始时间' },
  { key: 'end_time', label: '结束时间' },
  { key: 'submitted_at', label: '提交时间' },
  { key: 'is_auto_saved', label: '是否自动保存' },
  { key: 'chosen', label: '提交选择(个人/AI)' },
  { key: 'expert_scores', label: '专家评分' },
];
const phase1ColumnsNoExpert = phase1Columns.filter((c) => c.key !== 'expert_scores');
const phase2Columns = [
  { key: 'subject_id', label: '被试编号' },
  { key: 'name', label: '被试姓名' },
  { key: 'big_idea', label: '核心创意点与设定' },
  { key: 'highlight_scene', label: '高光画面描述' },
  { key: 'slogan', label: '主打广告语' },
  { key: 'start_time', label: '开始时间' },
  { key: 'end_time', label: '结束时间' },
  { key: 'submitted_at', label: '提交时间' },
  { key: 'is_auto_saved', label: '是否自动保存' },
];

// --- Export URLs ---
const exportPlansPhase1Url = computed(() => {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  q.set('phase', '环节一');
  return `/api/admin/export/study1-plans?${q.toString()}`;
});
const exportPlansPhase2Url = computed(() => {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  q.set('phase', '环节二');
  return `/api/admin/export/study1-plans?${q.toString()}`;
});
const exportCseUrl = computed(() => {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  return `/api/admin/export/study1-cse?${q.toString()}`;
});
const exportPhase1ScoresUrl = computed(() => {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  return `/api/admin/export/study1-phase1-scores?${q.toString()}`;
});
const exportExpertScoresUrl = computed(() => {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  if (filters.value.expertName) q.set('expertName', filters.value.expertName);
  return `/api/admin/export/study1-expert-scores?${q.toString()}`;
});

// --- Fetch functions ---
function fetchPlansPhase1() {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  q.set('phase', '环节一');
  fetch(`/api/admin/study1/plans?${q.toString()}`)
    .then((r) => r.json())
    .then((data) => { plansPhase1.value = Array.isArray(data) ? data : []; })
    .catch(() => { plansPhase1.value = []; });
}
function fetchPlansPhase2() {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  q.set('phase', '环节二');
  fetch(`/api/admin/study1/plans?${q.toString()}`)
    .then((r) => r.json())
    .then((data) => { plansPhase2.value = Array.isArray(data) ? data : []; })
    .catch(() => { plansPhase2.value = []; });
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
    .then((r) => r.ok ? r.json() : [])
    .then((data) => { cseList.value = Array.isArray(data) ? data : []; })
    .catch(() => { cseList.value = []; });
}
function fetchExpertScores() {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  if (filters.value.expertName) q.set('expertName', filters.value.expertName);
  fetch(`/api/admin/study1/expert-scores?${q.toString()}`)
    .then((r) => r.json())
    .then((data) => { expertScores.value = Array.isArray(data) ? data : []; })
    .catch(() => { expertScores.value = []; });
}

watch(
  () => [filters.value.keyword, filters.value.dataType, filters.value.expertName],
  () => {
    page.value = 1;
    sortKey.value = '';
    selectedPlanIds.value = new Set();
    selectedCseIds.value = new Set();
    selectedChoiceSubjectIds.value = new Set();
    if (filters.value.dataType === 'plans-phase1') {
      fetchPlansPhase1();
      fetchChoices();
      fetchExpertScores();
    } else if (filters.value.dataType === 'phase1-choices') {
      fetchChoices();
    } else if (filters.value.dataType === 'plans-phase2') {
      fetchPlansPhase2();
    } else if (filters.value.dataType === 'cse') {
      fetchCse();
    } else if (filters.value.dataType === 'expert-scores') {
      fetchExpertScores();
    }
  },
  { immediate: true }
);

// --- Choice helpers ---
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

// --- Expert score summary per subject ---
const expertScoresBySubject = computed(() => {
  const map = {};
  for (const s of expertScores.value) {
    const sid = String(s.subject_id ?? '');
    if (!map[sid]) map[sid] = [];
    map[sid].push(s);
  }
  return map;
});

// --- 研究一专家评分表格：按 (subject_id, expert_name) 聚合成行，列为题1..题11 ---
const expertScoreRows = computed(() => {
  const list = expertScores.value;
  const keyed = {};
  for (const r of list) {
    const k = `${r.subject_id}\t${r.expert_name || ''}`;
    if (!keyed[k]) {
      keyed[k] = {
        key: k,
        subject_id: r.subject_id,
        subject_name: r.subject_name ?? '',
        expert_name: r.expert_name ?? '',
        q1: null, q2: null, q3: null, q4: null, q5: null, q6: null, q7: null, q8: null, q9: null, q10: null, q11: null,
      };
    }
    const no = Number(r.question_no);
    if (no >= 1 && no <= 11) keyed[k]['q' + no] = r.score;
  }
  return Object.values(keyed);
});
const sortedExpertScoreRows = computed(() => sortList(expertScoreRows.value));
const expertScoreRowsTotal = computed(() => sortedExpertScoreRows.value.length);
const expertScoreRowsPages = computed(() => Math.max(1, Math.ceil(expertScoreRowsTotal.value / pageSize)));
const paginatedExpertScoreRows = computed(() =>
  sortedExpertScoreRows.value.slice((page.value - 1) * pageSize, page.value * pageSize)
);
function getExpertScoreSummary(subjectId) {
  const sid = String(subjectId ?? '');
  const rows = expertScoresBySubject.value[sid];
  if (!rows || rows.length === 0) return '—';
  const byExpert = {};
  for (const r of rows) {
    const en = r.expert_name || '未知';
    if (!byExpert[en]) byExpert[en] = [];
    byExpert[en].push(r);
  }
  const parts = [];
  for (const [expert, scores] of Object.entries(byExpert)) {
    const avg = scores.reduce((s, r) => s + (r.score || 0), 0) / scores.length;
    const inv = scores.some((r) => r.is_invalid);
    parts.push(`${expert}: ${avg.toFixed(1)}${inv ? '(无效)' : ''}`);
  }
  return parts.join('; ');
}

// --- Phase1 scores ---
function parseScoresJson(ch) {
  if (!ch || !ch.scores_json) return null;
  try {
    const data = typeof ch.scores_json === 'string' ? JSON.parse(ch.scores_json) : ch.scores_json;
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}
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

// --- Sorting ---
function sortList(arr) {
  if (!sortKey.value) return arr;
  const key = sortKey.value;
  const sorted = [...arr];
  sorted.sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va ?? '').localeCompare(String(vb ?? ''), 'zh');
    return sortOrder.value === 'asc' ? cmp : -cmp;
  });
  return sorted;
}
function toggleSort(key) {
  if (sortKey.value === key) sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  else { sortKey.value = key; sortOrder.value = 'asc'; }
}

// --- Phase1 plans ---
const sortedPhase1 = computed(() => sortList(plansPhase1.value));
const phase1Total = computed(() => sortedPhase1.value.length);
const phase1TotalPages = computed(() => Math.max(1, Math.ceil(phase1Total.value / pageSize)));
const paginatedPhase1 = computed(() => sortedPhase1.value.slice((page.value - 1) * pageSize, page.value * pageSize));
const allPhase1PlansSelected = computed(() => paginatedPhase1.value.length > 0 && paginatedPhase1.value.every((r) => selectedPlanIds.value.has(r.id)));
const somePhase1PlansSelected = computed(() => paginatedPhase1.value.some((r) => selectedPlanIds.value.has(r.id)) && !allPhase1PlansSelected.value);

// --- Phase2 plans ---
const sortedPhase2 = computed(() => sortList(plansPhase2.value));
const phase2Total = computed(() => sortedPhase2.value.length);
const phase2TotalPages = computed(() => Math.max(1, Math.ceil(phase2Total.value / pageSize)));
const paginatedPhase2 = computed(() => sortedPhase2.value.slice((page.value - 1) * pageSize, page.value * pageSize));
const allPhase2PlansSelected = computed(() => paginatedPhase2.value.length > 0 && paginatedPhase2.value.every((r) => selectedPlanIds.value.has(r.id)));
const somePhase2PlansSelected = computed(() => paginatedPhase2.value.some((r) => selectedPlanIds.value.has(r.id)) && !allPhase2PlansSelected.value);

// --- CSE ---
const sortedCse = computed(() => sortList(cseList.value));
const cseTotal = computed(() => sortedCse.value.length);
const cseTotalPages = computed(() => Math.max(1, Math.ceil(cseTotal.value / pageSize)));
const paginatedCse = computed(() => sortedCse.value.slice((page.value - 1) * pageSize, page.value * pageSize));
const allCseSelected = computed(() => paginatedCse.value.length > 0 && paginatedCse.value.every((r) => selectedCseIds.value.has(r.id != null ? r.id : 'cse-' + r.subject_id)));
const someCseSelected = computed(() => paginatedCse.value.some((r) => selectedCseIds.value.has(r.id != null ? r.id : 'cse-' + r.subject_id)) && !allCseSelected.value);

// --- Choices ---
const sortedChoices = computed(() => sortList(choices.value));
const choicesTotal = computed(() => sortedChoices.value.length);
const choicesTotalPages = computed(() => Math.max(1, Math.ceil(choicesTotal.value / pageSize)));
const paginatedChoices = computed(() => sortedChoices.value.slice((page.value - 1) * pageSize, page.value * pageSize));
const allChoicesSelected = computed(() => paginatedChoices.value.length > 0 && paginatedChoices.value.every((r) => selectedChoiceSubjectIds.value.has(r.subject_id)));
const someChoicesSelected = computed(() => paginatedChoices.value.some((r) => selectedChoiceSubjectIds.value.has(r.subject_id)) && !allChoicesSelected.value);

// --- Selection & deletion ---
function togglePlanId(id) {
  const set = new Set(selectedPlanIds.value);
  if (set.has(id)) set.delete(id); else set.add(id);
  selectedPlanIds.value = set;
}
function toggleAllPlans(paginated) {
  if (paginated.every((r) => selectedPlanIds.value.has(r.id))) selectedPlanIds.value = new Set();
  else selectedPlanIds.value = new Set(paginated.map((r) => r.id));
}
function deleteSelectedPlans() {
  if (selectedPlanIds.value.size === 0) return;
  if (!confirm(`确定删除选中的 ${selectedPlanIds.value.size} 条方案记录吗？`)) return;
  fetch('/api/admin/study1/plans', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: [...selectedPlanIds.value] }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.ok) {
        selectedPlanIds.value = new Set();
        if (filters.value.dataType === 'plans-phase1') fetchPlansPhase1();
        else fetchPlansPhase2();
      }
    })
    .catch(() => {});
}

function toggleCse(id) {
  const set = new Set(selectedCseIds.value);
  if (set.has(id)) set.delete(id); else set.add(id);
  selectedCseIds.value = set;
}
function toggleAllCse() {
  if (allCseSelected.value) selectedCseIds.value = new Set();
  else selectedCseIds.value = new Set(paginatedCse.value.map((r) => r.id != null ? r.id : 'cse-' + r.subject_id));
}
function deleteSelectedCseData() {
  if (selectedCseIds.value.size === 0) return;
  if (!confirm(`确定删除选中的 ${selectedCseIds.value.size} 条CSE量表数据吗？`)) return;
  const validIds = [...selectedCseIds.value].filter(id => typeof id === 'number' || !isNaN(Number(id))).map(Number);
  fetch('/api/admin/study1/cse', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: validIds }),
  })
    .then((r) => r.json())
    .then((data) => { if (data.ok) { selectedCseIds.value = new Set(); fetchCse(); } })
    .catch(() => {});
}

function toggleChoice(subjectId) {
  const set = new Set(selectedChoiceSubjectIds.value);
  if (set.has(subjectId)) set.delete(subjectId); else set.add(subjectId);
  selectedChoiceSubjectIds.value = set;
}
function toggleAllChoices() {
  if (allChoicesSelected.value) selectedChoiceSubjectIds.value = new Set();
  else selectedChoiceSubjectIds.value = new Set(paginatedChoices.value.map((r) => r.subject_id));
}
function deleteSelectedPhase1Choices() {
  if (selectedChoiceSubjectIds.value.size === 0) return;
  if (!confirm(`确定删除选中的 ${selectedChoiceSubjectIds.value.size} 条环节一评分记录吗？`)) return;
  fetch('/api/admin/study1/phase1-choices', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject_ids: [...selectedChoiceSubjectIds.value] }),
  })
    .then((r) => r.json())
    .then((data) => { if (data.ok) { selectedChoiceSubjectIds.value = new Set(); fetchChoices(); } })
    .catch(() => {});
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
.btn-primary.btn-danger { background: #c62828; }
.btn-primary.btn-danger:hover:not(:disabled) { background: #b71c1c; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
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
  background: #B8D4E8;
  color: #333;
  font-weight: 500;
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 1;
  font-family: "SimSun", "Songti SC", serif;
}
.data-table td.cell-body { white-space: pre-wrap; word-break: break-word; }
.data-table td.cell-big-idea { white-space: pre-wrap; word-break: break-word; }
.data-table td.cell-expert-scores { white-space: pre-wrap; word-break: break-word; min-width: 200px; }
.cell-name { min-width: 4em; word-break: keep-all; overflow-wrap: normal; }
.th-sort { cursor: pointer; }
.th-checkbox, .td-checkbox { width: 36px; text-align: center; vertical-align: middle; }
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
