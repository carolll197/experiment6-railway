/**
 * 统一数据库连接（sql.js，纯 JS，无需本地编译）
 * 数据持久化到 backend/data/experiment.db
 */
import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'data', 'experiment.db');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

let rawDb = null;
let db = null;

async function loadDb() {
  if (rawDb) return rawDb;
  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const data = new Uint8Array(fs.readFileSync(dbPath));
    rawDb = new SQL.Database(data);
  } else {
    rawDb = new SQL.Database();
  }
  return rawDb;
}

function saveDb() {
  if (!rawDb) return;
  const data = rawDb.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

export async function initDb() {
  await loadDb();
  runSchema();
  db = {
    run(sql, params = []) {
      rawDb.run(sql, params);
      saveDb();
    },
    prepare(sql) {
      return {
        run(...params) {
          rawDb.run(sql, params);
          saveDb();
        },
        all(...params) {
          const stmt = rawDb.prepare(sql);
          stmt.bind(params);
          const rows = [];
          while (stmt.step()) rows.push(stmt.getAsObject());
          stmt.free();
          return rows;
        },
        get(...params) {
          const arr = this.all(...params);
          return arr[0] || null;
        },
      };
    },
  };
  return db;
}

function runSchema() {
  const schema = `
  CREATE TABLE IF NOT EXISTS pre_subject_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id TEXT NOT NULL,
    name TEXT NOT NULL,
    target_audience TEXT,
    pain_point TEXT,
    insight TEXT,
    big_idea TEXT,
    rationale TEXT,
    submitted_at TEXT,
    is_auto_saved INTEGER DEFAULT 0,
    created_at TEXT,
    start_time TEXT,
    end_time TEXT
  );
  CREATE TABLE IF NOT EXISTS pre_expert_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id TEXT NOT NULL,
    expert_name TEXT NOT NULL,
    question_no INTEGER NOT NULL,
    score INTEGER NOT NULL,
    is_invalid INTEGER DEFAULT 0,
    scored_at TEXT
  );
  CREATE TABLE IF NOT EXISTS study1_subjects (
    subject_id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS study1_subject_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id TEXT NOT NULL,
    name TEXT NOT NULL,
    phase TEXT NOT NULL,
    question_no INTEGER NOT NULL,
    target_audience TEXT,
    pain_point TEXT,
    insight TEXT,
    big_idea TEXT,
    rationale TEXT,
    submitted_at TEXT,
    is_auto_saved INTEGER DEFAULT 0,
    created_at TEXT,
    start_time TEXT,
    end_time TEXT
  );
  CREATE TABLE IF NOT EXISTS study1_cse_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id TEXT NOT NULL,
    q1 INTEGER,
    q2 INTEGER,
    q3 INTEGER,
    q4 INTEGER,
    created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS study1_phase1_choice (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id TEXT NOT NULL,
    chosen TEXT NOT NULL,
    scores_json TEXT,
    created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS study1_expert_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id TEXT NOT NULL,
    expert_name TEXT NOT NULL,
    question_no INTEGER NOT NULL,
    score INTEGER NOT NULL,
    is_invalid INTEGER DEFAULT 0,
    scored_at TEXT
  );
  CREATE TABLE IF NOT EXISTS visitor_progress (
    visitor_id TEXT NOT NULL,
    flow TEXT NOT NULL,
    ip TEXT,
    step INTEGER DEFAULT 0,
    data_json TEXT,
    subject_id TEXT,
    name TEXT,
    submitted_at TEXT,
    updated_at TEXT,
    PRIMARY KEY (visitor_id, flow)
  );
  `;
  rawDb.exec(schema);

  // 为已存在的旧表补齐可能缺失的列（CREATE TABLE IF NOT EXISTS 不会更新旧表）
  const migrations = [
    ['pre_subject_plans', 'start_time', 'TEXT'],
    ['pre_subject_plans', 'end_time', 'TEXT'],
    ['pre_subject_plans', 'highlight_scene', 'TEXT'],
    ['pre_subject_plans', 'slogan', 'TEXT'],
    ['study1_subject_plans', 'start_time', 'TEXT'],
    ['study1_subject_plans', 'end_time', 'TEXT'],
    ['study1_subject_plans', 'highlight_scene', 'TEXT'],
    ['study1_subject_plans', 'slogan', 'TEXT'],
  ];
  for (const [table, col, type] of migrations) {
    try {
      rawDb.run(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
    } catch (_) {
      // 列已存在则忽略
    }
  }

  // 回填 study1_subjects：从已有方案表取每个被试的姓名（任选一条）
  try {
    const backfill = rawDb.prepare(`
      INSERT OR REPLACE INTO study1_subjects (subject_id, name)
      SELECT subject_id, name FROM study1_subject_plans GROUP BY subject_id
    `);
    backfill.run();
  } catch (_) {}
  saveDb();
}

export function getDb() {
  return db;
}
