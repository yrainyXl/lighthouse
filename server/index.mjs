import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  getDailyAggregation,
  getTransactionsByDate,
  getTransactionsByRange,
  replaceTransactionsByDate,
  saveDailyAggregation,
  upsertTransactions,
  getCategoryMapping,
  getLatestTransactionCreatedAtByDate,
  getBudgetRules,
  saveBudgetRules,
} from './db.mjs';
import { analyzeLedgerWithAi, getBudgetTip, generateTopicInsight } from './siliconflowClient.mjs';
import { createNotionClient, queryDatabase } from './notionClient.mjs';
import { searchArticles } from './serperClient.mjs';
import {
  getTopics,
  addTopic,
  deleteTopic,
  getArticleCache,
  saveArticleCache,
} from './db.mjs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

function mustGetEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`缺少环境变量：${name}`);
  return value;
}

function getPropText(prop) {
  if (!prop) return '';
  if (prop.type === 'title') return (prop.title ?? []).map(t => t.plain_text).join('');
  if (prop.type === 'rich_text') return (prop.rich_text ?? []).map(t => t.plain_text).join('');
  if (prop.type === 'select') return prop.select?.name ?? '';
  if (prop.type === 'multi_select') return (prop.multi_select ?? []).map(i => i.name).join(', ');
  if (prop.type === 'number') return prop.number ?? null;
  if (prop.type === 'date') return prop.date?.start ?? '';
  if (prop.type === 'status') return prop.status?.name ?? '';
  if (prop.type === 'checkbox') return !!prop.checkbox;
  return '';
}

function mapNotionPageToTransaction(page, propMap) {
  const props = page?.properties ?? {};
  const get = (key) => getPropText(props[propMap[key]] ?? props[key]);

  const amountRaw = get('amount');
  const amount = typeof amountRaw === 'number' ? amountRaw : Number(String(amountRaw).replace(/[^\d.-]/g, '')) || 0;

  return {
    id: page.id,
    date: normalizeDate(get('date')),
    type: get('type'),
    category: get('category'),
    account: get('account'),
    payee: get('payee'),
    amount,
    currency: get('currency') || 'CNY',
    note: get('note'),
    raw: page,
  };
}

function normalizeDate(value) {
  if (!value) return '';
  return String(value).split('T')[0];
}

function getTodayDate() {
  return normalizeDate(new Date().toISOString());
}

function safeTitle(text, max = 120) {
  return String(text || '').trim().slice(0, max) || 'Untitled';
}

function safeRichText(text, max = 1800) {
  return String(text || '').trim().slice(0, max);
}

function toRichTextArray(lines = []) {
  return lines
    .map((line) => safeRichText(line))
    .filter(Boolean)
    .slice(0, 50)
    .map((content) => ({ type: 'text', text: { content } }));
}

/** 将分类字符串按逗号拆成多个分类（去空、trim） */
function splitCategories(categoryStr) {
  if (!categoryStr || typeof categoryStr !== 'string') return ['未分类'];
  return categoryStr
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * 获取一笔账单的「主分类」：
 * - 先按逗号拆分为多个原始标签
 * - 对每个标签查本地 category_mapping，拿到 normalized_category + weight
 * - 在同一笔账中选择权重最高的 normalized_category 作为主分类
 * - 如果没有映射，则退化为使用原始标签本身，默认权重 0.5
 */
function getMainCategory(categoryStr) {
  const labels = splitCategories(categoryStr);
  if (labels.length === 0) return '未分类';

  let bestCategory = '未分类';
  let bestWeight = -1;

  for (const rawLabel of labels) {
    const label = rawLabel || '未分类';
    const mapping = getCategoryMapping(label);
    const normalized = mapping?.normalized_category || label;
    const weight = typeof mapping?.weight === 'number' ? mapping.weight : 0.5;

    if (weight > bestWeight) {
      bestWeight = weight;
      bestCategory = normalized || '未分类';
    }
  }

  return bestCategory || '未分类';
}

function localAggregate(transactions) {
  const total = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const byCategory = {};
  for (const t of transactions) {
    const amount = t.amount || 0;
    const mainCategory = getMainCategory(t.category);
    const key = mainCategory || '未分类';
    byCategory[key] = (byCategory[key] || 0) + amount;
  }
  const categoryList = Object.entries(byCategory)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  return {
    total,
    byCategory: categoryList,
    count: transactions.length,
  };
}

function fallbackSummary(aggregation) {
  return `共 ${aggregation.count} 笔，合计 ${aggregation.total.toFixed(2)}；Top 分类：${aggregation.byCategory[0]?.category ?? '无'}`;
}

function resolveCacheDate({ date, transactions }) {
  if (date) return normalizeDate(date);
  if (!Array.isArray(transactions) || transactions.length === 0) return null;
  const first = normalizeDate(transactions[0].date);
  if (!first) return null;
  const sameDate = transactions.every((item) => normalizeDate(item.date) === first);
  return sameDate ? first : null;
}

function buildDateFilter({ date, from, to, dateProperty }) {
  if (date) {
    return { property: dateProperty, date: { equals: normalizeDate(date) } };
  }
  const rangeConditions = [];
  if (from) {
    rangeConditions.push({ property: dateProperty, date: { on_or_after: normalizeDate(from) } });
  }
  if (to) {
    rangeConditions.push({ property: dateProperty, date: { on_or_before: normalizeDate(to) } });
  }
  if (rangeConditions.length === 0) return undefined;
  if (rangeConditions.length === 1) return rangeConditions[0];
  return { and: rangeConditions };
}

/** 预算进度：ok <80%, warning 80~100%, over >100% */
function budgetStatus(percent) {
  if (percent >= 100) return 'over';
  if (percent >= 80) return 'warning';
  return 'ok';
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/notion/english-reading/sync', async (req, res) => {
  try {
    const notionKey = mustGetEnv('NOTION_API_KEY');
    const databaseId = process.env.NOTION_ENGLISH_DATABASE_ID || process.env.NOTION_DATABASE_ID;
    if (!databaseId) {
      return res.status(400).json({
        error: '缺少 NOTION_ENGLISH_DATABASE_ID（或 NOTION_DATABASE_ID）环境变量',
      });
    }

    const payload = req.body ?? {};
    const articleTitle = safeTitle(payload?.article?.title || payload?.articleTitle || 'English Reading');
    const articleSource = safeRichText(payload?.article?.source || payload?.articleSource || '');
    const articleLevel = safeRichText(payload?.article?.level || payload?.level || '');
    const articleDate = normalizeDate(payload?.article?.publishedAt || payload?.publishedAt || getTodayDate());
    const articleSummary = safeRichText(payload?.article?.summary || payload?.summary || '');
    const tags = Array.isArray(payload?.tags) ? payload.tags.map((item) => ({ name: String(item) })) : [];
    const words = Array.isArray(payload?.savedWords) ? payload.savedWords : [];
    const sentences = Array.isArray(payload?.savedSentences) ? payload.savedSentences : [];
    const deepReading = safeRichText(payload?.deepReading || '');

    const notion = createNotionClient(notionKey);
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Title: {
          title: [{ type: 'text', text: { content: articleTitle } }],
        },
        Source: {
          rich_text: articleSource ? [{ type: 'text', text: { content: articleSource } }] : [],
        },
        Level: {
          rich_text: articleLevel ? [{ type: 'text', text: { content: articleLevel } }] : [],
        },
        Date: { date: { start: articleDate } },
        Tags: {
          multi_select: tags.slice(0, 20),
        },
      },
      children: [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: 'Summary' } }],
          },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: articleSummary ? [{ type: 'text', text: { content: articleSummary } }] : [],
          },
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: 'Saved Words' } }],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: toRichTextArray(words.length ? words : ['(none)']),
          },
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: 'Saved Sentences' } }],
          },
        },
        ...sentences.slice(0, 30).map((sentence) => ({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: safeRichText(sentence) } }],
          },
        })),
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: 'AI Deep Reading' } }],
          },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: deepReading ? [{ type: 'text', text: { content: deepReading } }] : [],
          },
        },
      ],
    });

    res.json({ ok: true, pageId: response?.id });
  } catch (e) {
    const detail = e?.body ?? e?.message ?? String(e);
    res.status(500).json({ error: '同步到 Notion 失败', detail });
  }
});

app.post('/api/notion/query-ledger', async (req, res) => {
  try {
    const notionKey = mustGetEnv('NOTION_API_KEY');
    const databaseId = req.body?.databaseId || mustGetEnv('NOTION_DATABASE_ID');
    const date = req.body?.date ? normalizeDate(req.body.date) : '';
    const from = req.body?.from ? normalizeDate(req.body.from) : '';
    const to = req.body?.to ? normalizeDate(req.body.to) : '';
    const forceRefresh = !!req.body?.forceRefresh;
    const filter = req.body?.filter;

    // 默认与 mindledger-main 的 Notion 表一致（英文列名）；可用 NOTION_PROP_* 覆盖为中文等
    const propMap = {
      date: process.env.NOTION_PROP_DATE || 'Date',
      type: process.env.NOTION_PROP_TYPE || 'Type',
      category: process.env.NOTION_PROP_CATEGORY || 'Category',
      account: process.env.NOTION_PROP_ACCOUNT || 'Account',
      payee: process.env.NOTION_PROP_PAYEE || 'Payee',
      amount: process.env.NOTION_PROP_AMOUNT || 'Amount',
      currency: process.env.NOTION_PROP_CURRENCY || 'Currency',
      note: process.env.NOTION_PROP_NOTE || 'Note',
    };

    if (!forceRefresh) {
      if (date) {
        const cached = getTransactionsByDate(date);
        if (cached.length > 0) {
          return res.json({ transactions: cached, source: 'cache', cached: true });
        }
      } else if (from && to) {
        const cached = getTransactionsByRange(from, to);
        if (cached.length > 0) {
          return res.json({ transactions: cached, source: 'cache', cached: true });
        }
      }
    }

    const generatedFilter = buildDateFilter({ date, from, to, dateProperty: propMap.date });
    const effectiveFilter = filter ?? generatedFilter;

    const notion = createNotionClient(notionKey);
    const pages = await queryDatabase(notion, databaseId, effectiveFilter);
    const transactions = pages.map(p => mapNotionPageToTransaction(p, propMap));

    if (date) {
      replaceTransactionsByDate(date, transactions);
    } else {
      upsertTransactions(transactions);
    }

    res.json({ transactions, source: 'notion', cached: false });
  } catch (e) {
    const code = e?.code;
    const status = e?.status;
    const detail = e?.body ?? e?.message ?? String(e);
    if (status === 401 || code === 'unauthorized') {
      return res.status(401).json({
        error: 'Notion 鉴权失败(401)：请检查 NOTION_API_KEY 是否正确，以及集成是否已被授权访问该数据库。',
        detail,
      });
    }
    res.status(500).json({ error: String(e?.message || e), detail });
  }
});

app.get('/api/budget/rules', (_req, res) => {
  try {
    const rows = getBudgetRules();
    res.json({ rules: rows.map((r) => ({ category: r.category, amount: r.amount })) });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.post('/api/budget/rules', (req, res) => {
  try {
    const rules = Array.isArray(req.body?.rules) ? req.body.rules : [];
    saveBudgetRules(rules);
    res.json({ ok: true, rules: getBudgetRules().map((r) => ({ category: r.category, amount: r.amount })) });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.get('/api/ledger/budget-status', async (req, res) => {
  try {
    const from = normalizeDate(req.query?.from);
    const to = normalizeDate(req.query?.to);
    if (!from || !to) {
      return res.status(400).json({ error: '需要 from 和 to 参数，格式 YYYY-MM-DD' });
    }
    const transactions = getTransactionsByRange(from, to);
    const aggregation = localAggregate(transactions);
    const rules = getBudgetRules();
    const byCategoryMap = new Map((aggregation.byCategory ?? []).map((c) => [c.category, c.amount]));

    const budgets = rules.map((r) => {
      const spentAmount = byCategoryMap.get(r.category) ?? 0;
      const budgetAmount = Number(r.amount) || 0;
      const percent = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
      return {
        category: r.category,
        budgetAmount,
        spentAmount,
        percent: Math.round(percent * 10) / 10,
        status: budgetStatus(percent),
      };
    });

    let budgetTip = null;
    const hasWarningOrOver = budgets.some((b) => b.status === 'warning' || b.status === 'over');
    if (hasWarningOrOver) {
      try {
        budgetTip = await getBudgetTip(budgets);
      } catch (_) {
        // ignore AI failure
      }
    }

    res.json({ budgets, budgetTip });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.post('/api/ledger/analyze', async (req, res) => {
  try {
    const forceRefresh = !!req.body?.forceRefresh;
    const date = req.body?.date ? normalizeDate(req.body.date) : '';
    let transactions = Array.isArray(req.body?.transactions) ? req.body.transactions : [];

    if (date && !forceRefresh) {
      const cachedAggregation = getDailyAggregation(date);
      if (cachedAggregation) {
        const latestTxCreatedAt = getLatestTransactionCreatedAtByDate(date);
        const cacheCreatedAt = cachedAggregation.updatedAt;
        const hasNewerTx = latestTxCreatedAt && cacheCreatedAt && latestTxCreatedAt > cacheCreatedAt;

        if (!hasNewerTx) {
          return res.json({
            summary: cachedAggregation.summary,
            aggregation: cachedAggregation.aggregation,
            aiUsed: cachedAggregation.aiUsed,
            aiError: cachedAggregation.aiError,
            cached: true,
            updatedAt: cachedAggregation.updatedAt,
          });
        }
        // 如果有更新的账单，则跳过缓存，继续向下重新聚合
      }
    }

    if (transactions.length === 0 && date) {
      transactions = getTransactionsByDate(date);
    }
    if (transactions.length === 0 && req.body?.from && req.body?.to) {
      transactions = getTransactionsByRange(req.body.from, req.body.to);
    }

    const aggregation = localAggregate(transactions);
    const localSummary = fallbackSummary(aggregation);
    const isRangeQuery = !date && (req.body?.from != null && req.body?.to != null);
    const cacheDate = !isRangeQuery ? (resolveCacheDate({ date, transactions }) || date || getTodayDate()) : null;

    try {
      const summary = await analyzeLedgerWithAi(transactions, aggregation);
      const payload = { summary, aggregation, aiUsed: true };
      if (cacheDate) saveDailyAggregation(cacheDate, payload);
      return res.json({ ...payload, cached: false });
    } catch (aiError) {
      const payload = {
        summary: localSummary,
        aggregation,
        aiUsed: false,
        aiError: aiError?.response?.data || String(aiError?.message || aiError),
      };
      if (cacheDate) saveDailyAggregation(cacheDate, payload);
      return res.json({ ...payload, cached: false });
    }
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// ===== 兴趣话题 & 文章推荐路由 =====

// 获取所有话题
app.get('/api/interests/topics', (_req, res) => {
  try {
    res.json({ topics: getTopics() });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// 新增话题
app.post('/api/interests/topics', (req, res) => {
  try {
    const name = (req.body?.name ?? '').trim();
    if (!name) return res.status(400).json({ error: '话题名称不能为空' });
    const topic = addTopic(name);
    res.json({ topic });
  } catch (e) {
    if (String(e?.message).includes('UNIQUE')) {
      return res.status(409).json({ error: '话题已存在' });
    }
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// 删除话题
app.delete('/api/interests/topics/:id', (req, res) => {
  try {
    deleteTopic(Number(req.params.id));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// 获取推荐文章（支持 forceRefresh）
app.post('/api/interests/recommend', async (req, res) => {
  try {
    const topic = (req.body?.topic ?? '').trim();
    if (!topic) return res.status(400).json({ error: '缺少 topic 参数' });
    const forceRefresh = !!req.body?.forceRefresh;
    const today = new Date().toISOString().split('T')[0];

    if (!forceRefresh) {
      const cached = getArticleCache(topic, today);
      if (cached) {
        return res.json({ ...cached, cached: true });
      }
    }

    const articles = await searchArticles(topic, 5);
    let aiInsight = null;
    try {
      aiInsight = await generateTopicInsight(topic, articles);
    } catch (_) {
      // AI 洞察失败不阻断主流程
    }

    saveArticleCache(topic, today, articles, aiInsight);
    res.json({ topic, articles, aiInsight, cached: false });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const port = Number(process.env.API_PORT || 8787);
const server = app.listen(port, () => {
  console.log(`API server listening on ${port}`);
});

function shutdown() {
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
