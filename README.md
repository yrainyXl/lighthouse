# 个人门户网站

一个用于展示个人感兴趣内容的门户网站，通过调用 AI 接口搜集信息并展示，同时聚合分析 Notion 数据库中的记账信息。

## 功能特性

- **Notion数据聚合分析**：调用 Notion API 查询每日记账信息，通过 AI 接口生成汇总分析
- **SQLite缓存与持久化**：缓存 Notion 拉取明细与每日聚合总结，降低重复调用成本
- **兴趣信息收集**：通过AI接口收集用户感兴趣的信息并聚合展示
- **定时调度**：每天早上定时更新数据并展示
- **响应式设计**：适配不同屏幕尺寸

## 技术栈

- 前端：React + TypeScript + Vite
- 后端服务：Node.js
- API集成：Notion API、硅基流动（OpenAI 兼容接口）
- 定时任务：Cron
- 缓存存储：SQLite

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env` 文件并填写相应的API密钥：

```bash
# Notion API配置
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_notion_database_id

# AI API配置
AI_API_KEY=your_ai_api_key
AI_API_BASE=https://api.siliconflow.cn/v1
AI_MODEL=Qwen/Qwen2.5-7B-Instruct
AI_MAX_TOKENS=800

# Notion 账单表字段映射（可选，用于对齐 mindledger-main 的表格列名）
# 如果你的 Notion 数据库列名和下面默认值不一致，请在此处改成你的列名
NOTION_PROP_DATE=日期
NOTION_PROP_TYPE=类型
NOTION_PROP_CATEGORY=分类
NOTION_PROP_ACCOUNT=账户
NOTION_PROP_PAYEE=商户
NOTION_PROP_AMOUNT=金额
NOTION_PROP_CURRENCY=币种
NOTION_PROP_NOTE=备注

# 后端API端口（可选）
API_PORT=8787
SQLITE_DB_PATH=server/data/lighthouse.db

# 应用配置
VITE_APP_TITLE=个人门户网站

# Docker 构建依赖源（可选）
# 默认使用官方 npm 源；如果你的网络环境需要镜像，可以改成其他 registry
NPM_REGISTRY=https://registry.npmjs.org/

# Docker/OrbStack 代理（可选）
# 容器里不要写 127.0.0.1，应使用 host.docker.internal 指向宿主机代理
DOCKER_HTTP_PROXY=http://host.docker.internal:7897
DOCKER_HTTPS_PROXY=http://host.docker.internal:7897
DOCKER_NO_PROXY=localhost,127.0.0.1,host.docker.internal
DOCKER_ALL_PROXY=
```

### 3. 启动开发服务器

```bash
npm run dev
```

**停止服务**：请使用 **Ctrl+C** 结束进程。不要使用 Ctrl+Z（挂起），否则后端会继续占用 8787 端口，再次启动会报 `EADDRINUSE`。

### 4. 构建生产版本

```bash
npm run build
```

### 5. 启动生产服务（本地）

```bash
npm run start
```

服务默认运行在 `http://localhost:8787`，并直接托管前端构建产物。

### 6. 使用 Docker 部署（推荐）

```bash
docker compose up --build -d
```

说明：
- 服务端口：`8787`
- SQLite 持久化目录：`./server/data`（容器内 `/app/server/data`）
- 停止服务：`docker compose down`
- 查看日志：`docker compose logs -f`

## 项目结构

```
├── src/
│   ├── components/          # 前端组件
│   │   ├── Header.tsx       # 头部导航
│   │   ├── NotionDataDisplay.tsx  # Notion数据展示
│   │   └── InterestAggregator.tsx # 兴趣信息聚合
│   ├── services/           # 服务层
│   │   ├── notionService.ts    # Notion API服务
│   │   ├── aiService.ts        # AI API服务
│   │   └── schedulerService.ts # 定时任务服务
│   ├── styles/             # 样式文件
│   ├── App.tsx             # 主应用组件
│   └── main.tsx            # 应用入口
├── server/
│   ├── index.mjs           # 后端 API 与静态资源托管
│   ├── db.mjs              # SQLite 初始化与缓存读写
│   ├── siliconflowClient.mjs # 硅基流动 AI 客户端
│   └── data/               # SQLite 文件目录（运行时生成）
├── .env                    # 环境变量配置
├── Dockerfile              # 容器构建
├── docker-compose.yml      # 本地容器编排
├── package.json            # 项目配置
└── README.md               # 项目说明
```

## 配置说明

### Notion API配置

1. 前往 [Notion Developers](https://developers.notion.com/) 创建集成
2. 复制生成的API密钥到 `.env` 文件的 `NOTION_API_KEY` 字段
3. 在Notion中创建一个数据库，复制数据库ID到 `.env` 文件的 `NOTION_DATABASE_ID` 字段
4. 确保集成已经被授权访问该数据库

### AI API配置（硅基流动）

1. 前往硅基流动平台创建 API Key
2. 在 `.env` 中填写 `AI_API_KEY`
3. 按需设置 `AI_API_BASE`（默认 `https://api.siliconflow.cn/v1`）与 `AI_MODEL`

### SQLite 缓存说明

- 数据库文件默认路径：`server/data/lighthouse.db`
- 缓存内容：
  - `ledger_transaction`：从 Notion 标准化后的明细
  - `ledger_aggregation_daily`：按天的聚合与 AI 总结
- API 缓存策略：
  - `POST /api/notion/query-ledger`：默认先读缓存，`forceRefresh=true` 强制回源 Notion
  - `POST /api/ledger/analyze`：默认先读当日聚合缓存，`forceRefresh=true` 强制重算

### 定时任务配置

在 `src/services/schedulerService.ts` 中配置定时任务的执行时间，默认设置为每天早上8点执行。

## 功能使用

1. **Notion数据展示**：系统会自动查询Notion数据库中的记账信息，并通过AI生成分析报告
2. **兴趣信息聚合**：系统会根据用户设置的感兴趣话题，通过AI收集相关信息
3. **定时更新**：每天早上系统会自动更新数据并展示最新的分析结果

## 注意事项

- 确保Notion数据库结构与代码中的预期结构匹配
- 确保AI API密钥有足够的配额
- 定期检查系统日志，确保定时任务正常执行

## 扩展建议

- 添加用户登录功能，支持多用户
- 增加数据可视化图表
- 支持更多数据源的集成
- 添加个性化推荐功能
