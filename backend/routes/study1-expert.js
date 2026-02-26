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
  big_idea: '故事发生在超市里，那些有伤疤、长得歪的丑苹果被人嫌弃，只能待在角落。大家都嫌它们丑，没人要，只能扔在角落。结果把它们做成苏打水，一喝才发现，比那些好看的苹果还甜还香，一下子就改变了大家以貌取果的想法',
  highlight_scene: '先拍丑苹果被丢在一边，然后被放进榨汁机，咔嚓一声榨出金黄的果汁，气泡在杯子里冒。有人喝了一口，眼睛一下就亮了，嘴角忍不住往上扬，表情特别惊喜，暖黄的光打在他脸上，看着特别治愈',
  slogan: '别光看外表，丑苹果也能甜到你心里',
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
       VALUES (?, 'study1-expert', ?, 0, ?, ?)
       ON CONFLICT(visitor_id, flow) DO UPDATE SET
         ip = excluded.ip, data_json = excluded.data_json, updated_at = excluded.updated_at`,
      [progressKey, ip, dataJson, updatedAt]
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
