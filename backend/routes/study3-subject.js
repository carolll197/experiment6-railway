import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const study3SubjectRouter = Router();

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || '';
}

function getFlow(group) {
  return group === 'result' ? 'study3-result' : 'study3-process';
}

const promptPath = path.join(__dirname, '..', '..', 'materials', '提示词.txt');
const scalePath = path.join(__dirname, '..', '..', 'materials', '研究三量表.txt');

study3SubjectRouter.get('/prompt', (req, res) => {
  try {
    if (!fs.existsSync(promptPath)) return res.status(404).json({ error: '提示词文件不存在' });
    const content = fs.readFileSync(promptPath, 'utf8');
    res.json({ content });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

function parseStudy3Scale(text) {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  // 固定映射：按文档的 1-13 顺序
  const items = [];
  const map = [
    ['emotion_1', '轻松的 (Relieved)'],
    ['emotion_2', '满意的 (Satisfied)'],
    ['emotion_3', '沮丧的 (Frustrated)'],
    ['emotion_4', '失望的 (Disappointed)'],
    ['emotion_5', '愤怒/被冒犯的 (Angry / Offended)'],
    ['gap_1', 'AI 最终生成的广告方案，远远低于我最初脑海中的预期。'],
    ['gap_2', '相比于我在创作过程中的设想，AI 生成的方案让我感到落差很大。'],
    ['satisfaction_1', '总体而言，我对 AI 最终生成的这份广告方案非常满意。'],
    ['satisfaction_2', '我认为 AI 提供的这份方案很好地满足了本次广告策划的任务需求。'],
    ['satisfaction_3', '我认为 AI 给出的方案在逻辑和创意上具备很高的专业水准。'],
    ['satisfaction_4', '如果这是一次真实的商业提案，我非常愿意直接采纳并使用这套方案。'],
    ['ownership_1', '我感觉AI生成的这份广告方案，是我个人的作品。'],
    ['ownership_2', '在这份方案中，我能感受到强烈的个人印记。'],
    ['ownership_3', '我会把这份广告方案看作是我自己能力的一种体现。'],
    ['ownership_4', '即使有 AI 的参与，我依然觉得我是这份方案的“主人”。'],
    ['control_1', '在这个任务中，是“我”在主导 AI，而不是 AI 在主导我。'],
    ['control_2', '在与 AI 协作生成广告的整个过程中，我感觉自己掌控着创意的最终走向。'],
    ['control_3', '我认为自己有足够的自由度，去决定这支广告最终呈现的面貌。'],
  ];
  // 从 txt 中提取形如 "1." 的题干，若解析不到则使用固定文案兜底
  const fromTxt = [];
  for (const l of lines) {
    const m = l.match(/^\d+\.\s*(.+)$/);
    if (m) fromTxt.push(m[1].trim());
  }
  for (let i = 0; i < map.length; i++) {
    const [key, fallbackText] = map[i];
    items.push({ key, no: i + 1, text: fromTxt[i] || fallbackText });
  }
  return items;
}

study3SubjectRouter.get('/scale', (req, res) => {
  try {
    if (!fs.existsSync(scalePath)) return res.status(404).json({ error: '量表文件不存在' });
    const content = fs.readFileSync(scalePath, 'utf8');
    const items = parseStudy3Scale(content);
    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 获取研究三进度（重新部署后 deployId 变化，旧进度作废，从头开始）
study3SubjectRouter.get('/progress', (req, res) => {
  try {
    const db = req.app.get('db');
    const deployId = req.app.get('deployId');
    const visitorId = req.headers['x-visitor-id'] || req.query.visitor_id || '';
    if (!String(visitorId).trim()) return res.json({ submitted: false, step: 0 });
    const flow = getFlow(req.query.group);
    const row = db.prepare(
      'SELECT step, data_json, subject_id, name, submitted_at FROM visitor_progress WHERE visitor_id = ? AND flow = ?'
    ).get(String(visitorId).trim(), flow);
    if (!row) return res.json({ submitted: false, step: 0 });
    let data = {};
    try { if (row.data_json) data = JSON.parse(row.data_json); } catch (_) {}
    if (deployId && data.deploy_id !== deployId) return res.json({ submitted: false, step: 0 });
    if (row.submitted_at) return res.json({ submitted: true });
    res.json({ submitted: false, step: row.step ?? 0, subjectId: row.subject_id ?? '', name: row.name ?? '', data });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

study3SubjectRouter.post('/progress', (req, res) => {
  try {
    const db = req.app.get('db');
    const visitorId = (req.headers['x-visitor-id'] || req.body?.visitor_id || '').trim();
    if (!visitorId) return res.status(400).json({ error: '缺少 visitor_id' });
    const ip = getClientIp(req);
    const { step, subject_id, name, data: progressData, submitted, group_type, startTime, endTime } = req.body;
    const flow = getFlow(group_type);
    const deployId = req.app.get('deployId');
    const dataJson = JSON.stringify({ ...(progressData || {}), startTime, endTime, deploy_id: deployId });
    const updatedAt = nowStr();
    const submittedAt = submitted === true ? updatedAt : null;
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
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

study3SubjectRouter.post('/register', (req, res) => {
  try {
    const db = req.app.get('db');
    const { subject_id, name, group_type } = req.body;
    if (!subject_id || name == null) return res.status(400).json({ error: '缺少 subject_id 或 name' });
    db.run('INSERT OR REPLACE INTO study3_subjects (subject_id, name, group_type) VALUES (?, ?, ?)', [String(subject_id).trim(), String(name).trim(), group_type || 'process']);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

study3SubjectRouter.post('/cse', (req, res) => {
  try {
    const db = req.app.get('db');
    const { subject_id, group_type, scores } = req.body;
    if (!subject_id || !scores) return res.status(400).json({ error: '缺少必填字段' });
    const gt = group_type || 'process';
    db.prepare('DELETE FROM study3_cse_scores WHERE subject_id = ? AND group_type = ?').run(subject_id, gt);
    db.prepare('INSERT INTO study3_cse_scores (subject_id, group_type, q1, q2, q3, q4, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(subject_id, gt, scores[1] ?? null, scores[2] ?? null, scores[3] ?? null, scores[4] ?? null, nowStr());
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// AI 对话代理（过程组使用 Kimi/月之暗面 Moonshot API）
study3SubjectRouter.post('/chat', async (req, res) => {
  try {
    const { messages, subject_id } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: '缺少 messages' });
    }
    const freshMessages = JSON.parse(JSON.stringify(messages));
    const bearer =
      process.env.MOONSHOT_API_KEY ||
      process.env.MOONSHOT_KEY ||
      'sk-zQ8KeuKocIWJgrisTjNwXZp6Dsy4CfpW8lMdYfEkz5YWFYlf';

    // kimi-k2-0905-preview 可能会返回 429 engine overloaded；同 key 下 moonshot-v1-* 通常更稳定
    const modelFallback = ['kimi-k2-0905-preview', 'moonshot-v1-32k', 'moonshot-v1-8k'];

    let lastStatus = 500;
    let lastData = null;

    for (const model of modelFallback) {
      const resp = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bearer}`,
        },
        body: JSON.stringify({
          model,
          messages: freshMessages,
          temperature: 0.8,
        }),
      });

      const data = await resp.json().catch(() => ({}));
      if (resp.ok) return res.json(data);

      lastStatus = resp.status;
      lastData = data;
      const errType = data?.error?.type;

      // 仅对明确的“过载/限流/服务异常”进行降级；其它错误直接返回（避免掩盖鉴权/参数问题）
      const retriable =
        resp.status === 429 ||
        resp.status >= 500 ||
        errType === 'engine_overloaded_error' ||
        errType === 'rate_limit_error';

      if (!retriable) {
        console.error('[study3 chat] Moonshot API error:', resp.status, JSON.stringify(data));
        return res.status(resp.status).json(data);
      }
    }

    console.error('[study3 chat] Moonshot API error (fallback exhausted):', lastStatus, JSON.stringify(lastData));
    return res.status(lastStatus).json(lastData || { error: { message: 'Moonshot API error' } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 随机获取过程组 AI 方案（结果组用）
study3SubjectRouter.get('/random-plan', (req, res) => {
  try {
    const db = req.app.get('db');
    const plans = db.prepare(`SELECT * FROM study3_records WHERE group_type = 'process' AND (ai_big_idea IS NOT NULL AND ai_big_idea != '' OR ai_highlight_scene IS NOT NULL OR ai_slogan IS NOT NULL)`).all();
    if (!plans || plans.length === 0) return res.status(404).json({ error: '暂无可用方案' });
    const row = plans[Math.floor(Math.random() * plans.length)];
    res.json({
      subject_id: row.subject_id ?? '',
      name: row.name ?? '',
      big_idea: row.ai_big_idea ?? '',
      highlight_scene: row.ai_highlight_scene ?? '',
      slogan: row.ai_slogan ?? '',
    });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// 提交研究三记录（过程组/结果组：存 AI 方案 + 量表 + 填空 + 时间戳；过程组可带 chat_log）
study3SubjectRouter.post('/submit', (req, res) => {
  try {
    const db = req.app.get('db');
    const {
      subject_id, name, group_type,
      assigned_plan_subject_id, assigned_plan_name,
      ai_big_idea, ai_highlight_scene, ai_slogan,
      chat_log,
      scores,
      open_text,
      collab_start_time,
      ai_done_time,
      rating_start_time,
      end_time,
    } = req.body || {};
    if (!subject_id || !name) return res.status(400).json({ error: '缺少必填字段' });
    const gt = group_type || 'process';
    const submittedAt = nowStr();
    const chatLogStr = chat_log ? (typeof chat_log === 'string' ? chat_log : JSON.stringify(chat_log)) : null;
    const s = scores && typeof scores === 'object' ? scores : {};
    db.prepare('DELETE FROM study3_records WHERE subject_id = ? AND group_type = ?').run(subject_id, gt);
    db.prepare(
      `INSERT INTO study3_records
        (subject_id, name, group_type, assigned_plan_subject_id, assigned_plan_name,
         ai_big_idea, ai_highlight_scene, ai_slogan, chat_log,
         emotion_1, emotion_2, emotion_3, emotion_4, emotion_5,
         gap_1, gap_2,
         satisfaction_1, satisfaction_2, satisfaction_3, satisfaction_4,
         ownership_1, ownership_2, ownership_3, ownership_4,
         control_1, control_2, control_3,
         open_text,
         collab_start_time, ai_done_time, rating_start_time, end_time,
         submitted_at, created_at)
       VALUES
        (?, ?, ?, ?, ?,
         ?, ?, ?, ?,
         ?, ?, ?, ?, ?,
         ?, ?,
         ?, ?, ?, ?,
         ?, ?, ?, ?,
         ?, ?, ?,
         ?,
         ?, ?, ?, ?,
         ?, ?)`
    ).run(
      subject_id, name, gt, assigned_plan_subject_id ?? null, assigned_plan_name ?? null,
      ai_big_idea ?? '', ai_highlight_scene ?? '', ai_slogan ?? '', chatLogStr,
      s.emotion_1 ?? null, s.emotion_2 ?? null, s.emotion_3 ?? null, s.emotion_4 ?? null, s.emotion_5 ?? null,
      s.gap_1 ?? null, s.gap_2 ?? null,
      s.satisfaction_1 ?? null, s.satisfaction_2 ?? null, s.satisfaction_3 ?? null, s.satisfaction_4 ?? null,
      s.ownership_1 ?? null, s.ownership_2 ?? null, s.ownership_3 ?? null, s.ownership_4 ?? null,
      s.control_1 ?? null, s.control_2 ?? null, s.control_3 ?? null,
      open_text ?? '',
      collab_start_time ?? null, ai_done_time ?? null, rating_start_time ?? null, end_time ?? null,
      submittedAt, submittedAt
    );
    db.run('INSERT OR REPLACE INTO study3_subjects (subject_id, name, group_type) VALUES (?, ?, ?)', [subject_id, name, gt]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

