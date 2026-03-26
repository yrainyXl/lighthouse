import axios from 'axios';

function mustGetAiEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`缺少环境变量：${name}`);
  }
  return value;
}

function getAiConfig() {
  const apiKey = mustGetAiEnv('AI_API_KEY');
  const base = process.env.AI_API_BASE || 'https://api.siliconflow.cn/v1';
  const model = process.env.AI_MODEL || 'Qwen/Qwen2.5-7B-Instruct';
  const endpoint = `${base.replace(/\/$/, '')}/chat/completions`;
  const maxTokens = Number(process.env.AI_MAX_TOKENS || 80);
  return { apiKey, endpoint, model, maxTokens };
}

function normalizeSummary(content) {
  return String(content)
    .replace(/\*\*/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\r?\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 基于已有聚合结果，让 AI 输出一句简短洞察或建议（不重复数字）。
 * aggregation: { total, count, byCategory: [{ category, amount }] }
 */
export async function analyzeLedgerWithAi(transactions, aggregation) {
  const { apiKey, endpoint, model, maxTokens } = getAiConfig();
  const topCategories = (aggregation?.byCategory ?? []).slice(0, 5);
  const userContent =
    `已有聚合结果：共 ${aggregation?.count ?? 0} 笔，合计 ${(aggregation?.total ?? 0).toFixed(2)} 元；` +
    `分类金额：${topCategories.map((c) => `${c.category} ${c.amount}元`).join('、')}。\n` +
    `请只输出一句简短洞察或建议（例如：占比最高的类别、可优化之处、或一句预算提醒），不要重复上述数字，不要用 Markdown。`;

  const response = await axios.post(
    endpoint,
    {
      model,
      messages: [
        {
          role: 'system',
          content:
            '你是记账洞察助手。根据给出的聚合结果，只回复一句简短的中文洞察或建议，如：哪类支出占比高、是否值得关注、或一句省钱/预算提醒。不要复述数字，不要列表、不要标题。',
        },
        { role: 'user', content: userContent },
      ],
      max_tokens: Math.min(maxTokens, 120),
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    },
  );

  const content = response.data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI 返回为空');
  }
  return normalizeSummary(content);
}

/**
 * 根据预算进度生成一句简短建议（仅在有超支或接近预算时调用）。
 * items: [{ category, spentAmount, budgetAmount, status: 'ok'|'warning'|'over' }]
 */
export async function getBudgetTip(items) {
  const overOrWarning = (items ?? []).filter((i) => i.status === 'over' || i.status === 'warning');
  if (overOrWarning.length === 0) return null;
  const { apiKey, endpoint, model, maxTokens } = getAiConfig();
  const lines = overOrWarning.map(
    (i) => `${i.category}：已花 ${Number(i.spentAmount).toFixed(0)} 元，预算 ${Number(i.budgetAmount).toFixed(0)} 元${i.status === 'over' ? '（已超支）' : '（接近预算）'}`,
  );
  const userContent = `本月预算情况：\n${lines.join('\n')}\n请用一句话给出简短、温和的省钱或调整建议，不要重复数字，不要用 Markdown。`;

  const response = await axios.post(
    endpoint,
    {
      model,
      messages: [
        {
          role: 'system',
          content: '你是记账预算助手。根据用户给出的预算超支或接近预算的分类，只回复一句简短、温和的中文建议，例如如何控制该类支出或下月如何调整预算。不要列表、不要标题。',
        },
        { role: 'user', content: userContent },
      ],
      max_tokens: Math.min(maxTokens, 80),
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    },
  );

  const content = response.data?.choices?.[0]?.message?.content;
  if (!content) return null;
  return normalizeSummary(content);
}

/**
 * 根据话题和搜索到的文章，生成一段 AI 洞察摘要
 * @param {string} topic 话题名称
 * @param {Array<{title, snippet, source}>} articles 文章列表
 * @returns {Promise<string|null>}
 */
export async function generateTopicInsight(topic, articles) {
  const { apiKey, endpoint, model } = getAiConfig();
  const articleSummary = articles
    .slice(0, 5)
    .map((a, i) => `${i + 1}. ${a.title}（${a.source}）：${a.snippet}`)
    .join('\n');
  const userContent = `话题：${topic}\n\n以下是相关文章：\n${articleSummary}`;

  const response = await axios.post(
    endpoint,
    {
      model,
      messages: [
        {
          role: 'system',
          content: '你是一个信息助手。根据给出的话题和相关文章，用2~3句中文总结当前这个话题的最新动态或核心观点，语言简洁有洞察力。不要列表、不要标题。',
        },
        { role: 'user', content: userContent },
      ],
      max_tokens: 150,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    },
  );

  const content = response.data?.choices?.[0]?.message?.content;
  if (!content) return null;
  return normalizeSummary(content);
}
