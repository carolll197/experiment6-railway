/**
 * 预实验被试方案：从 materials/预实验被试方案.xlsx 读取（三栏：核心创意点与设定、高光画面描述、主打广告语），供主试端「从 Excel 导入」覆盖数据
 */
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const materialsDir = path.join(__dirname, '..', '..', 'materials');
const excelPath = path.join(materialsDir, '预实验被试方案.xlsx');

/** 预实验2 被试方案 Excel：优先相对于代码目录（部署稳定），其次相对于当前工作目录 */
  if (fs.existsSync(fromCwd)) return fromCwd;
function getPre2ExcelPath() {
  const fileName = '预实验2被试方案.xlsx';
  const fromLib = path.join(materialsDir, fileName);
  const fromCwd = path.join(process.cwd(), 'materials', fileName);
  if (fs.existsSync(fromLib)) return fromLib;
  if (fs.existsSync(fromCwd)) return fromCwd;
  throw new Error(`文件不存在。已尝试路径：\n1. ${fromLib}\n2. ${fromCwd}\n请将「${fileName}」放入项目根目录下的 materials 文件夹中。`);
}

function parseBool(v) {
  if (v === true || v === 1) return 1;
  if (v === '是' || String(v).trim() === '是') return 1;
  return 0;
}

/** 表头键规范化：去 BOM、首尾空格（Excel 有时会带 BOM 或空格导致列名对不上） */
function normKey(k) {
  if (k == null || typeof k !== 'string') return '';
  return k.replace(/^\uFEFF/, '').trim();
}

/** 从一行对象中按多个可能的表头名取值（表头可能有空格、BOM 或别名） */
function cell(row, ...keys) {
  const byNorm = {};
  for (const k of Object.keys(row)) {
    const n = normKey(k);
    if (n) byNorm[n] = row[k];
  }
  for (const k of keys) {
    const val = byNorm[normKey(k)];
    if (val != null && String(val).trim() !== '') return String(val).trim();
  }
  return '';
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
 * 列名：被试编号、被试姓名、核心创意点与设定（或核心创意点与比喻/核心创意）、高光画面描述、主打广告语、提交时间、是否自动保存（表头首行，可有空格）
 */
export function getPrePlansFromExcel2() {
  let resolvedPath;
  try {
    resolvedPath = getPre2ExcelPath();
  } catch (e) {
    console.error('[prePlansExcel2]', e.message);
    throw e;
  }
  try {
    const wb = XLSX.readFile(resolvedPath);
    const sn = wb.SheetNames[0] || wb.SheetNames.find((s) => s.includes('被试')) || wb.SheetNames[0];
    const ws = wb.Sheets[sn];
    if (!ws) return [];
    let rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    // 若第一行没有「被试编号」表头，尝试把第二行当表头（首行为标题的情况）
    if (rows.length > 0) {
      const firstKeys = Object.keys(rows[0]).map(normKey);
      if (!firstKeys.includes('被试编号') && rows.length > 1) {
        rows = XLSX.utils.sheet_to_json(ws, { defval: '', range: 1 });
      }
    }
    const out = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const subject_id = cell(row, '被试编号');
      if (!subject_id) continue;
      const name = cell(row, '被试姓名') || '';
      const submitted_at = cell(row, '提交时间') || '';
      const is_auto_saved = parseBool(cell(row, '是否自动保存') || '');
      const big_idea = cell(row, '核心创意点与设定', '核心创意点与比喻', '核心创意');
      const highlight_scene = cell(row, '高光画面描述');
      const slogan = cell(row, '主打广告语');
      out.push({
        id: out.length + 1,
        subject_id,
        name,
        big_idea: big_idea || '',
        highlight_scene,
        slogan,
        submitted_at,
        is_auto_saved,
        start_time: submitted_at || null,
        end_time: submitted_at || null,
      });
    }
    if (out.length === 0 && rows.length > 0) {
      const detected = Object.keys(rows[0]).map(normKey).filter(Boolean).join('、');
      throw new Error(`未解析到任何有效行（每行需填写「被试编号」）。当前检测到的表头：${detected || '(无)'}。请确认表头在第一行且列名包含：被试编号、被试姓名、核心创意点与设定、高光画面描述、主打广告语、提交时间、是否自动保存。`);
    }
    return out;
  } catch (e) {
    if (e.code === 'ENOENT' || e.message?.includes('不存在')) throw e;
    console.error('[prePlansExcel2]', e.message);
    throw new Error(`读取 Excel 失败：${e.message}。请确认表头在第一行，列名为：被试编号、被试姓名、核心创意点与设定、高光画面描述、主打广告语、提交时间、是否自动保存。`);
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
