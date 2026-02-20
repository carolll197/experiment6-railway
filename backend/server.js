/**
 * 广告创意生成心理学研究实验平台 - 后端 API
 * 统一数据存储，支持预实验 / 研究一 被试与专家数据
 */
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { initDb, getDb } from './db.js';
import { getPrePlansFromExcel } from './lib/prePlansExcel.js';
import { preSubjectRouter } from './routes/pre-subject.js';
import { preExpertRouter } from './routes/pre-expert.js';
import { study1SubjectRouter } from './routes/study1-subject.js';
import { adminRouter } from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
// Railway 会注入 PORT，必须使用且需监听 0.0.0.0
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({ origin: true }));
app.use(express.json());

// 尽早注册健康检查，便于平台探测
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

async function start() {
  console.log('[start] PORT=%s (from env: %s)', PORT, process.env.PORT || '(none)');

  await initDb();
  const db = getDb();
  app.set('db', db);

  // 启动时自动从 Excel 导入预实验方案，覆盖旧数据
  try {
    const excelRows = getPrePlansFromExcel();
    if (excelRows.length > 0) {
      db.run('DELETE FROM pre_subject_plans', []);
      const ins = db.prepare(`
        INSERT INTO pre_subject_plans (subject_id, name, target_audience, pain_point, insight, big_idea, rationale, submitted_at, is_auto_saved, created_at, start_time, end_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      for (const r of excelRows) {
        const sid = r.subject_id != null ? String(r.subject_id).trim() : '';
        if (!sid) continue;
        ins.run(
          sid,
          r.name ?? '',
          r.target_audience ?? '',
          r.pain_point ?? '',
          r.insight ?? '',
          r.big_idea ?? '',
          r.rationale ?? '',
          r.submitted_at || now,
          r.is_auto_saved ? 1 : 0,
          r.submitted_at || now,
          r.start_time || r.submitted_at || now,
          r.end_time || r.submitted_at || now
        );
      }
      console.log('[start] 已从 Excel 导入 %d 条预实验方案到 pre_subject_plans', excelRows.length);
    } else {
      console.log('[start] 未找到预实验方案 Excel 或文件为空，跳过导入');
    }
  } catch (e) {
    console.error('[start] Excel 导入失败:', e.message);
  }

  app.use('/api/pre-subject', preSubjectRouter);
  app.use('/api/pre-expert', preExpertRouter);
  app.use('/api/study1-subject', study1SubjectRouter);
  app.use('/api/admin', adminRouter);

  // 显式注册研究一 CSE 接口，避免被静态或 catch-all 拦截导致 404
  app.get('/api/admin/study1/cse', (req, res) => {
    try {
      const database = req.app.get('db');
      const { keyword } = req.query;
      let sql = `SELECT id, subject_id, q1, q2, q3, q4, created_at FROM study1_cse_scores WHERE 1=1`;
      const params = [];
      if (keyword && String(keyword).trim()) {
        sql += ` AND subject_id LIKE ?`;
        params.push(`%${String(keyword).trim()}%`);
      }
      sql += ` ORDER BY id`;
      const rows = database.prepare(sql).all(...params);
      res.json(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: String(e.message) });
    }
  });

  // 生产模式：托管前端构建产物，SPA history 模式回退（放在 API 之后，避免拦截 /api/*）
  const distDir = path.join(__dirname, '..', 'frontend', 'dist');
  const indexHtml = path.join(distDir, 'index.html');
  const distExists = fs.existsSync(distDir);
  const indexExists = fs.existsSync(indexHtml);
  console.log('[start] frontend dist: %s (exists: %s, index.html: %s)', distDir, distExists, indexExists);

  if (distExists) {
    app.use(express.static(distDir));
    app.get('*', (req, res) => {
      res.sendFile(indexHtml, (err) => {
        if (err) res.status(500).send('Frontend index not found');
      });
    });
  } else {
    app.get('/', (req, res) => {
      res.send('<p>Frontend not built. Check deployment logs.</p><p><a href="/api/health">/api/health</a></p>');
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log('Listening on 0.0.0.0:%s', PORT);
  });
}

start().catch((e) => {
  console.error('Start failed:', e);
  process.exit(1);
});
