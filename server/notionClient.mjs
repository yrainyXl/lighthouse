import { Client, iteratePaginatedAPI } from '@notionhq/client';

/**
 * 创建 Notion 客户端
 */
export function createNotionClient(apiKey) {
  return new Client({ auth: apiKey });
}

/**
 * 查询数据库，自动处理分页，返回全部 page 对象
 */
export async function queryDatabase(client, databaseId, filter) {
  const pages = [];
  for await (const page of iteratePaginatedAPI(client.databases.query.bind(client.databases), {
    database_id: databaseId,
    ...(filter ? { filter } : {}),
  })) {
    pages.push(page);
  }
  return pages;
}
