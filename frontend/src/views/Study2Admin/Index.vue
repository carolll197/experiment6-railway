<template>
  <div class="admin-wrap">
    <header class="top-bar panel-border">
      <h1 class="text-h1 left">广告创意研究实验数据管理平台（研究二）</h1>
      <div class="top-actions">
        <template v-if="filters.dataType === 'plans'">
          <a :href="exportPlansUrl" class="btn-primary" download>导出方案</a>
          <button type="button" class="btn-primary btn-danger" :disabled="selectedIds.size === 0" @click="deleteSelected">批量删除选中</button>
        </template>
        <template v-else-if="filters.dataType === 'cse'">
          <a :href="exportCseUrl" class="btn-primary" download>导出CSE量表</a>
          <button type="button" class="btn-primary btn-danger" :disabled="selectedIds.size === 0" @click="deleteSelected">批量删除选中</button>
        </template>
        <template v-else-if="filters.dataType === 'posttest'">
          <a :href="exportPosttestUrl" class="btn-primary" download>导出后测量表</a>
          <button type="button" class="btn-primary btn-danger" :disabled="selectedIds.size === 0" @click="deleteSelected">批量删除选中</button>
        </template>
        <template v-else-if="filters.dataType === 'chatlogs'">
          <a :href="exportChatlogsUrl" class="btn-primary" download>导出对话记录</a>
          <a :href="exportChatlogsFullUrl" class="btn-primary" download>导出完整对话记录</a>
          <button type="button" class="btn-primary btn-danger" :disabled="selectedIds.size === 0" @click="deleteSelected">批量删除选中</button>
        </template>
        <template v-else-if="filters.dataType === 'resultAiPlans'">
          <a :href="exportResultAiPlansUrl" class="btn-primary" download>导出结果组AI方案详情</a>
          <button type="button" class="btn-primary btn-danger" :disabled="selectedIds.size === 0" @click="deleteSelected">批量删除选中</button>
        </template>
      </div>
    </header>
    <div class="main-grid">
      <aside class="filter-panel panel-border">
        <h2 class="text-h2 center">数据筛选（研究二）</h2>
        <div class="filter-form">
          <label class="filter-label">数据类型</label>
          <select v-model="filters.dataType" class="filter-select">
            <option value="plans">被试方案</option>
            <option value="cse">CSE量表数据</option>
            <option value="posttest">后测量表数据</option>
            <option value="chatlogs">对话记录（过程组）</option>
            <option value="resultAiPlans">结果组AI方案详情</option>
          </select>

          <template v-if="filters.dataType !== 'chatlogs' && filters.dataType !== 'resultAiPlans'">
            <label class="filter-label">组别</label>
            <select v-model="filters.groupType" class="filter-select">
              <option value="">全部</option>
              <option value="process">过程组</option>
              <option value="result">结果组</option>
            </select>
          </template>

          <label class="filter-label">被试编号/姓名</label>
          <input v-model="filters.keyword" type="text" class="filter-input" placeholder="模糊搜索" />

          <template v-if="filters.dataType === 'posttest'">
            <label class="filter-label">量表变量</label>
            <select v-model="filters.variable" class="filter-select">
              <option value="">全部</option>
              <option value="emotion">情绪</option>
              <option value="gap">期望落差</option>
              <option value="effort">感知认知努力</option>
              <option value="ownership">心理所有权</option>
              <option value="control">控制感</option>
            </select>
          </template>
        </div>
      </aside>
      <section class="table-panel panel-border">

        <!-- 被试方案 -->
        <template v-if="filters.dataType === 'plans'">
          <div v-if="plans.length === 0" class="empty-hint text-hint center">暂无符合条件的数据</div>
          <div v-else class="table-wrap">
            <table class="data-table">
              <thead>
                <tr><th :colspan="planCols.length + 1" class="text-table-head">研究二/被试方案</th></tr>
                <tr>
                  <th class="text-table-head th-checkbox"><input type="checkbox" :checked="allSelected" :indeterminate="someSelected" @change="toggleAll(paginatedPlans)" /></th>
                  <th v-for="c in planCols" :key="c.key" class="text-table-head th-sort" @click="toggleSort(c.key)">
                    {{ c.label }} <span v-if="sortKey === c.key" class="sort-icon">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in paginatedPlans" :key="r.id">
                  <td class="td-checkbox"><input type="checkbox" :checked="selectedIds.has(r.id)" @change="toggleId(r.id)" /></td>
                  <td>{{ r.subject_id }}</td>
                  <td class="cell-name">{{ r.display_name || r.name || '—' }}</td>
                  <td>{{ r.group_type === 'process' ? '过程组' : '结果组' }}</td>
                  <td class="cell-body cell-big-idea">{{ r.big_idea }}</td>
                  <td class="cell-body">{{ r.highlight_scene }}</td>
                  <td class="cell-body">{{ r.slogan }}</td>
                  <td>{{ fmt(r.start_time) }}</td>
                  <td>{{ fmt(r.ai_done_time) }}</td>
                  <td>{{ fmt(r.end_time) }}</td>
                  <td>{{ fmt(r.submitted_at) }}</td>
                  <td>{{ r.is_auto_saved ? '是' : '否' }}</td>
                </tr>
              </tbody>
            </table>
            <div v-if="totalPlans > pageSize" class="pagination text-score">
              <button type="button" class="page-btn" :disabled="page <= 1" @click="page--">上一页</button>
              <span>{{ page }} / {{ totalPlanPages }}</span>
              <button type="button" class="page-btn" :disabled="page >= totalPlanPages" @click="page++">下一页</button>
            </div>
          </div>
        </template>

        <!-- CSE -->
        <template v-else-if="filters.dataType === 'cse'">
          <div v-if="cseList.length === 0" class="empty-hint text-hint center">暂无CSE量表数据</div>
          <div v-else class="table-wrap">
            <table class="data-table">
              <thead>
                <tr><th :colspan="8" class="text-table-head">研究二/CSE量表数据</th></tr>
                <tr>
                  <th class="text-table-head th-checkbox"><input type="checkbox" :checked="allCseSelected" :indeterminate="someCseSelected" @change="toggleAllCse" /></th>
                  <th class="text-table-head">被试编号</th><th class="text-table-head">被试姓名</th><th class="text-table-head">组别</th>
                  <th class="text-table-head">题1</th><th class="text-table-head">题2</th><th class="text-table-head">题3</th><th class="text-table-head">题4</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in paginatedCse" :key="r.id">
                  <td class="td-checkbox"><input type="checkbox" :checked="selectedIds.has(r.id)" @change="toggleId(r.id)" /></td>
                  <td>{{ r.subject_id }}</td>
                  <td class="cell-name">{{ r.display_name || '—' }}</td>
                  <td>{{ r.group_type === 'process' ? '过程组' : '结果组' }}</td>
                  <td class="text-score">{{ r.q1 ?? '—' }}</td><td class="text-score">{{ r.q2 ?? '—' }}</td>
                  <td class="text-score">{{ r.q3 ?? '—' }}</td><td class="text-score">{{ r.q4 ?? '—' }}</td>
                </tr>
              </tbody>
            </table>
            <div v-if="totalCse > pageSize" class="pagination text-score">
              <button type="button" class="page-btn" :disabled="page <= 1" @click="page--">上一页</button>
              <span>{{ page }} / {{ totalCsePages }}</span>
              <button type="button" class="page-btn" :disabled="page >= totalCsePages" @click="page++">下一页</button>
            </div>
          </div>
        </template>

        <!-- 后测量表 -->
        <template v-else-if="filters.dataType === 'posttest'">
          <div v-if="posttest.length === 0" class="empty-hint text-hint center">暂无后测量表数据</div>
          <div v-else class="table-wrap">
            <table class="data-table">
              <thead>
                <tr><th :colspan="filteredPostCols.length + 1" class="text-table-head">研究二/后测量表</th></tr>
                <tr>
                  <th class="text-table-head th-checkbox"><input type="checkbox" :checked="allPostSelected" :indeterminate="somePostSelected" @change="toggleAllPost" /></th>
                  <th v-for="c in filteredPostCols" :key="c.key" class="text-table-head">{{ c.label }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in paginatedPost" :key="r.id">
                  <td class="td-checkbox"><input type="checkbox" :checked="selectedIds.has(r.id)" @change="toggleId(r.id)" /></td>
                  <td>{{ r.subject_id }}</td>
                  <td class="cell-name">{{ r.display_name || '—' }}</td>
                  <td>{{ r.group_type === 'process' ? '过程组' : '结果组' }}</td>
                  <template v-for="c in filteredPostVarCols" :key="c.key">
                    <td class="text-score">{{ r[c.key] ?? '—' }}</td>
                  </template>
                </tr>
              </tbody>
            </table>
            <div v-if="totalPost > pageSize" class="pagination text-score">
              <button type="button" class="page-btn" :disabled="page <= 1" @click="page--">上一页</button>
              <span>{{ page }} / {{ totalPostPages }}</span>
              <button type="button" class="page-btn" :disabled="page >= totalPostPages" @click="page++">下一页</button>
            </div>
          </div>
        </template>

        <!-- 对话记录 -->
        <template v-else-if="filters.dataType === 'chatlogs'">
          <div v-if="chatLogs.length === 0" class="empty-hint text-hint center">暂无对话记录</div>
          <div v-else class="table-wrap">
            <table class="data-table">
              <thead>
                <tr><th :colspan="13" class="text-table-head">研究二/过程组对话记录</th></tr>
                <tr>
                  <th class="text-table-head th-checkbox"><input type="checkbox" :checked="allChatSelected" :indeterminate="someChatSelected" @change="toggleAllChats" /></th>
                  <th class="text-table-head">被试编号</th><th class="text-table-head">被试姓名</th>
                  <th class="text-table-head">第1轮输入</th><th class="text-table-head">第2轮输入</th><th class="text-table-head">第3轮输入</th><th class="text-table-head">第4轮输入</th><th class="text-table-head">第5轮输入</th>
                  <th class="text-table-head">互动轮次</th><th class="text-table-head">用户输入字数</th><th class="text-table-head">AI提问次数</th><th class="text-table-head">用户选择次数</th>
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
                  <td class="text-score">{{ r.interaction_rounds ?? '—' }}</td>
                  <td class="text-score">{{ r.user_input_chars ?? '—' }}</td>
                  <td class="text-score">{{ r.ai_ask_count ?? '—' }}</td>
                  <td class="text-score">{{ r.user_choice_count ?? '—' }}</td>
                  <td><button type="button" class="btn-link" @click="showChat(r)">查看</button></td>
                  <td><button type="button" class="btn-link" :disabled="!hasAiPlan(r)" @click="showAiPlan(r)">查看</button></td>
                </tr>
              </tbody>
            </table>
            <div v-if="totalChats > pageSize" class="pagination text-score">
              <button type="button" class="page-btn" :disabled="page <= 1" @click="page--">上一页</button>
              <span>{{ page }} / {{ totalChatPages }}</span>
              <button type="button" class="page-btn" :disabled="page >= totalChatPages" @click="page++">下一页</button>
            </div>
          </div>
        </template>

        <!-- 结果组AI方案详情 -->
        <template v-else-if="filters.dataType === 'resultAiPlans'">
          <div v-if="resultAiPlans.length === 0" class="empty-hint text-hint center">暂无结果组AI方案数据</div>
          <div v-else class="table-wrap">
            <table class="data-table">
              <thead>
                <tr><th :colspan="9" class="text-table-head">研究二/结果组AI方案详情</th></tr>
                <tr>
                  <th class="text-table-head th-checkbox"><input type="checkbox" :checked="allResultAiSelected" :indeterminate="someResultAiSelected" @change="toggleAllResultAi" /></th>
                  <th class="text-table-head">结果组被试编号</th><th class="text-table-head">结果组被试姓名</th>
                  <th class="text-table-head">抽到的过程组被试编号</th><th class="text-table-head">抽到的过程组被试姓名</th>
                  <th class="text-table-head">AI方案-核心创意点</th><th class="text-table-head">AI方案-高光画面</th><th class="text-table-head">AI方案-主打广告语</th>
                  <th class="text-table-head">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in paginatedResultAiPlans" :key="r.id">
                  <td class="td-checkbox"><input type="checkbox" :checked="selectedIds.has(r.id)" @change="toggleId(r.id)" /></td>
                  <td>{{ r.subject_id }}</td>
                  <td class="cell-name">{{ r.display_name || r.name || '—' }}</td>
                  <td>{{ r.assigned_plan_subject_id || '—' }}</td>
                  <td class="cell-name">{{ r.assigned_plan_name || '—' }}</td>
                  <td class="cell-body cell-big-idea">{{ r.ai_big_idea || '—' }}</td>
                  <td class="cell-body">{{ r.ai_highlight_scene || '—' }}</td>
                  <td class="cell-body">{{ r.ai_slogan || '—' }}</td>
                  <td><button type="button" class="btn-link" @click="showResultAiPlanDetail(r)">查看详情</button></td>
                </tr>
              </tbody>
            </table>
            <div v-if="totalResultAiPlans > pageSize" class="pagination text-score">
              <button type="button" class="page-btn" :disabled="page <= 1" @click="page--">上一页</button>
              <span>{{ page }} / {{ totalResultAiPlansPages }}</span>
              <button type="button" class="page-btn" :disabled="page >= totalResultAiPlansPages" @click="page++">下一页</button>
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

    <!-- AI输出方案弹窗 -->
    <div v-if="aiPlanModalVisible" class="modal-overlay" @click.self="aiPlanModalVisible = false">
      <div class="modal-box">
        <h3 class="text-h2">AI输出方案 - {{ aiPlanModalData.subject_id }}</h3>
        <div class="ai-plan-body">
          <p class="ai-plan-label">模块1：核心创意与设定</p>
          <p class="ai-plan-text">{{ aiPlanModalData.ai_big_idea || '—' }}</p>
          <p class="ai-plan-label">模块2：高光画面描述</p>
          <p class="ai-plan-text">{{ aiPlanModalData.ai_highlight_scene || '—' }}</p>
          <p class="ai-plan-label">模块3：主打广告语</p>
          <p class="ai-plan-text">{{ aiPlanModalData.ai_slogan || '—' }}</p>
        </div>
        <div style="text-align: right; margin-top: 12px;"><button type="button" class="btn-primary" @click="aiPlanModalVisible = false">关闭</button></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const filters = ref({ dataType: 'plans', groupType: '', keyword: '', variable: '' });
const plans = ref([]);
const cseList = ref([]);
const posttest = ref([]);
const chatLogs = ref([]);
const resultAiPlans = ref([]);
const sortKey = ref('');
const sortOrder = ref('asc');
const page = ref(1);
const pageSize = 20;
const selectedIds = ref(new Set());

const chatModalVisible = ref(false);
const chatModalData = ref({});
const chatModalMessages = ref([]);
const aiPlanModalVisible = ref(false);
const aiPlanModalData = ref({});

const planCols = [
  { key: 'subject_id', label: '被试编号' }, { key: 'name', label: '被试姓名' }, { key: 'group_type', label: '组别' },
  { key: 'big_idea', label: '核心创意点与设定' }, { key: 'highlight_scene', label: '高光画面描述' }, { key: 'slogan', label: '主打广告语' },
  { key: 'start_time', label: '开始时间' }, { key: 'ai_done_time', label: 'AI方案生成时间' }, { key: 'end_time', label: '结束时间' },
  { key: 'submitted_at', label: '提交时间' }, { key: 'is_auto_saved', label: '是否自动保存' },
];

const allPostVarCols = [
  { key: 'emotion_1', label: '情绪1-轻松', group: 'emotion' }, { key: 'emotion_2', label: '情绪2-满意', group: 'emotion' },
  { key: 'emotion_3', label: '情绪3-沮丧', group: 'emotion' }, { key: 'emotion_4', label: '情绪4-失望', group: 'emotion' },
  { key: 'emotion_5', label: '情绪5-愤怒', group: 'emotion' },
  { key: 'gap_1', label: '期望落差1', group: 'gap' }, { key: 'gap_2', label: '期望落差2', group: 'gap' },
  { key: 'effort_1', label: '认知努力1', group: 'effort' }, { key: 'effort_2', label: '认知努力2', group: 'effort' },
  { key: 'ownership_1', label: '所有权1', group: 'ownership' }, { key: 'ownership_2', label: '所有权2', group: 'ownership' },
  { key: 'ownership_3', label: '所有权3', group: 'ownership' }, { key: 'ownership_4', label: '所有权4', group: 'ownership' },
  { key: 'control_1', label: '控制感1', group: 'control' }, { key: 'control_2', label: '控制感2', group: 'control' },
  { key: 'control_3', label: '控制感3', group: 'control' },
];
const baseCols = [{ key: 'subject_id', label: '被试编号' }, { key: 'display_name', label: '被试姓名' }, { key: 'group_type', label: '组别' }];
const filteredPostVarCols = computed(() => {
  if (!filters.value.variable) return allPostVarCols;
  return allPostVarCols.filter((c) => c.group === filters.value.variable);
});
const filteredPostCols = computed(() => [...baseCols, ...filteredPostVarCols.value]);

function fmt(t) {
  if (!t) return '—';
  try {
    const d = new Date(t);
    if (isNaN(d.getTime())) return t;
    return d.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
  } catch { return t; }
}

function toggleSort(key) {
  if (sortKey.value === key) sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  else { sortKey.value = key; sortOrder.value = 'asc'; }
}

function sortList(arr) {
  if (!sortKey.value) return arr;
  const key = sortKey.value;
  return [...arr].sort((a, b) => {
    const va = a[key]; const vb = b[key];
    const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va ?? '').localeCompare(String(vb ?? ''), 'zh');
    return sortOrder.value === 'asc' ? cmp : -cmp;
  });
}

function toggleId(id) { const s = new Set(selectedIds.value); if (s.has(id)) s.delete(id); else s.add(id); selectedIds.value = s; }
function toggleAll(rows) {
  if (rows.every((r) => selectedIds.value.has(r.id))) selectedIds.value = new Set();
  else selectedIds.value = new Set(rows.map((r) => r.id));
}

// Plans
const sortedPlans = computed(() => sortList(plans.value));
const totalPlans = computed(() => sortedPlans.value.length);
const totalPlanPages = computed(() => Math.max(1, Math.ceil(totalPlans.value / pageSize)));
const paginatedPlans = computed(() => sortedPlans.value.slice((page.value - 1) * pageSize, page.value * pageSize));
const allSelected = computed(() => paginatedPlans.value.length > 0 && paginatedPlans.value.every((r) => selectedIds.value.has(r.id)));
const someSelected = computed(() => paginatedPlans.value.some((r) => selectedIds.value.has(r.id)) && !allSelected.value);

// CSE
const sortedCse = computed(() => sortList(cseList.value));
const totalCse = computed(() => sortedCse.value.length);
const totalCsePages = computed(() => Math.max(1, Math.ceil(totalCse.value / pageSize)));
const paginatedCse = computed(() => sortedCse.value.slice((page.value - 1) * pageSize, page.value * pageSize));
const allCseSelected = computed(() => paginatedCse.value.length > 0 && paginatedCse.value.every((r) => selectedIds.value.has(r.id)));
const someCseSelected = computed(() => paginatedCse.value.some((r) => selectedIds.value.has(r.id)) && !allCseSelected.value);
function toggleAllCse() { toggleAll(paginatedCse.value); }

// Posttest
const sortedPost = computed(() => sortList(posttest.value));
const totalPost = computed(() => sortedPost.value.length);
const totalPostPages = computed(() => Math.max(1, Math.ceil(totalPost.value / pageSize)));
const paginatedPost = computed(() => sortedPost.value.slice((page.value - 1) * pageSize, page.value * pageSize));
const allPostSelected = computed(() => paginatedPost.value.length > 0 && paginatedPost.value.every((r) => selectedIds.value.has(r.id)));
const somePostSelected = computed(() => paginatedPost.value.some((r) => selectedIds.value.has(r.id)) && !allPostSelected.value);
function toggleAllPost() { toggleAll(paginatedPost.value); }

// Chat logs
const totalChats = computed(() => chatLogs.value.length);
const totalChatPages = computed(() => Math.max(1, Math.ceil(totalChats.value / pageSize)));
const paginatedChats = computed(() => chatLogs.value.slice((page.value - 1) * pageSize, page.value * pageSize));
const allChatSelected = computed(() => paginatedChats.value.length > 0 && paginatedChats.value.every((r) => selectedIds.value.has(r.id)));
const someChatSelected = computed(() => paginatedChats.value.some((r) => selectedIds.value.has(r.id)) && !allChatSelected.value);
function toggleAllChats() {
  if (paginatedChats.value.every((r) => selectedIds.value.has(r.id))) selectedIds.value = new Set();
  else selectedIds.value = new Set(paginatedChats.value.map((r) => r.id));
}

// Result group AI plans
const totalResultAiPlans = computed(() => resultAiPlans.value.length);
const totalResultAiPlansPages = computed(() => Math.max(1, Math.ceil(totalResultAiPlans.value / pageSize)));
const paginatedResultAiPlans = computed(() => resultAiPlans.value.slice((page.value - 1) * pageSize, page.value * pageSize));
const allResultAiSelected = computed(() => paginatedResultAiPlans.value.length > 0 && paginatedResultAiPlans.value.every((r) => selectedIds.value.has(r.id)));
const someResultAiSelected = computed(() => paginatedResultAiPlans.value.some((r) => selectedIds.value.has(r.id)) && !allResultAiSelected.value);
function toggleAllResultAi() {
  if (paginatedResultAiPlans.value.every((r) => selectedIds.value.has(r.id))) selectedIds.value = new Set();
  else selectedIds.value = new Set(paginatedResultAiPlans.value.map((r) => r.id));
}
function showResultAiPlanDetail(row) {
  aiPlanModalData.value = {
    subject_id: row.subject_id,
    ai_big_idea: row.ai_big_idea || '',
    ai_highlight_scene: row.ai_highlight_scene || '',
    ai_slogan: row.ai_slogan || '',
  };
  aiPlanModalVisible.value = true;
}

function showChat(row) {
  chatModalData.value = row;
  chatModalMessages.value = row.messages || [];
  chatModalVisible.value = true;
}
function hasAiPlan(row) {
  return (row.ai_big_idea && row.ai_big_idea.trim()) || (row.ai_highlight_scene && row.ai_highlight_scene.trim()) || (row.ai_slogan && row.ai_slogan.trim());
}
function showAiPlan(row) {
  aiPlanModalData.value = {
    subject_id: row.subject_id,
    ai_big_idea: row.ai_big_idea || '',
    ai_highlight_scene: row.ai_highlight_scene || '',
    ai_slogan: row.ai_slogan || '',
  };
  aiPlanModalVisible.value = true;
}

// Export URLs
const exportPlansUrl = computed(() => {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  if (filters.value.groupType) q.set('group_type', filters.value.groupType);
  return `/api/admin/export/study2-plans?${q}`;
});
const exportCseUrl = computed(() => {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  if (filters.value.groupType) q.set('group_type', filters.value.groupType);
  return `/api/admin/export/study2-cse?${q}`;
});
const exportPosttestUrl = computed(() => {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  if (filters.value.groupType) q.set('group_type', filters.value.groupType);
  return `/api/admin/export/study2-posttest?${q}`;
});
const exportChatlogsUrl = computed(() => {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  return `/api/admin/export/study2-chatlogs?${q}`;
});
const exportChatlogsFullUrl = computed(() => {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  return `/api/admin/export/study2-chatlogs-full?${q}`;
});
const exportResultAiPlansUrl = computed(() => {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  return `/api/admin/export/study2-result-ai-plans?${q}`;
});

// Fetch
function fetchPlans() {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  if (filters.value.groupType) q.set('group_type', filters.value.groupType);
  fetch(`/api/admin/study2/plans?${q}`).then((r) => r.json()).then((d) => { plans.value = Array.isArray(d) ? d : []; }).catch(() => { plans.value = []; });
}
function fetchCse() {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  if (filters.value.groupType) q.set('group_type', filters.value.groupType);
  fetch(`/api/admin/study2/cse?${q}`).then((r) => r.json()).then((d) => { cseList.value = Array.isArray(d) ? d : []; }).catch(() => { cseList.value = []; });
}
function fetchPosttest() {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  if (filters.value.groupType) q.set('group_type', filters.value.groupType);
  fetch(`/api/admin/study2/posttest?${q}`).then((r) => r.json()).then((d) => { posttest.value = Array.isArray(d) ? d : []; }).catch(() => { posttest.value = []; });
}
function fetchChatLogs() {
  const q = new URLSearchParams();
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  if (filters.value.groupType) q.set('group_type', filters.value.groupType);
  fetch(`/api/admin/study2/plans?group_type=process&${q}`).then((r) => r.json()).then((d) => {
    const rows = Array.isArray(d) ? d : [];
    chatLogs.value = rows.map((r) => {
      let msgs = [];
      try { msgs = JSON.parse(r.chat_log || '[]'); } catch (_) {}
      const userMsgs = msgs.filter((m) => m.role === 'user');
      const assistantNonFinal = msgs.filter((m) => m.role === 'assistant' && !m.isFinal);
      const interaction_rounds = r.interaction_rounds != null ? r.interaction_rounds : userMsgs.length;
      const user_input_chars = r.user_input_chars != null ? r.user_input_chars : userMsgs.reduce((s, m) => s + String(m.content || '').length, 0);
      const ai_ask_count = r.ai_ask_count != null ? r.ai_ask_count : assistantNonFinal.length;
      const user_choice_count = r.user_choice_count != null ? r.user_choice_count : 0;
      return {
        ...r,
        messages: msgs,
        round1: userMsgs[0]?.content || '',
        round2: userMsgs[1]?.content || '',
        round3: userMsgs[2]?.content || '',
        round4: userMsgs[3]?.content || '',
        round5: userMsgs[4]?.content || '',
        interaction_rounds,
        user_input_chars,
        ai_ask_count,
        user_choice_count,
      };
    });
  }).catch(() => { chatLogs.value = []; });
}
function fetchResultAiPlans() {
  const q = new URLSearchParams();
  q.set('group_type', 'result');
  if (filters.value.keyword) q.set('keyword', filters.value.keyword);
  fetch(`/api/admin/study2/plans?${q}`).then((r) => r.json()).then((d) => { resultAiPlans.value = Array.isArray(d) ? d : []; }).catch(() => { resultAiPlans.value = []; });
}

function deleteSelected() {
  if (selectedIds.value.size === 0) return;
  const dt = filters.value.dataType;
  const ids = [...selectedIds.value];
  let url = '';
  if (dt === 'plans') url = '/api/admin/study2/plans';
  else if (dt === 'cse') url = '/api/admin/study2/cse';
  else if (dt === 'posttest') url = '/api/admin/study2/posttest';
  else if (dt === 'chatlogs' || dt === 'resultAiPlans') url = '/api/admin/study2/plans';
  if (!url) return;
  const tip = dt === 'resultAiPlans' ? `确定删除选中的 ${ids.length} 条结果组记录吗？删除后，其对应的过程组AI方案将回到方案池，可被其他结果组再次抽取。` : `确定删除选中的 ${ids.length} 条数据吗？`;
  if (!confirm(tip)) return;
  fetch(url, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) })
    .then((r) => r.json()).then((d) => { if (d.ok) { selectedIds.value = new Set(); refreshData(); } }).catch(() => {});
}

function refreshData() {
  const dt = filters.value.dataType;
  if (dt === 'plans') fetchPlans();
  else if (dt === 'cse') fetchCse();
  else if (dt === 'posttest') fetchPosttest();
  else if (dt === 'chatlogs') fetchChatLogs();
  else if (dt === 'resultAiPlans') fetchResultAiPlans();
}

watch(
  () => [filters.value.dataType, filters.value.groupType, filters.value.keyword, filters.value.variable],
  () => { page.value = 1; selectedIds.value = new Set(); sortKey.value = ''; refreshData(); },
  { immediate: true }
);

</script>

<style scoped>
.admin-wrap { min-height: 100vh; background: var(--color-page-bg); padding: 10px; display: flex; flex-direction: column; width: 95%; max-width: 1600px; margin: 0 auto; }
.top-bar { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; flex-shrink: 0; margin-bottom: 10px; }
.top-bar .text-h1 { margin: 0; text-align: left; }
.top-actions { display: flex; gap: 20px; }
.btn-primary { min-width: 120px; height: 36px; padding: 0 16px; border-radius: 4px; background: var(--color-active-bg); color: var(--color-text); font-size: 14px; font-weight: 500; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; cursor: pointer; white-space: nowrap; border: none; }
.btn-primary:hover:not(:disabled) { background: var(--color-secondary); }
.btn-primary.btn-danger { background: #c62828; color: #fff; }
.btn-primary.btn-danger:hover:not(:disabled) { background: #b71c1c; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-link { background: none; border: none; color: var(--color-primary); cursor: pointer; text-decoration: underline; font-size: 13px; }
.main-grid { flex: 1; min-height: 0; display: grid; grid-template-columns: 20% 70%; gap: 10px; justify-content: center; }
.filter-panel { padding: 12px; overflow: auto; }
.filter-panel .text-h2 { margin: 8px 0; }
.filter-form { display: flex; flex-direction: column; gap: 12px; }
.filter-label { font-size: 14px; font-weight: 500; color: var(--color-text); text-align: left; }
.filter-select, .filter-input { width: 100%; padding: 8px 10px; border: none; border-bottom: 1px solid var(--color-secondary); background: var(--color-input-bg); font-size: 14px; color: var(--color-text); }
.table-panel { overflow: auto; display: flex; flex-direction: column; min-height: 0; }
.empty-hint { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px; }
.table-wrap { flex: 1; min-height: 0; overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 14px; color: var(--color-text); line-height: 1.2; }
.data-table th, .data-table td { border: 1px solid var(--color-border-line); padding: 8px; text-align: left; }
.data-table th { background: #B8D4E8; color: #333; font-weight: 500; text-align: center; position: sticky; top: 0; z-index: 1; font-family: "SimSun", "Songti SC", serif; }
.data-table td.cell-body { white-space: pre-wrap; word-break: break-word; }
.data-table td.cell-big-idea { white-space: pre-wrap; word-break: break-word; }
.cell-name { min-width: 4em; word-break: keep-all; }
.th-sort { cursor: pointer; }
.th-checkbox, .td-checkbox { width: 36px; text-align: center; vertical-align: middle; }
.sort-icon { margin-left: 4px; }
.pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 12px; }
.page-btn { padding: 6px 12px; border-radius: 4px; border: none; background: var(--color-active-bg); color: var(--color-text); cursor: pointer; font-size: 14px; }
.page-btn:disabled { background: var(--color-btn-disabled-bg); color: var(--color-btn-disabled-text); cursor: not-allowed; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 999; }
.modal-box { background: #fff; border-radius: 8px; padding: 24px; max-width: 700px; width: 90%; max-height: 80vh; overflow: auto; }
.chat-log-body { max-height: 50vh; overflow: auto; }
.chat-user { margin: 8px 0; color: var(--color-primary); }
.chat-ai { margin: 8px 0; color: #333; }
.ai-plan-body { max-height: 60vh; overflow: auto; }
.ai-plan-label { font-weight: 600; margin: 12px 0 4px; }
.ai-plan-text { white-space: pre-wrap; word-break: break-word; margin: 0 0 8px; font-size: 14px; line-height: 1.5; }
@media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }
</style>
