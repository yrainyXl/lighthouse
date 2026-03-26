import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const defaultDbPath = path.resolve(process.cwd(), process.env.SQLITE_DB_PATH || 'server/data/lighthouse.db');
fs.mkdirSync(path.dirname(defaultDbPath), { recursive: true });

const db = new Database(defaultDbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS ledger_transaction (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  type TEXT,
  category TEXT,
  account TEXT,
  payee TEXT,
  amount REAL NOT NULL DEFAULT 0,
  currency TEXT,
  note TEXT,
  raw_notion TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ledger_transaction_date ON ledger_transaction(date);

CREATE TABLE IF NOT EXISTS ledger_aggregation_daily (
  date TEXT PRIMARY KEY,
  stats_json TEXT NOT NULL,
  ai_summary TEXT NOT NULL,
  ai_used INTEGER NOT NULL DEFAULT 0,
  ai_error TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS category_mapping (
  raw_label TEXT PRIMARY KEY,
  normalized_category TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 0.5,
  created_by TEXT NOT NULL DEFAULT 'manual',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS budget_rule (
  category TEXT PRIMARY KEY,
  amount REAL NOT NULL DEFAULT 0,
  period TEXT NOT NULL DEFAULT 'month',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS interest_topic (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS article_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT NOT NULL,
  date TEXT NOT NULL,
  articles_json TEXT NOT NULL,
  ai_insight TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(topic, date)
);
`);

function normalizeDate(input) {
  if (!input) return '';
  return String(input).split('T')[0];
}

export function getTransactionsByDate(date) {
  const day = normalizeDate(date);
  return db
    .prepare(
      `SELECT id, date, type, category, account, payee, amount, currency, note
       FROM ledger_transaction
       WHERE date = ?
       ORDER BY date DESC, created_at DESC`,
    )
    .all(day);
}

export function getTransactionsByRange(from, to) {
  const fromDate = normalizeDate(from);
  const toDate = normalizeDate(to);
  return db
    .prepare(
      `SELECT id, date, type, category, account, payee, amount, currency, note
       FROM ledger_transaction
       WHERE date >= ? AND date <= ?
       ORDER BY date DESC, created_at DESC`,
    )
    .all(fromDate, toDate);
}

export function getLatestTransactionCreatedAtByDate(date) {
  const day = normalizeDate(date);
  const row = db
    .prepare(
      `SELECT MAX(created_at) AS latest_created_at
       FROM ledger_transaction
       WHERE date = ?`,
    )
    .get(day);
  return row?.latest_created_at || null;
}

export function replaceTransactionsByDate(date, transactions) {
  const day = normalizeDate(date);
  const now = new Date().toISOString();
  const deleteStmt = db.prepare(`DELETE FROM ledger_transaction WHERE date = ?`);
  const insertStmt = db.prepare(
    `INSERT OR REPLACE INTO ledger_transaction
      (id, date, type, category, account, payee, amount, currency, note, raw_notion, created_at)
     VALUES
      (@id, @date, @type, @category, @account, @payee, @amount, @currency, @note, @raw_notion, @created_at)`,
  );

  const tx = db.transaction((rows) => {
    deleteStmt.run(day);
    for (const row of rows) {
      insertStmt.run({
        id: row.id,
        date: normalizeDate(row.date),
        type: row.type || '',
        category: row.category || '',
        account: row.account || '',
        payee: row.payee || '',
        amount: Number(row.amount || 0),
        currency: row.currency || 'CNY',
        note: row.note || '',
        raw_notion: JSON.stringify(row.raw || null),
        created_at: now,
      });
    }
  });
  tx(transactions);
}

export function upsertTransactions(transactions) {
  const now = new Date().toISOString();
  const insertStmt = db.prepare(
    `INSERT OR REPLACE INTO ledger_transaction
      (id, date, type, category, account, payee, amount, currency, note, raw_notion, created_at)
     VALUES
      (@id, @date, @type, @category, @account, @payee, @amount, @currency, @note, @raw_notion, @created_at)`,
  );
  const tx = db.transaction((rows) => {
    for (const row of rows) {
      insertStmt.run({
        id: row.id,
        date: normalizeDate(row.date),
        type: row.type || '',
        category: row.category || '',
        account: row.account || '',
        payee: row.payee || '',
        amount: Number(row.amount || 0),
        currency: row.currency || 'CNY',
        note: row.note || '',
        raw_notion: JSON.stringify(row.raw || null),
        created_at: now,
      });
    }
  });
  tx(transactions);
}

export function getDailyAggregation(date) {
  const day = normalizeDate(date);
  const row = db
    .prepare(
      `SELECT date, stats_json, ai_summary, ai_used, ai_error, created_at
       FROM ledger_aggregation_daily
       WHERE date = ?`,
    )
    .get(day);
  if (!row) return null;
  return {
    date: row.date,
    aggregation: JSON.parse(row.stats_json),
    summary: row.ai_summary,
    aiUsed: !!row.ai_used,
    aiError: row.ai_error || undefined,
    updatedAt: row.created_at,
  };
}

export function saveDailyAggregation(date, payload) {
  const day = normalizeDate(date);
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO ledger_aggregation_daily(date, stats_json, ai_summary, ai_used, ai_error, created_at)
     VALUES(@date, @stats_json, @ai_summary, @ai_used, @ai_error, @created_at)
     ON CONFLICT(date) DO UPDATE SET
       stats_json = excluded.stats_json,
       ai_summary = excluded.ai_summary,
       ai_used = excluded.ai_used,
       ai_error = excluded.ai_error,
       created_at = excluded.created_at`,
  ).run({
    date: day,
    stats_json: JSON.stringify(payload.aggregation),
    ai_summary: payload.summary || '',
    ai_used: payload.aiUsed ? 1 : 0,
    ai_error: payload.aiError || null,
    created_at: now,
  });
}

export function getCategoryMapping(rawLabel) {
  if (!rawLabel) return null;
  const row = db
    .prepare(
      `SELECT raw_label, normalized_category, weight, created_by, created_at, updated_at
       FROM category_mapping
       WHERE raw_label = ?`,
    )
    .get(rawLabel);
  if (!row) return null;
  return row;
}

export function getBudgetRules() {
  return db
    .prepare(
      `SELECT category, amount, period, created_at, updated_at
       FROM budget_rule
       WHERE period = 'month'
       ORDER BY category`,
    )
    .all();
}

export function saveBudgetRules(rules) {
  const now = new Date().toISOString();
  const insertStmt = db.prepare(
    `INSERT INTO budget_rule(category, amount, period, created_at, updated_at)
     VALUES(@category, @amount, 'month', @now, @now)`,
  );
  const deleteStmt = db.prepare(`DELETE FROM budget_rule WHERE period = 'month'`);
  const tx = db.transaction((rows) => {
    deleteStmt.run();
    for (const r of rows) {
      const cat = String(r?.category ?? '').trim();
      const amount = Number(r?.amount ?? 0);
      if (!cat) continue;
      insertStmt.run({ category: cat, amount, now });
    }
  });
  tx(rules);
}

// ── 兴趣话题 ──────────────────────────────────────────────────────────────────

export function getTopics() {
  return db.prepare(`SELECT id, name, created_at FROM interest_topic ORDER BY created_at ASC`).all();
}

export function addTopic(name) {
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO interest_topic(name, created_at) VALUES(?, ?)`).run(name.trim(), now);
}

export function deleteTopic(id) {
  db.prepare(`DELETE FROM interest_topic WHERE id = ?`).run(id);
}

// ── 文章缓存 ──────────────────────────────────────────────────────────────────

export function getArticleCache(topic, date) {
  return db
    .prepare(`SELECT articles_json, ai_insight FROM article_cache WHERE topic = ? AND date = ?`)
    .get(topic, date);
}

export function saveArticleCache(topic, date, articles, aiInsight) {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO article_cache(topic, date, articles_json, ai_insight, created_at)
     VALUES(?, ?, ?, ?, ?)
     ON CONFLICT(topic, date) DO UPDATE SET articles_json=excluded.articles_json, ai_insight=excluded.ai_insight, created_at=excluded.created_at`,
  ).run(topic, date, JSON.stringify(articles), aiInsight ?? null, now);
}

