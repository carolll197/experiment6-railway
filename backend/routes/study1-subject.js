import { Router } from 'express';

export const study1SubjectRouter = Router();

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || '';
}

// 获取研究一进度
study1SubjectRouter.get('/progress', (req, res) => {
  try {
    const db = req.app.get('db');
    const visitorId = req.headers['x-visitor-id'] || req.query.visitor_id || '';
    if (!visitorId.trim()) return res.json({ submitted: false, step: 0 });
    const row = db.prepare(
      'SELECT step, data_json, subject_id, name, submitted_at FROM visitor_progress WHERE visitor_id = ? AND flow = ?'
    ).get(visitorId.trim(), 'study1-subject');
    if (!row) return res.json({ submitted: false, step: 0 });
    if (row.submitted_at) return res.json({ submitted: true });
    let data = {};
    try {
      if (row.data_json) data = JSON.parse(row.data_json);
    } catch (_) {}
    res.json({
      submitted: false,
      step: row.step ?? 0,
      subjectId: row.subject_id ?? '',
      name: row.name ?? '',
      data: data,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 保存研究一进度（step 为 9 时视为已完成，设置 submitted_at）
study1SubjectRouter.post('/progress', (req, res) => {
  try {
    const db = req.app.get('db');
    const visitorId = (req.headers['x-visitor-id'] || req.body?.visitor_id || '').trim();
    if (!visitorId) return res.status(400).json({ error: '缺少 visitor_id' });
    const ip = getClientIp(req);
    const { step, subject_id, name, data: progressData, submitted } = req.body;
    const dataJson = JSON.stringify(progressData || {});
    const updatedAt = nowStr();
    const isDone = step === 9 || submitted === true;
    const submittedAt = isDone ? updatedAt : null;
    db.run(
      `INSERT INTO visitor_progress (visitor_id, flow, ip, step, data_json, subject_id, name, submitted_at, updated_at)
       VALUES (?, 'study1-subject', ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(visitor_id, flow) DO UPDATE SET
         ip = excluded.ip, step = excluded.step, data_json = excluded.data_json,
         subject_id = excluded.subject_id, name = excluded.name,
         submitted_at = COALESCE(excluded.submitted_at, submitted_at), updated_at = excluded.updated_at`,
      [visitorId, ip, step ?? 0, dataJson, subject_id ?? '', name ?? '', submittedAt, updatedAt]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 被试进入实验时登记编号与姓名（主试端 CSE/环节一 显示姓名用）
study1SubjectRouter.post('/register', (req, res) => {
  try {
    const db = req.app.get('db');
    const { subject_id, name } = req.body;
    if (!subject_id || name == null) {
      return res.status(400).json({ error: '缺少 subject_id 或 name' });
    }
    db.run('INSERT OR REPLACE INTO study1_subjects (subject_id, name) VALUES (?, ?)', [String(subject_id).trim(), String(name).trim()]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 提交 CSE 量表得分
study1SubjectRouter.post('/cse', (req, res) => {
  try {
    const db = req.app.get('db');
    const { subject_id, scores } = req.body;
    if (!subject_id || !scores) {
      return res.status(400).json({ error: '缺少必填字段' });
    }
    // 幂等：先删除该被试的旧记录再插入
    const delStmt = db.prepare('DELETE FROM study1_cse_scores WHERE subject_id = ?');
    delStmt.run(subject_id);
    const insStmt = db.prepare(
      'INSERT INTO study1_cse_scores (subject_id, q1, q2, q3, q4, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    );
    // 处理前端提交的对象格式数据
    insStmt.run(subject_id, scores[1] ?? null, scores[2] ?? null, scores[3] ?? null, scores[4] ?? null, nowStr());
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 提交研究一被试方案（环节一 / 环节二题目2 / 环节二题目3）
study1SubjectRouter.post('/submit', (req, res) => {
  try {
    const db = req.app.get('db');
    const {
      subject_id,
      name,
      phase,
      question_no,
      target_audience,
      pain_point,
      insight,
      big_idea,
      rationale,
      is_auto_saved = 0,
    } = req.body;
    if (!subject_id || !name || !phase || question_no == null) {
      return res.status(400).json({ error: '缺少必填字段' });
    }
    // 幂等：相同被试+phase+question_no只保留最新提交
    db.run(
      'DELETE FROM study1_subject_plans WHERE subject_id = ? AND phase = ? AND question_no = ?',
      [subject_id, phase, question_no]
    );
    const stmt = db.prepare(`
      INSERT INTO study1_subject_plans
        (subject_id, name, phase, question_no, target_audience, pain_point, insight, big_idea, rationale, submitted_at, is_auto_saved)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      subject_id,
      name,
      phase,
      question_no,
      target_audience ?? '',
      pain_point ?? '',
      insight ?? '',
      big_idea ?? '',
      rationale ?? '',
      nowStr(),
      is_auto_saved ? 1 : 0
    );
    // 同步被试姓名到 study1_subjects，供主试端 CSE / 环节一选择 显示
    db.run('INSERT OR REPLACE INTO study1_subjects (subject_id, name) VALUES (?, ?)', [subject_id, name]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 环节一：最终提交作品选择 + 打分
study1SubjectRouter.post('/phase1-choice', (req, res) => {
  try {
    const db = req.app.get('db');
    const { subject_id, chosen, scores_json } = req.body;
    if (!subject_id || !chosen) {
      return res.status(400).json({ error: '缺少 subject_id 或 chosen' });
    }
    // 幂等：同一被试只保留最新选择
    db.run('DELETE FROM study1_phase1_choice WHERE subject_id = ?', [subject_id]);
    const stmt = db.prepare(`
      INSERT INTO study1_phase1_choice (subject_id, chosen, scores_json, created_at)
      VALUES (?, ?, ?, ?)
    `);
    const scoresStr = scores_json ? (typeof scores_json === 'string' ? scores_json : JSON.stringify(scores_json)) : null;
    stmt.run(subject_id, chosen, scoresStr, nowStr());
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});
