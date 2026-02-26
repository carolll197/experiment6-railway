import { Router } from 'express';

export const study1ExpertRouter = Router();

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || '';
}

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function getExpertProgressKey(req) {
  const q = req.query || {};
  const body = req.body || {};
  const expertName = (body.expert_name != null ? body.expert_name : q.expert_name) != null
    ? String(body.expert_name != null ? body.expert_name : q.expert_name).trim()
    : '';
  if (expertName) return 'study1-expert-' + expertName;
  return (req.headers['x-visitor-id'] || body.visitor_id || q.visitor_id || '').trim();
}

// 中位作品（原作，呈现给专家评分）；subject_id 在 /plans 中动态设为 max(被试编号)+1
const MEDIAN_WORK_BODY = {
  id: -1,
  name: '中位作品',
  phase: '环节一',
  question_no: 1,
  big_idea: '这支广告的核心脑洞如下：\n- 场景/世界观设定： 设定在一个"颜值即正义"的苹果世界里，长得丑、有伤疤的苹果全被当成次品，面临被送去当饲料的命运。\n- 角色： 主角是一只满是伤疤的丑苹果。\n- 核心故事线/反转： 丑苹果发现自己的伤疤里，其实藏着更甜的味道。最终，丑苹果苏打水将它真实的"伤疤履历"印在了瓶身标签上，向大众传递出明确的信息：别光看脸，不完美的外表下，藏着更棒的甜。',
  highlight_scene: '满是伤疤的丑苹果被丢进次品筐中。此时镜头拉近，特写果皮上的旧伤：琥珀色的糖液从疤痕里渗出来，像小泪珠在果皮上滚。随后，一束暖光照过来，它被榨成一杯果汁。',
  slogan: '伤疤里的甜，才是真的。',
  submitted_at: '',
  is_auto_saved: 0,
};

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

study1ExpertRouter.get('/progress', (req, res) => {
  try {
    const db = req.app.get('db');
    const progressKey = getExpertProgressKey(req);
    if (!progressKey) return res.json({});
    const row = db.prepare(
      'SELECT data_json FROM visitor_progress WHERE visitor_id = ? AND flow = ?'
    ).get(progressKey, 'study1-expert');
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

study1ExpertRouter.post('/progress', (req, res) => {
  try {
    const db = req.app.get('db');
    const progressKey = getExpertProgressKey(req);
    if (!progressKey) return res.status(400).json({ error: '请提供 expert_name 或 visitor_id' });
    const ip = getClientIp(req);
    const { expert_name, step, current_subject_id, scores_by_subject } = req.body;
    const dataJson = JSON.stringify({
      expert_name: expert_name || '',
      step: step != null ? Number(step) : 0,
      current_subject_id: current_subject_id != null ? String(current_subject_id) : '',
      scores_by_subject: scores_by_subject && typeof scores_by_subject === 'object' ? scores_by_subject : {},
    });
    const updatedAt = nowStr();
    const stepNum = step != null ? Number(step) : 0;
    db.run(
      `INSERT INTO visitor_progress (visitor_id, flow, ip, step, data_json, updated_at)
       VALUES (?, 'study1-expert', ?, ?, ?, ?)
       ON CONFLICT(visitor_id, flow) DO UPDATE SET
         ip = excluded.ip, step = excluded.step, data_json = excluded.data_json, updated_at = excluded.updated_at`,
      [progressKey, ip, stepNum, dataJson, updatedAt]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 获取待评分方案（环节一被试方案 + 中位作品，随机排序）
study1ExpertRouter.get('/plans', (req, res) => {
  try {
    const db = req.app.get('db');
    const rows = db.prepare("SELECT * FROM study1_subject_plans WHERE phase = '环节一' ORDER BY id").all();

    // 中位作品编号 = 目前所有被试编号最大值 + 1
    const maxNum = rows.length === 0 ? 0 : Math.max(...rows.map((r) => Number(r.subject_id) || 0));
    const medianSubjectId = String(maxNum + 1);
    const medianWork = { ...MEDIAN_WORK_BODY, subject_id: medianSubjectId };

    const allPlans = [...rows, medianWork];
    const shuffled = shuffle(allPlans);
    res.json(shuffled);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 提交专家评分（每题一条，共11题）
study1ExpertRouter.post('/scores', (req, res) => {
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
      `DELETE FROM study1_expert_scores WHERE subject_id = ? AND expert_name = ?`
    );
    del.run(subject_id, expert_name);
    const inv = (is_invalid === true || is_invalid === 1 || is_invalid === '1' || is_invalid === 'true') ? 1 : 0;
    const scoredAt = nowStr();
    const ins = db.prepare(`
      INSERT INTO study1_expert_scores (subject_id, expert_name, question_no, score, is_invalid, scored_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (let question_no = 1; question_no <= 11; question_no++) {
      const score = scoreByNo[question_no] != null ? scoreByNo[question_no] : 0;
      ins.run(subject_id, expert_name, question_no, score, inv, scoredAt);
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});
