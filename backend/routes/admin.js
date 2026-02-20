import { Router } from 'express';
import XLSX from 'xlsx';
import { getPrePlansFromExcel, getPrePlanSubjectNames } from '../lib/prePlansExcel.js';

export const adminRouter = Router();

// 预实验 - 批量删除被试方案（同步：专家版将不再看到这些方案；同时删除其专家评分）
adminRouter.delete('/pre/plans', (req, res) => {
  try {
    const db = req.app.get('db');
    const { subject_ids: subjectIds } = req.body || {};
    const ids = Array.isArray(subjectIds) ? subjectIds.map((s) => String(s).trim()).filter(Boolean) : [];
    if (ids.length === 0) return res.status(400).json({ error: '请提供 subject_ids' });
    const placeholders = ids.map(() => '?').join(',');
    db.run(`DELETE FROM pre_expert_scores WHERE subject_id IN (${placeholders})`, ids);
    db.run(`DELETE FROM pre_subject_plans WHERE subject_id IN (${placeholders})`, ids);
    res.json({ ok: true, deleted: ids.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 预实验 - 被试方案列表（来自 materials/预实验被试方案.xlsx，支持 keyword 筛选；专家无效信息仍从 DB 查）
adminRouter.get('/pre/plans', (req, res) => {
  try {
    const db = req.app.get('db');
    const { keyword } = req.query;
    let rows = getPrePlansFromExcel();
    if (keyword && String(keyword).trim()) {
      const k = String(keyword).trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          String(r.subject_id ?? '').toLowerCase().includes(k) ||
          String(r.name ?? '').toLowerCase().includes(k)
      );
    }
    const invalidRows = db.prepare(`SELECT DISTINCT subject_id, expert_name FROM pre_expert_scores WHERE is_invalid = 1`).all();
    const invalidIds = new Set(invalidRows.map((r) => String(r.subject_id ?? '')));
    const invalidDetails = {};
    for (const r of invalidRows) {
      const sid = String(r.subject_id ?? '');
      if (!invalidDetails[sid]) invalidDetails[sid] = [];
      const en = String(r.expert_name ?? '');
      if (en && !invalidDetails[sid].includes(en)) invalidDetails[sid].push(en);
    }
    const out = rows.map((r) => {
      const sid = String(r.subject_id ?? '');
      const invalid = invalidIds.has(sid);
      const names = invalidDetails[sid];
      return {
        ...r,
        expert_marked_invalid: invalid,
        plan_status: invalid ? '无效' : '有效',
        invalid_expert_names: names && names.length ? names.join('、') : (invalid ? '—' : '—'),
      };
    });
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 预实验 - 专家评分列表（支持 keyword / dataStatus / expertName；被试姓名 subject_name 来自 Excel 方案表）
adminRouter.get('/pre/scores', (req, res) => {
  try {
    const db = req.app.get('db');
    const nameMap = getPrePlanSubjectNames();
    const { keyword, dataStatus, expertName } = req.query;
    if (dataStatus === 'invalid') {
      const invalidRows = db.prepare(`SELECT DISTINCT subject_id FROM pre_expert_scores WHERE is_invalid = 1`).all();
      const subjectIds = invalidRows.map((r) => String(r.subject_id ?? '')).filter(Boolean);
      if (subjectIds.length === 0) return res.json([]);
      const placeholders = subjectIds.map(() => '?').join(',');
      let sql = `SELECT s.* FROM pre_expert_scores s WHERE s.subject_id IN (${placeholders})`;
      const params = [...subjectIds];
      if (keyword && String(keyword).trim()) {
        const k = `%${String(keyword).trim()}%`;
        sql += ` AND (s.subject_id LIKE ? OR s.expert_name LIKE ?)`;
        params.push(k, k);
      }
      if (expertName && String(expertName).trim()) {
        sql += ` AND s.expert_name LIKE ?`;
        params.push(`%${String(expertName).trim()}%`);
      }
      sql += ` ORDER BY s.subject_id, s.expert_name, s.question_no`;
      const rows = db.prepare(sql).all(...params);
      const out = rows.map((r) => ({ ...r, subject_name: nameMap[String(r.subject_id ?? '')] ?? '' }));
      return res.json(out);
    }
    let sql = `SELECT s.* FROM pre_expert_scores s WHERE 1=1`;
    const params = [];
    if (keyword && String(keyword).trim()) {
      const k = `%${String(keyword).trim()}%`;
      sql += ` AND (s.subject_id LIKE ? OR s.expert_name LIKE ?)`;
      params.push(k, k);
    }
    if (expertName && String(expertName).trim()) {
      sql += ` AND s.expert_name LIKE ?`;
      params.push(`%${String(expertName).trim()}%`);
    }
    if (dataStatus === 'valid') sql += ` AND s.is_invalid = 0`;
    sql += ` ORDER BY s.subject_id, s.expert_name, s.question_no`;
    const rows = db.prepare(sql).all(...params);
    const out = rows.map((r) => ({ ...r, subject_name: nameMap[String(r.subject_id ?? '')] ?? '' }));
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 预实验 - 被专家标记为无效的被试及标注者（用于被试方案表展示：方案状态 + 哪个专家标注）
adminRouter.get('/pre/expert-invalid-subjects', (req, res) => {
  try {
    const db = req.app.get('db');
    const rows = db
      .prepare(`SELECT DISTINCT subject_id, expert_name FROM pre_expert_scores WHERE is_invalid = 1`)
      .all();
    const subjectIds = [...new Set(rows.map((r) => String(r.subject_id ?? '')))];
    const details = rows.map((r) => ({ subject_id: String(r.subject_id ?? ''), expert_name: String(r.expert_name ?? '') }));
    res.json({ subjectIds, details });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 研究一 - 批量删除被试方案（按方案行 id 删除）
adminRouter.delete('/study1/plans', (req, res) => {
  try {
    const db = req.app.get('db');
    const { ids } = req.body || {};
    const idList = Array.isArray(ids) ? ids.filter((id) => Number(id) > 0).map(Number) : [];
    if (idList.length === 0) return res.status(400).json({ error: '请提供 ids' });
    const placeholders = idList.map(() => '?').join(',');
    db.run(`DELETE FROM study1_subject_plans WHERE id IN (${placeholders})`, idList);
    res.json({ ok: true, deleted: idList.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 研究一 - 被试方案列表（支持筛选，附带每被试 CSE 题目得分供主试版展示）
adminRouter.get('/study1/plans', (req, res) => {
  try {
    const db = req.app.get('db');
    const { keyword, phase } = req.query;
    let sql = `SELECT * FROM study1_subject_plans WHERE 1=1`;
    const params = [];
    if (keyword) {
      sql += ` AND (subject_id LIKE ? OR name LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (phase) {
      sql += ` AND phase = ?`;
      params.push(phase);
    }
    sql += ` ORDER BY id`;
    const rows = db.prepare(sql).all(...params);
    const cseRows = db.prepare(`SELECT * FROM study1_cse_scores`).all();
    const cseBySubject = {};
    for (const c of cseRows) {
      const sid = c.subject_id != null ? String(c.subject_id) : '';
      cseBySubject[sid] = c;
    }
    const out = rows.map((r) => {
      const sid = r.subject_id != null ? String(r.subject_id) : '';
      const cse = cseBySubject[sid];
      return {
        ...r,
        cse_q1: cse != null && cse.q1 != null ? cse.q1 : null,
        cse_q2: cse != null && cse.q2 != null ? cse.q2 : null,
        cse_q3: cse != null && cse.q3 != null ? cse.q3 : null,
        cse_q4: cse != null && cse.q4 != null ? cse.q4 : null,
      };
    });
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 研究一 - 环节一选择与打分（姓名来自 study1_subjects，无则回退方案表）
adminRouter.get('/study1/phase1-choices', (req, res) => {
  try {
    const db = req.app.get('db');
    const rows = db.prepare(`
      SELECT c.*,
        COALESCE(
          (SELECT s.name FROM study1_subjects s WHERE s.subject_id = c.subject_id LIMIT 1),
          (SELECT p.name FROM study1_subject_plans p WHERE p.subject_id = c.subject_id LIMIT 1)
        ) AS name
      FROM study1_phase1_choice c ORDER BY c.id
    `).all();
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 研究一 - CSE 量表得分（带被试姓名 name）
adminRouter.get('/study1/cse', (req, res) => {
  try {
    const db = req.app.get('db');
    const { keyword } = req.query;
    let sql = `SELECT c.id, c.subject_id, c.q1, c.q2, c.q3, c.q4, c.created_at,
      COALESCE((SELECT name FROM study1_subjects s WHERE s.subject_id = c.subject_id LIMIT 1),
               (SELECT name FROM study1_subject_plans p WHERE p.subject_id = c.subject_id LIMIT 1)) AS name
      FROM study1_cse_scores c WHERE 1=1`;
    const params = [];
    if (keyword && String(keyword).trim()) {
      sql += ` AND c.subject_id LIKE ?`;
      params.push(`%${String(keyword).trim()}%`);
    }
    sql += ` ORDER BY c.id`;
    const rows = db.prepare(sql).all(...params);
    res.json(Array.isArray(rows) ? rows : []);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message) });
  }
});

// 导出研究一 CSE 量表数据 Excel（与筛选同步：keyword；含被试姓名）
adminRouter.get('/export/study1-cse', (req, res) => {
  try {
    const db = req.app.get('db');
    const { keyword } = req.query;
    let sql = `SELECT c.id, c.subject_id, c.q1, c.q2, c.q3, c.q4, c.created_at,
      COALESCE((SELECT name FROM study1_subjects s WHERE s.subject_id = c.subject_id LIMIT 1),
               (SELECT name FROM study1_subject_plans p WHERE p.subject_id = c.subject_id LIMIT 1)) AS name
      FROM study1_cse_scores c WHERE 1=1`;
    const params = [];
    if (keyword && String(keyword).trim()) { sql += ` AND c.subject_id LIKE ?`; params.push(`%${String(keyword).trim()}%`); }
    sql += ` ORDER BY c.id`;
    const rows = db.prepare(sql).all(...params);
    const ws = XLSX.utils.json_to_sheet(
      rows.map((r) => ({
        被试编号: r.subject_id,
        被试姓名: r.name ?? '',
        题1: r.q1 != null ? r.q1 : '',
        题2: r.q2 != null ? r.q2 : '',
        题3: r.q3 != null ? r.q3 : '',
        题4: r.q4 != null ? r.q4 : '',
        提交时间: r.created_at || '',
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CSE量表数据');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=study1_cse_scores.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 导出预实验被试方案 Excel（来自 Excel 方案表，与筛选同步：keyword、dataStatus）
adminRouter.get('/export/pre-plans', (req, res) => {
  try {
    const db = req.app.get('db');
    const { keyword, dataStatus } = req.query;
    let rows = getPrePlansFromExcel();
    if (keyword && String(keyword).trim()) {
      const k = String(keyword).trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          String(r.subject_id ?? '').toLowerCase().includes(k) ||
          String(r.name ?? '').toLowerCase().includes(k)
      );
    }
    if (dataStatus === 'valid' || dataStatus === 'invalid') {
      const invalidRows = db.prepare(`SELECT DISTINCT subject_id FROM pre_expert_scores WHERE is_invalid = 1`).all();
      const invalidIds = new Set(invalidRows.map((r) => String(r.subject_id ?? '')));
      if (dataStatus === 'invalid') rows = rows.filter((r) => invalidIds.has(String(r.subject_id ?? '')));
      else rows = rows.filter((r) => !invalidIds.has(String(r.subject_id ?? '')));
    }
    const ws = XLSX.utils.json_to_sheet(
      rows.map((r) => ({
        被试编号: r.subject_id,
        被试姓名: r.name,
        目标受众画像: r.target_audience,
        痛点挖掘: r.pain_point,
        核心洞察: r.insight,
        核心创意: r.big_idea,
        创意理由: r.rationale,
        提交时间: r.submitted_at,
        是否自动保存: r.is_auto_saved ? '是' : '否',
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '预实验被试方案');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=pre_subject_plans.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 导出预实验专家评分 Excel（与筛选同步：keyword、dataStatus、expertName；被试姓名来自 Excel 方案表）
function preScoresRows(db, query) {
  const { keyword, dataStatus, expertName } = query;
  const nameMap = getPrePlanSubjectNames();
  let rows = [];
  if (dataStatus === 'invalid') {
    const invalidRows = db.prepare(`SELECT DISTINCT subject_id FROM pre_expert_scores WHERE is_invalid = 1`).all();
    const subjectIds = invalidRows.map((r) => String(r.subject_id ?? '')).filter(Boolean);
    if (subjectIds.length === 0) return [];
    const placeholders = subjectIds.map(() => '?').join(',');
    let sql = `SELECT s.* FROM pre_expert_scores s WHERE s.subject_id IN (${placeholders})`;
    const params = [...subjectIds];
    if (keyword && String(keyword).trim()) { const k = `%${String(keyword).trim()}%`; sql += ` AND (s.subject_id LIKE ? OR s.expert_name LIKE ?)`; params.push(k, k); }
    if (expertName && String(expertName).trim()) { sql += ` AND s.expert_name LIKE ?`; params.push(`%${String(expertName).trim()}%`); }
    sql += ` ORDER BY s.subject_id, s.expert_name, s.question_no`;
    rows = db.prepare(sql).all(...params);
  } else {
    let sql = `SELECT s.* FROM pre_expert_scores s WHERE 1=1`;
    const params = [];
    if (keyword && String(keyword).trim()) { const k = `%${String(keyword).trim()}%`; sql += ` AND (s.subject_id LIKE ? OR s.expert_name LIKE ?)`; params.push(k, k); }
    if (expertName && String(expertName).trim()) { sql += ` AND s.expert_name LIKE ?`; params.push(`%${String(expertName).trim()}%`); }
    if (dataStatus === 'valid') sql += ` AND s.is_invalid = 0`;
    sql += ` ORDER BY s.subject_id, s.expert_name, s.question_no`;
    rows = db.prepare(sql).all(...params);
  }
  return rows.map((r) => ({ ...r, subject_name: nameMap[String(r.subject_id ?? '')] ?? '' }));
}

adminRouter.get('/export/pre-scores', (req, res) => {
  try {
    const db = req.app.get('db');
    const rows = preScoresRows(db, req.query);
    const ws = XLSX.utils.json_to_sheet(
      rows.map((r) => ({
        被试编号: r.subject_id,
        被试姓名: r.subject_name ?? '',
        专家姓名: r.expert_name,
        题号: r.question_no,
        分数: r.score,
        是否标记无效: r.is_invalid ? '是' : '否',
        打分时间: r.scored_at,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '预实验专家评分');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=pre_expert_scores.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 导出研究一被试方案 Excel（与筛选同步：keyword、phase）
adminRouter.get('/export/study1-plans', (req, res) => {
  try {
    const db = req.app.get('db');
    const { keyword, phase } = req.query;
    let sql = `SELECT * FROM study1_subject_plans WHERE 1=1`;
    const params = [];
    if (keyword && String(keyword).trim()) { const k = `%${String(keyword).trim()}%`; sql += ` AND (subject_id LIKE ? OR name LIKE ?)`; params.push(k, k); }
    if (phase && String(phase).trim()) { sql += ` AND phase = ?`; params.push(String(phase).trim()); }
    sql += ` ORDER BY id`;
    const plans = db.prepare(sql).all(...params);
    const choices = db.prepare(`SELECT * FROM study1_phase1_choice ORDER BY subject_id`).all();
    const choiceMap = Object.fromEntries(choices.map((c) => [c.subject_id, c]));
    const cseRows = db.prepare(`SELECT * FROM study1_cse_scores ORDER BY subject_id`).all();
    const cseMap = Object.fromEntries(cseRows.map((c) => [c.subject_id, c]));
    const rows = plans.map((r) => {
      const ch = choiceMap[r.subject_id];
      const cse = cseMap[r.subject_id];
      let scoresYours = '';
      let scoresAi = '';
      if (ch && ch.scores_json) {
        try {
          const arr = typeof ch.scores_json === 'string' ? JSON.parse(ch.scores_json) : ch.scores_json;
          if (Array.isArray(arr)) {
            scoresYours = arr.map((d) => `Q${d.question_no}:${d.your_score ?? ''}`).join(' ');
            scoresAi = arr.map((d) => `Q${d.question_no}:${d.ai_score ?? ''}`).join(' ');
          }
        } catch (_) {}
      }
      return {
        被试编号: r.subject_id,
        姓名: r.name,
        创作环节: r.phase,
        题号: r.question_no,
        目标受众画像: r.target_audience,
        痛点挖掘: r.pain_point,
        核心洞察: r.insight,
        核心创意: r.big_idea,
        创意理由: r.rationale,
        提交时间: r.submitted_at,
        是否自动保存: r.is_auto_saved ? '是' : '否',
        环节一最终提交作品: ch ? ch.chosen : '',
        '环节一-您的作品打分': scoresYours,
        '环节一-AI作品打分': scoresAi,
        CSE_Q1: cse ? cse.q1 : '',
        CSE_Q2: cse ? cse.q2 : '',
        CSE_Q3: cse ? cse.q3 : '',
        CSE_Q4: cse ? cse.q4 : '',
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '研究一被试方案');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=study1_subject_plans.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 研究一 - 批量删除 CSE 量表数据
adminRouter.delete('/study1/cse', (req, res) => {
  try {
    const db = req.app.get('db');
    const { ids } = req.body || {};
    const idList = Array.isArray(ids) ? ids.filter((id) => Number(id) > 0).map(Number) : [];
    if (idList.length === 0) return res.status(400).json({ error: '请提供 ids' });
    const placeholders = idList.map(() => '?').join(',');
    db.run(`DELETE FROM study1_cse_scores WHERE id IN (${placeholders})`, idList);
    res.json({ ok: true, deleted: idList.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 研究一 - 批量删除环节一选择与打分
adminRouter.delete('/study1/phase1-choices', (req, res) => {
  try {
    const db = req.app.get('db');
    const { subject_ids } = req.body || {};
    const ids = Array.isArray(subject_ids) ? subject_ids.map((s) => String(s).trim()).filter(Boolean) : [];
    if (ids.length === 0) return res.status(400).json({ error: '请提供 subject_ids' });
    const placeholders = ids.map(() => '?').join(',');
    db.run(`DELETE FROM study1_phase1_choice WHERE subject_id IN (${placeholders})`, ids);
    res.json({ ok: true, deleted: ids.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 导出研究一环节一打分（与筛选同步：keyword；含被试姓名）
adminRouter.get('/export/study1-phase1-scores', (req, res) => {
  try {
    const db = req.app.get('db');
    const { keyword } = req.query;
    let sql = `SELECT c.*,
      COALESCE((SELECT s.name FROM study1_subjects s WHERE s.subject_id = c.subject_id LIMIT 1),
               (SELECT p.name FROM study1_subject_plans p WHERE p.subject_id = c.subject_id LIMIT 1)) AS name
      FROM study1_phase1_choice c WHERE 1=1`;
    const params = [];
    if (keyword && String(keyword).trim()) { sql += ` AND c.subject_id LIKE ?`; params.push(`%${String(keyword).trim()}%`); }
    sql += ` ORDER BY c.id`;
    const rows = db.prepare(sql).all(...params);
    const out = rows.map((r) => {
      let scores = [];
      if (r.scores_json) {
        try {
          const data = typeof r.scores_json === 'string' ? JSON.parse(r.scores_json) : r.scores_json;
          if (Array.isArray(data)) scores = data;
        } catch (_) {}
      }
      const byNo = {};
      for (const d of scores) {
        const no = Number(d.question_no);
        if (no >= 1 && no <= 13) byNo[no] = { yours: d.your_score, ai: d.ai_score };
      }
      const row = {
        被试编号: r.subject_id,
        被试姓名: r.name ?? '',
        最终提交作品: r.chosen || '',
      };
      for (let n = 1; n <= 13; n++) {
        const s = byNo[n];
        row[`题${n}-您的作品`] = s && s.yours != null ? s.yours : '';
        row[`题${n}-AI作品`] = s && s.ai != null ? s.ai : '';
      }
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(out);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '环节一打分');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=study1_phase1_scores.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});
