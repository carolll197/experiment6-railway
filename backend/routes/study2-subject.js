import { Router } from 'express';

export const study2SubjectRouter = Router();

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || '';
}

function getFlow(group) {
  return group === 'result' ? 'study2-result' : 'study2-process';
}

// 获取研究二进度
study2SubjectRouter.get('/progress', (req, res) => {
  try {
    const db = req.app.get('db');
    const visitorId = req.headers['x-visitor-id'] || req.query.visitor_id || '';
    if (!visitorId.trim()) return res.json({ submitted: false, step: 0 });
    const flow = getFlow(req.query.group);
    const row = db.prepare(
      'SELECT step, data_json, subject_id, name, submitted_at FROM visitor_progress WHERE visitor_id = ? AND flow = ?'
    ).get(visitorId.trim(), flow);
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
      startTime: data.startTime || null,
      endTime: data.endTime || null,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 保存研究二进度
study2SubjectRouter.post('/progress', (req, res) => {
  try {
    const db = req.app.get('db');
    const visitorId = (req.headers['x-visitor-id'] || req.body?.visitor_id || '').trim();
    if (!visitorId) return res.status(400).json({ error: '缺少 visitor_id' });
    const ip = getClientIp(req);
    const { step, subject_id, name, data: progressData, submitted, startTime, endTime, group_type } = req.body;
    const flow = getFlow(group_type);
    const dataJson = JSON.stringify({
      ...(progressData || {}),
      startTime: startTime,
      endTime: endTime,
    });
    const updatedAt = nowStr();
    const isDone = submitted === true;
    const submittedAt = isDone ? updatedAt : null;
    db.run(
      `INSERT INTO visitor_progress (visitor_id, flow, ip, step, data_json, subject_id, name, submitted_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(visitor_id, flow) DO UPDATE SET
         ip = excluded.ip, step = excluded.step, data_json = excluded.data_json,
         subject_id = excluded.subject_id, name = excluded.name,
         submitted_at = COALESCE(excluded.submitted_at, submitted_at), updated_at = excluded.updated_at`,
      [visitorId, flow, ip, step ?? 0, dataJson, subject_id ?? '', name ?? '', submittedAt, updatedAt]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 被试注册
study2SubjectRouter.post('/register', (req, res) => {
  try {
    const db = req.app.get('db');
    const { subject_id, name, group_type } = req.body;
    if (!subject_id || name == null) {
      return res.status(400).json({ error: '缺少 subject_id 或 name' });
    }
    db.run(
      'INSERT OR REPLACE INTO study2_subjects (subject_id, name, group_type) VALUES (?, ?, ?)',
      [String(subject_id).trim(), String(name).trim(), group_type || 'process']
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 提交 CSE 量表得分
study2SubjectRouter.post('/cse', (req, res) => {
  try {
    const db = req.app.get('db');
    const { subject_id, group_type, scores } = req.body;
    if (!subject_id || !scores) {
      return res.status(400).json({ error: '缺少必填字段' });
    }
    const gt = group_type || 'process';
    db.prepare('DELETE FROM study2_cse_scores WHERE subject_id = ? AND group_type = ?').run(subject_id, gt);
    db.prepare(
      'INSERT INTO study2_cse_scores (subject_id, group_type, q1, q2, q3, q4, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(subject_id, gt, scores[1] ?? null, scores[2] ?? null, scores[3] ?? null, scores[4] ?? null, nowStr());
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 提交研究二方案
study2SubjectRouter.post('/submit', (req, res) => {
  try {
    const db = req.app.get('db');
    const {
      subject_id,
      name,
      group_type,
      big_idea,
      highlight_scene,
      slogan,
      is_auto_saved = 0,
      startTime,
      endTime,
      ai_done_time,
      chat_log,
    } = req.body;
    if (!subject_id || !name) {
      return res.status(400).json({ error: '缺少必填字段' });
    }
    const gt = group_type || 'process';
    db.run(
      'DELETE FROM study2_subject_plans WHERE subject_id = ? AND group_type = ?',
      [subject_id, gt]
    );
    const submittedAt = nowStr();
    const chatLogStr = chat_log ? (typeof chat_log === 'string' ? chat_log : JSON.stringify(chat_log)) : null;
    db.prepare(`
      INSERT INTO study2_subject_plans
        (subject_id, name, group_type, big_idea, highlight_scene, slogan, submitted_at, is_auto_saved, created_at, start_time, end_time, ai_done_time, chat_log)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      subject_id,
      name,
      gt,
      big_idea ?? '',
      highlight_scene ?? '',
      slogan ?? '',
      submittedAt,
      is_auto_saved ? 1 : 0,
      submittedAt,
      startTime || submittedAt,
      endTime || submittedAt,
      ai_done_time || null,
      chatLogStr
    );
    db.run('INSERT OR REPLACE INTO study2_subjects (subject_id, name, group_type) VALUES (?, ?, ?)', [subject_id, name, gt]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 提交后测量表
study2SubjectRouter.post('/posttest', (req, res) => {
  try {
    const db = req.app.get('db');
    const { subject_id, group_type, scores } = req.body;
    if (!subject_id || !scores) {
      return res.status(400).json({ error: '缺少必填字段' });
    }
    const gt = group_type || 'process';
    db.prepare('DELETE FROM study2_posttest WHERE subject_id = ? AND group_type = ?').run(subject_id, gt);
    db.prepare(`
      INSERT INTO study2_posttest
        (subject_id, group_type, emotion_1, emotion_2, emotion_3, emotion_4, emotion_5,
         gap_1, gap_2, effort_1, effort_2,
         ownership_1, ownership_2, ownership_3, ownership_4,
         control_1, control_2, control_3, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      subject_id, gt,
      scores.emotion_1 ?? null, scores.emotion_2 ?? null, scores.emotion_3 ?? null, scores.emotion_4 ?? null, scores.emotion_5 ?? null,
      scores.gap_1 ?? null, scores.gap_2 ?? null,
      scores.effort_1 ?? null, scores.effort_2 ?? null,
      scores.ownership_1 ?? null, scores.ownership_2 ?? null, scores.ownership_3 ?? null, scores.ownership_4 ?? null,
      scores.control_1 ?? null, scores.control_2 ?? null, scores.control_3 ?? null,
      nowStr()
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// AI 对话代理（过程组使用 Kimi/Moonshot API）
study2SubjectRouter.post('/chat', async (req, res) => {
  try {
    const { messages, subject_id } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: '缺少 messages' });
    }
    const resp = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer sk-AOLeSbacJoud5KTCvpKVhmsNCiVOwYXMuIQE3NCbuTmBm0Js',
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: messages,
        temperature: 0.8,
      }),
    });
    const data = await resp.json();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 随机获取过程组方案（结果组使用）
study2SubjectRouter.get('/random-plan', (req, res) => {
  try {
    const db = req.app.get('db');
    const plans = db.prepare(
      'SELECT * FROM study2_subject_plans WHERE group_type = ?'
    ).all('process');
    if (!plans || plans.length === 0) {
      return res.status(404).json({ error: '暂无可用方案' });
    }
    const idx = Math.floor(Math.random() * plans.length);
    res.json(plans[idx]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});
