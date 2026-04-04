import {
  Brain,
  Code,
  Database,
  FileText,
  Folder,
  BookOpen,
  Layout,
  type LucideIcon,
} from "lucide-react";

export interface KnowledgeFolder {
  id: string;
  name: string;
  icon: LucideIcon;
  accent: string;
  surface: string;
  count: number;
  description: string;
}

export interface KnowledgeItem {
  id: number;
  title: string;
  folder: string;
  type: string;
  tags: string[];
  summary: string;
  lastUpdated: string;
  content: string;
}

export const knowledgeFolders: KnowledgeFolder[] = [
  {
    id: "frontend",
    name: "前端开发",
    icon: Layout,
    accent: "text-sky-700",
    surface: "bg-sky-100",
    count: 45,
    description: "React、CSS、交互设计与工程化。",
  },
  {
    id: "backend",
    name: "后端开发",
    icon: Database,
    accent: "text-emerald-700",
    surface: "bg-emerald-100",
    count: 32,
    description: "Node.js、数据库、接口设计与性能优化。",
  },
  {
    id: "algorithms",
    name: "算法与结构",
    icon: Code,
    accent: "text-violet-700",
    surface: "bg-violet-100",
    count: 28,
    description: "常见算法题型、模板与数据结构总结。",
  },
  {
    id: "ai",
    name: "人工智能",
    icon: Brain,
    accent: "text-fuchsia-700",
    surface: "bg-fuchsia-100",
    count: 18,
    description: "机器学习、NLP 与模型应用笔记。",
  },
  {
    id: "system",
    name: "系统设计",
    icon: Folder,
    accent: "text-amber-700",
    surface: "bg-amber-100",
    count: 23,
    description: "分布式、微服务与复杂系统设计经验。",
  },
];

export const knowledgeItems: KnowledgeItem[] = [
  {
    id: 1,
    title: "React Hooks 完全指南",
    folder: "frontend",
    type: "笔记",
    tags: ["React", "Hooks", "前端"],
    summary: "整理 useState、useEffect、状态拆分和副作用治理的实践。",
    lastUpdated: "2026-03-24",
    content: "把 UI 状态和远端状态拆开管理，避免 effect 链式触发。",
  },
  {
    id: 2,
    title: "TypeScript 类型体操技巧",
    folder: "frontend",
    type: "文档",
    tags: ["TypeScript", "类型系统"],
    summary: "条件类型、模板字面量类型与泛型约束的常见套路。",
    lastUpdated: "2026-03-23",
    content: "先把类型意图写出来，再做工具类型抽象，避免过度炫技。",
  },
  {
    id: 3,
    title: "Node.js 性能优化",
    folder: "backend",
    type: "实践",
    tags: ["Node.js", "性能", "后端"],
    summary: "从 Event Loop 到数据库访问模式的端到端性能排查路径。",
    lastUpdated: "2026-03-22",
    content: "优先找热点路径，不要在冷路径上做复杂优化。",
  },
  {
    id: 4,
    title: "PostgreSQL 索引策略",
    folder: "backend",
    type: "笔记",
    tags: ["PostgreSQL", "数据库", "索引"],
    summary: "B-Tree、GiST、组合索引与查询计划解读的判断框架。",
    lastUpdated: "2026-03-21",
    content: "索引要跟实际查询模式对应，而不是看到字段就建。",
  },
  {
    id: 5,
    title: "二叉树遍历算法总结",
    folder: "algorithms",
    type: "算法",
    tags: ["算法", "二叉树", "遍历"],
    summary: "递归、显式栈、层序遍历的统一写法与复杂度对比。",
    lastUpdated: "2026-03-20",
    content: "先确定访问顺序，再决定递归还是显式栈实现。",
  },
  {
    id: 6,
    title: "动态规划解题模板",
    folder: "algorithms",
    type: "模板",
    tags: ["动态规划", "算法模板"],
    summary: "状态定义、转移方程、初始化和滚动数组的拆解套路。",
    lastUpdated: "2026-03-19",
    content: "状态定义写错，后面的转移就会全部歪掉。",
  },
  {
    id: 7,
    title: "Transformer 架构详解",
    folder: "ai",
    type: "论文笔记",
    tags: ["深度学习", "NLP", "Transformer"],
    summary: "Self-Attention、Position Encoding 和训练稳定性的核心概念。",
    lastUpdated: "2026-03-18",
    content: "注意力不是魔法，本质是加权聚合与表示重构。",
  },
  {
    id: 8,
    title: "微服务架构设计原则",
    folder: "system",
    type: "架构",
    tags: ["微服务", "架构", "设计"],
    summary: "拆服务边界、治理依赖和控制复杂度扩散的实践。",
    lastUpdated: "2026-03-17",
    content: "先解决边界和依赖方向，再谈拆多少个服务。",
  },
  {
    id: 9,
    title: "分布式事务解决方案",
    folder: "system",
    type: "方案",
    tags: ["分布式", "事务", "一致性"],
    summary: "2PC、Saga、TCC 的适用边界与落地代价对比。",
    lastUpdated: "2026-03-16",
    content: "优先避免跨服务事务，其次才是选择协议。",
  },
  {
    id: 10,
    title: "CSS Grid 布局实战",
    folder: "frontend",
    type: "实践",
    tags: ["CSS", "布局", "Grid"],
    summary: "二维布局场景下 Grid 和 Flex 的职责拆分方式。",
    lastUpdated: "2026-03-15",
    content: "Grid 负责大布局，Flex 负责局部排列，组合使用更稳。",
  },
];

export function getKnowledgeTypeIcon(type: string): LucideIcon {
  switch (type) {
    case "笔记":
      return FileText;
    case "文档":
      return BookOpen;
    case "算法":
    case "模板":
      return Code;
    case "实践":
    case "方案":
    case "架构":
      return Database;
    case "论文笔记":
      return Brain;
    default:
      return FileText;
  }
}
