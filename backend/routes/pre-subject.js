import { Router } from 'express';

export const preSubjectRouter = Router();

// 提交预实验被试方案
preSubjectRouter.post('/submit', (req, res) => {
  try {
    const db = req.app.get('db');
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
    const submittedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
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
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});
