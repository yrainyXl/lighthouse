import axios from 'axios';

/**
 * 用 Serper Search API 搜索话题相关文章
 * @param {string} topic 话题关键词
 * @param {number} count 期望文章数，默认 5
 * @returns {Promise<Array<{title, url, source, snippet}>>}
 */
export async function searchArticles(topic, count = 5) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) throw new Error('缺少环境变量：SERPER_API_KEY');

  const resp = await axios.post(
    'https://google.serper.dev/search',
    { q: topic, num: count, hl: 'zh-cn', gl: 'cn' },
    {
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    },
  );

  const organic = resp.data?.organic ?? [];
  return organic.slice(0, count).map((item) => ({
    title: item.title ?? '',
    url: item.link ?? '',
    source: item.displayLink ?? '',
    snippet: item.snippet ?? '',
  }));
}
