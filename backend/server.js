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
import { preSubjectRouter } from './routes/pre-subject.js';
import { preExpertRouter } from './routes/pre-expert.js';
import { study1SubjectRouter } from './routes/study1-subject.js';
import { adminRouter } from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true }));
app.use(express.json());

async function start() {
  await initDb();
  const db = getDb();
  app.set('db', db);

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

  app.get('/api/health', (req, res) => {
    res.json({ ok: true });
  });

  // 生产模式：托管前端构建产物，SPA history 模式回退（放在 API 之后，避免拦截 /api/*）
  const distDir = path.join(__dirname, '..', 'frontend', 'dist');
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`API running at http://localhost:${PORT}`);
  });
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
