/**
 * 将 materials/预实验被试方案.xlsx 中的方案导入到 pre_subject_plans 表
 * 用法：在项目根目录执行 node backend/scripts/importPrePlansFromExcel.mjs
 *
 * 注意：本脚本写入的是磁盘上的数据库文件。若后端服务已在运行，其使用的是启动时加载的
 * 内存数据库，不会自动看到本次写入。请二选一：
 * 1) 先运行本脚本后重启后端服务；或
 * 2) 直接使用主试端「从 Excel 导入」按钮（或 POST /api/admin/pre/import-from-excel），
 *    会在当前进程中导入，专家端立即可见。
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, getDb } from '../db.js';
import { getPrePlansFromExcel } from '../lib/prePlansExcel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '..', 'data', 'experiment.db');

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

async function main() {
  await initDb();
  const db = getDb();
  const rows = getPrePlansFromExcel();
  console.log('数据库文件:', dbPath);
  if (rows.length === 0) {
    console.log('Excel 中无数据或文件不存在，跳过导入。请确认 materials/预实验被试方案.xlsx 存在且列名正确。');
    process.exit(0);
  }
  const del = db.prepare('DELETE FROM pre_subject_plans WHERE subject_id = ?');
  const ins = db.prepare(`
    INSERT INTO pre_subject_plans (subject_id, name, target_audience, pain_point, insight, big_idea, rationale, submitted_at, is_auto_saved, created_at, start_time, end_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const submittedAt = nowStr();
  for (const r of rows) {
    const subject_id = r.subject_id != null ? String(r.subject_id).trim() : '';
    if (!subject_id) continue;
    del.run(subject_id);
    ins.run(
      subject_id,
      r.name ?? '',
      r.target_audience ?? '',
      r.pain_point ?? '',
      r.insight ?? '',
      r.big_idea ?? '',
      r.rationale ?? '',
      r.submitted_at || submittedAt,
      r.is_auto_saved ? 1 : 0,
      r.submitted_at || submittedAt,
      r.start_time || r.submitted_at || submittedAt,
      r.end_time || r.submitted_at || submittedAt
    );
  }
  console.log('导入完成，共', rows.length, '条方案已写入 pre_subject_plans。');
  console.log('若后端服务已启动，请重启服务后再在专家端查看；或使用主试端「从 Excel 导入」按钮在当前进程中导入。');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
