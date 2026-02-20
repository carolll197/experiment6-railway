/**
 * 预实验被试方案：从 materials/预实验被试方案.xlsx 读取，供专家版/主试版展示（替代数据库中的被试提交结果）
 */
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const excelPath = path.join(__dirname, '..', '..', 'materials', '预实验被试方案.xlsx');

const COL = {
  被试编号: 'subject_id',
  被试姓名: 'name',
  目标受众画像: 'target_audience',
  痛点挖掘: 'pain_point',
  核心洞察: 'insight',
  核心创意: 'big_idea',
  创意理由: 'rationale',
  提交时间: 'submitted_at',
  是否自动保存: 'is_auto_saved',
};

function parseBool(v) {
  if (v === true || v === 1) return 1;
  if (v === '是' || String(v).trim() === '是') return 1;
  return 0;
}

/**
 * 读取 Excel，返回与 pre_subject_plans 表结构一致的行（含 id, subject_id, name, target_audience, pain_point, insight, big_idea, rationale, submitted_at, is_auto_saved, start_time, end_time）
 */
export function getPrePlansFromExcel() {
  try {
    const wb = XLSX.readFile(excelPath);
    const sn = wb.SheetNames[0] || wb.SheetNames.find((s) => s.includes('被试')) || wb.SheetNames[0];
    const ws = wb.Sheets[sn];
    if (!ws) return [];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    return rows.map((row, i) => {
      const subject_id = row['被试编号'] != null ? String(row['被试编号']).trim() : '';
      const name = row['被试姓名'] != null ? String(row['被试姓名']).trim() : '';
      const submitted_at = row['提交时间'] != null ? String(row['提交时间']).trim() : '';
      const is_auto_saved = parseBool(row['是否自动保存']);
      return {
        id: i + 1,
        subject_id,
        name,
        target_audience: row['目标受众画像'] != null ? String(row['目标受众画像']) : '',
        pain_point: row['痛点挖掘'] != null ? String(row['痛点挖掘']) : '',
        insight: row['核心洞察'] != null ? String(row['核心洞察']) : '',
        big_idea: row['核心创意'] != null ? String(row['核心创意']) : '',
        rationale: row['创意理由'] != null ? String(row['创意理由']) : '',
        submitted_at,
        is_auto_saved,
        start_time: submitted_at || null,
        end_time: submitted_at || null,
      };
    });
  } catch (e) {
    console.error('[prePlansExcel]', e.message);
    return [];
  }
}

/**
 * 返回 subject_id -> name 的映射，供专家评分等接口取被试姓名
 */
export function getPrePlanSubjectNames() {
  const rows = getPrePlansFromExcel();
  const map = {};
  for (const r of rows) {
    if (r.subject_id != null && r.subject_id !== '') map[String(r.subject_id)] = r.name || '';
  }
  return map;
}
