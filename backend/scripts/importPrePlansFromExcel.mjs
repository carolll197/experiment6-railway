/**
 * 将 materials/预实验被试方案.xlsx 中的方案导入到 pre_subject_plans 表
 * 用法：在项目根目录执行 node backend/scripts/importPrePlansFromExcel.mjs
 */
import { initDb, getDb } from '../db.js';
import { getPrePlansFromExcel } from '../lib/prePlansExcel.js';

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

async function main() {
  await initDb();
  const db = getDb();
  const rows = getPrePlansFromExcel();
  if (rows.length === 0) {
    console.log('Excel 中无数据或文件不存在，跳过导入。');
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
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
