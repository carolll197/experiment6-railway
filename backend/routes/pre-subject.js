import { Router } from 'express';

export const preSubjectRouter = Router();

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || '';
}

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

// 获取进度（同一 IP + 同一 visitor_id 可恢复）
preSubjectRouter.get('/progress', (req, res) => {
  try {
    const db = req.app.get('db');
    const visitorId = req.headers['x-visitor-id'] || req.query.visitor_id || '';
    if (!visitorId.trim()) return res.json({ submitted: false, step: 0 });
    const ip = getClientIp(req);
    const row = db.prepare(
      'SELECT step, data_json, subject_id, name, submitted_at FROM visitor_progress WHERE visitor_id = ? AND flow = ?'
    ).get(visitorId.trim(), 'pre-subject');
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
      creativeForm: data.creativeForm || {},
      timerRemaining: data.timerRemaining != null ? Number(data.timerRemaining) : null,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 保存进度
preSubjectRouter.post('/progress', (req, res) => {
  try {
    const db = req.app.get('db');
    const visitorId = (req.headers['x-visitor-id'] || req.body?.visitor_id || '').trim();
    if (!visitorId) return res.status(400).json({ error: '缺少 visitor_id' });
    const ip = getClientIp(req);
    const { step, subject_id, name, creativeForm, timerRemaining, submitted } = req.body;
    const dataJson = JSON.stringify({
      creativeForm: creativeForm || {},
      timerRemaining: timerRemaining != null ? Number(timerRemaining) : undefined,
    });
    const updatedAt = nowStr();
    const submittedAt = submitted ? updatedAt : null;
    db.run(
      `INSERT INTO visitor_progress (visitor_id, flow, ip, step, data_json, subject_id, name, submitted_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(visitor_id, flow) DO UPDATE SET
         ip = excluded.ip, step = excluded.step, data_json = excluded.data_json,
         subject_id = excluded.subject_id, name = excluded.name,
         submitted_at = COALESCE(excluded.submitted_at, submitted_at), updated_at = excluded.updated_at`,
      [visitorId, 'pre-subject', ip, step ?? 0, dataJson, subject_id ?? '', name ?? '', submittedAt, updatedAt]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 提交预实验被试方案
preSubjectRouter.post('/submit', (req, res) => {
  try {
    const db = req.app.get('db');
    const visitorId = (req.headers['x-visitor-id'] || req.body?.visitor_id || '').trim();
    const {
      subject_id,
      name,
      target_audience,
      pain_point,
      insight,
      big_idea,
      rationale,
      is_auto_saved = 0,
    } = req.body;
    if (!subject_id || !name) {
      return res.status(400).json({ error: '缺少被试编号或姓名' });
    }
    const submittedAt = nowStr();
    // 幂等：同一被试只保留最新提交
    db.run('DELETE FROM pre_subject_plans WHERE subject_id = ?', [subject_id]);
    const stmt = db.prepare(`
      INSERT INTO pre_subject_plans
        (subject_id, name, target_audience, pain_point, insight, big_idea, rationale, submitted_at, is_auto_saved)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      subject_id,
      name,
      target_audience ?? '',
      pain_point ?? '',
      insight ?? '',
      big_idea ?? '',
      rationale ?? '',
      submittedAt,
      is_auto_saved ? 1 : 0
    );
    // 若带 visitor_id，标记该访客已提交，再次进入时跳转感谢页
    if (visitorId) {
      db.run(
        `INSERT INTO visitor_progress (visitor_id, flow, ip, step, data_json, subject_id, name, submitted_at, updated_at)
         VALUES (?, 'pre-subject', ?, 4, '{}', ?, ?, ?, ?)
         ON CONFLICT(visitor_id, flow) DO UPDATE SET submitted_at = excluded.submitted_at, updated_at = excluded.updated_at`,
        [visitorId, getClientIp(req), subject_id, name, submittedAt, submittedAt]
      );
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});
