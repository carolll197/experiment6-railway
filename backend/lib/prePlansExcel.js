/**
 * 预实验被试方案：从 materials/预实验被试方案.xlsx 读取（三栏：核心创意点与设定、高光画面描述、主打广告语），供主试端「从 Excel 导入」覆盖数据
 */
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const materialsDir = path.join(__dirname, '..', '..', 'materials');
const excelPath = path.join(materialsDir, '预实验被试方案.xlsx');
/** 预实验2 被试方案 Excel 路径（一键导入用） */
const excelPath2 = path.join(materialsDir, '预实验2被试方案.xlsx');

function parseBool(v) {
  if (v === true || v === 1) return 1;
  if (v === '是' || String(v).trim() === '是') return 1;
  return 0;
}

/**
 * 读取 Excel，返回与 pre_subject_plans 表三栏一致的行（subject_id, name, big_idea, highlight_scene, slogan, submitted_at, is_auto_saved 等）
 * Excel 列名：被试编号、被试姓名、核心创意点与设定、高光画面描述、主打广告语、提交时间、是否自动保存
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
        big_idea: row['核心创意点与设定'] != null ? String(row['核心创意点与设定']) : (row['核心创意'] != null ? String(row['核心创意']) : ''),
        highlight_scene: row['高光画面描述'] != null ? String(row['高光画面描述']) : '',
        slogan: row['主打广告语'] != null ? String(row['主打广告语']) : '',
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
 * 从 materials/预实验2被试方案.xlsx 读取方案（一键导入：覆盖数据库）
 * 列名同 getPrePlansFromExcel：被试编号、被试姓名、核心创意点与设定（或核心创意点与比喻/核心创意）、高光画面描述、主打广告语、提交时间、是否自动保存
 */
export function getPrePlansFromExcel2() {
  try {
    const wb = XLSX.readFile(excelPath2);
    const sn = wb.SheetNames[0] || wb.SheetNames.find((s) => s.includes('被试')) || wb.SheetNames[0];
    const ws = wb.Sheets[sn];
    if (!ws) return [];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    return rows.map((row, i) => {
      const subject_id = row['被试编号'] != null ? String(row['被试编号']).trim() : '';
      const name = row['被试姓名'] != null ? String(row['被试姓名']).trim() : '';
      const submitted_at = row['提交时间'] != null ? String(row['提交时间']).trim() : '';
      const is_auto_saved = parseBool(row['是否自动保存']);
      const big_idea = row['核心创意点与设定'] != null ? String(row['核心创意点与设定']) : (row['核心创意点与比喻'] != null ? String(row['核心创意点与比喻']) : (row['核心创意'] != null ? String(row['核心创意']) : ''));
      return {
        id: i + 1,
        subject_id,
        name,
        big_idea,
        highlight_scene: row['高光画面描述'] != null ? String(row['高光画面描述']) : '',
        slogan: row['主打广告语'] != null ? String(row['主打广告语']) : '',
        submitted_at,
        is_auto_saved,
        start_time: submitted_at || null,
        end_time: submitted_at || null,
      };
    });
  } catch (e) {
    console.error('[prePlansExcel2]', e.message);
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
