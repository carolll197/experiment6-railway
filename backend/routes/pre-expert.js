import { Router } from 'express';

export const preExpertRouter = Router();

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || '';
}

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

// 获取专家评分进度（同一 IP + 同一 visitor_id 可恢复）
preExpertRouter.get('/progress', (req, res) => {
  try {
    const db = req.app.get('db');
    const visitorId = req.headers['x-visitor-id'] || req.query.visitor_id || '';
    if (!visitorId.trim()) return res.json({});
    const row = db.prepare(
      'SELECT data_json FROM visitor_progress WHERE visitor_id = ? AND flow = ?'
    ).get(visitorId.trim(), 'pre-expert');
    if (!row) return res.json({});
    let data = {};
    try {
      if (row.data_json) data = JSON.parse(row.data_json);
    } catch (_) {}
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 保存专家评分进度
preExpertRouter.post('/progress', (req, res) => {
  try {
    const db = req.app.get('db');
    const visitorId = (req.headers['x-visitor-id'] || req.body?.visitor_id || '').trim();
    if (!visitorId) return res.status(400).json({ error: '缺少 visitor_id' });
    const ip = getClientIp(req);
    const { expert_name, current_subject_id, scores, is_invalid } = req.body;
    const dataJson = JSON.stringify({
      expert_name: expert_name || '',
      current_subject_id: current_subject_id || '',
      scores: scores || [],
      is_invalid: is_invalid || false,
    });
    const updatedAt = nowStr();
    db.run(
      `INSERT INTO visitor_progress (visitor_id, flow, ip, step, data_json, updated_at)
       VALUES (?, 'pre-expert', ?, 0, ?, ?)
       ON CONFLICT(visitor_id, flow) DO UPDATE SET
         ip = excluded.ip, data_json = excluded.data_json, updated_at = excluded.updated_at`,
      [visitorId, ip, dataJson, updatedAt]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 获取待评分方案列表（仅被试编号，不暴露姓名）
preExpertRouter.get('/plans', (req, res) => {
  try {
    const db = req.app.get('db');
    const rows = db
      .prepare(
        `SELECT id, subject_id, target_audience, pain_point, insight, big_idea, rationale, submitted_at, is_auto_saved
         FROM pre_subject_plans ORDER BY id`
      )
      .all();
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 提交某份方案的专家评分（每题一条，带是否无效）
// 始终写入 13 条记录（每题一条），勾选无效时也保留该专家的 13 题评分（未填题为 0），便于主试端看到评分且能识别谁标了无效
preExpertRouter.post('/scores', (req, res) => {
  try {
    const db = req.app.get('db');
    let { subject_id, expert_name, scores, is_invalid } = req.body;
    subject_id = subject_id != null ? String(subject_id).trim() : '';
    expert_name = expert_name != null ? String(expert_name).trim() : '';
    if (!subject_id) {
      return res.status(400).json({ error: '缺少 subject_id' });
    }
    const scoresArr = Array.isArray(scores) ? scores : [];
    const scoreByNo = Object.fromEntries(scoresArr.map((s) => [Number(s.question_no), s.score]));
    const del = db.prepare(
      `DELETE FROM pre_expert_scores WHERE subject_id = ? AND expert_name = ?`
    );
    del.run(subject_id, expert_name);
    const inv = (is_invalid === true || is_invalid === 1 || is_invalid === '1' || is_invalid === 'true') ? 1 : 0;
    const scoredAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const insWithTime = db.prepare(`
      INSERT INTO pre_expert_scores (subject_id, expert_name, question_no, score, is_invalid, scored_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (let question_no = 1; question_no <= 13; question_no++) {
      const score = scoreByNo[question_no] != null ? scoreByNo[question_no] : 0;
      insWithTime.run(subject_id, expert_name, question_no, score, inv, scoredAt);
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});
