import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Search, Folder, FileText, BookOpen, Code, Database, Brain, Layout, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

export function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const folders = [
    {
      id: "frontend",
      name: "前端开发",
      icon: Layout,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      count: 45,
      description: "React, Vue, CSS, JavaScript 等前端技术",
    },
    {
      id: "backend",
      name: "后端开发",
      icon: Database,
      color: "text-green-600",
      bgColor: "bg-green-50",
      count: 32,
      description: "Node.js, Python, 数据库, API 设计等",
    },
    {
      id: "algorithms",
      name: "算法与数据结构",
      icon: Code,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      count: 28,
      description: "常见算法、数据结构、LeetCode 题解",
    },
    {
      id: "ai",
      name: "人工智能",
      icon: Brain,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      count: 18,
      description: "机器学习、深度学习、NLP 等",
    },
    {
      id: "system",
      name: "系统设计",
      icon: Folder,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      count: 23,
      description: "架构设计、分布式系统、微服务",
    },
  ];

  const knowledgeItems = [
    {
      id: 1,
      title: "React Hooks 完全指南",
      folder: "frontend",
      type: "笔记",
      tags: ["React", "Hooks", "前端"],
      summary: "深入理解 useState, useEffect, useContext 等核心 Hooks 的使用方法和最佳实践",
      lastUpdated: "2026-03-24",
      content: "useState 用于管理组件状态...",
    },
    {
      id: 2,
      title: "TypeScript 类型体操技巧",
      folder: "frontend",
      type: "文档",
      tags: ["TypeScript", "类型系统"],
      summary: "高级类型映射、条件类型、泛型约束等进阶技巧",
      lastUpdated: "2026-03-23",
      content: "条件类型允许我们根据类型关系选择不同的类型...",
    },
    {
      id: 3,
      title: "Node.js 性能优化",
      folder: "backend",
      type: "实践",
      tags: ["Node.js", "性能", "后端"],
      summary: "Event Loop、内存管理、异步优化等性能调优技巧",
      lastUpdated: "2026-03-22",
      content: "理解 Event Loop 是 Node.js 性能优化的关键...",
    },
    {
      id: 4,
      title: "PostgreSQL 索引策略",
      folder: "backend",
      type: "笔记",
      tags: ["PostgreSQL", "数据库", "索引"],
      summary: "B-Tree、Hash、GiST 等索引类型的选择和使用场景",
      lastUpdated: "2026-03-21",
      content: "B-Tree 索引适用于范围查询...",
    },
    {
      id: 5,
      title: "二叉树遍历算法总结",
      folder: "algorithms",
      type: "算法",
      tags: ["算法", "二叉树", "遍历"],
      summary: "前序、中序、后序、层序遍历的递归和迭代实现",
      lastUpdated: "2026-03-20",
      content: "前序遍历：根-左-右，中序遍历：左-根-右...",
    },
    {
      id: 6,
      title: "动态规划解题模板",
      folder: "algorithms",
      type: "模板",
      tags: ["动态规划", "算法模板"],
      summary: "背包问题、最长子序列、股票问题等经典DP模板",
      lastUpdated: "2026-03-19",
      content: "动态规划的核心思想是将问题分解为子问题...",
    },
    {
      id: 7,
      title: "Transformer 架构详解",
      folder: "ai",
      type: "论文笔记",
      tags: ["深度学习", "NLP", "Transformer"],
      summary: "Self-Attention、Multi-Head Attention、Position Encoding 原理",
      lastUpdated: "2026-03-18",
      content: "Self-Attention 机制允许模型关注序列中的不同位置...",
    },
    {
      id: 8,
      title: "微服务架构设计原则",
      folder: "system",
      type: "架构",
      tags: ["微服务", "架构", "设计"],
      summary: "服务拆分、API 网关、服务发现、熔断降级等核心概念",
      lastUpdated: "2026-03-17",
      content: "微服务架构的核心是将大型应用拆分为小型独立服务...",
    },
    {
      id: 9,
      title: "分布式事务解决方案",
      folder: "system",
      type: "方案",
      tags: ["分布式", "事务", "一致性"],
      summary: "2PC、3PC、Saga、TCC 等分布式事务模式对比",
      lastUpdated: "2026-03-16",
      content: "分布式事务是分布式系统中的经典难题...",
    },
    {
      id: 10,
      title: "CSS Grid 布局实战",
      folder: "frontend",
      type: "实践",
      tags: ["CSS", "布局", "Grid"],
      summary: "Grid 布局的核心属性和实际应用案例",
      lastUpdated: "2026-03-15",
      content: "CSS Grid 提供了二维布局系统...",
    },
  ];

  const filteredItems = knowledgeItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFolder = !selectedFolder || item.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const getTypeIcon = (type: string) => {
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
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-semibold text-gray-900">知识库</h2>
        <p className="text-gray-600 mt-2">
          整理和展示从 Notion 同步的知识内容
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {folders.map((folder) => {
          const Icon = folder.icon;
          return (
            <Card
              key={folder.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedFolder === folder.id ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() =>
                setSelectedFolder(selectedFolder === folder.id ? null : folder.id)
              }
            >
              <CardContent className="p-4">
                <div className={`p-3 rounded-lg ${folder.bgColor} w-fit mb-3`}>
                  <Icon className={`w-6 h-6 ${folder.color}`} />
                </div>
                <p className="font-semibold text-gray-900">{folder.name}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {folder.count}
                </p>
                <p className="text-xs text-gray-500 mt-1">条目</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="搜索知识库..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {selectedFolder && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-gray-600">筛选：</span>
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setSelectedFolder(null)}
              >
                {folders.find((f) => f.id === selectedFolder)?.name}
                <span className="ml-2">×</span>
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs View */}
      <Tabs defaultValue="grid" className="w-full">
        <TabsList>
          <TabsTrigger value="grid">卡片视图</TabsTrigger>
          <TabsTrigger value="list">列表视图</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredItems.map((item) => {
              const Icon = getTypeIcon(item.type);
              const folder = folders.find((f) => f.id === item.folder);
              return (
                <Card
                  key={item.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                          {folder && (
                            <Badge variant="secondary" className="text-xs">
                              {folder.name}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {item.summary}
                        </CardDescription>
                      </div>
                      <div className={`p-2 rounded-lg ${folder?.bgColor}`}>
                        <Icon className={`w-5 h-5 ${folder?.color}`} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>更新于 {item.lastUpdated}</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200">
                {filteredItems.map((item) => {
                  const Icon = getTypeIcon(item.type);
                  const folder = folders.find((f) => f.id === item.folder);
                  return (
                    <div
                      key={item.id}
                      className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${folder?.bgColor} flex-shrink-0`}>
                          <Icon className={`w-6 h-6 ${folder?.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {item.type}
                            </Badge>
                            {folder && (
                              <Badge variant="secondary" className="text-xs">
                                {folder.name}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">{item.summary}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {item.lastUpdated}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到内容</h3>
            <p className="text-gray-600">尝试调整搜索条件或筛选条件</p>
          </CardContent>
        </Card>
      )}

      {/* Folder Details */}
      {selectedFolder && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {(() => {
                const folder = folders.find((f) => f.id === selectedFolder);
                if (!folder) return null;
                const Icon = folder.icon;
                return (
                  <>
                    <div className={`p-3 rounded-lg ${folder.bgColor}`}>
                      <Icon className={`w-8 h-8 ${folder.color}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-900">
                        {folder.name}
                      </h4>
                      <p className="text-gray-700 mt-1">{folder.description}</p>
                      <p className="text-sm text-gray-600 mt-2">
                        共有 {folder.count} 条知识内容
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integration Notice */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-green-900">Notion 知识库同步</h4>
              <p className="text-sm text-green-800 mt-1">
                所有整理好的文章和笔记都会自动同步到你的 Notion 知识库中，支持分类、标签、全文搜索等功能。
                你也可以在 Notion 中继续编辑和扩展这些内容。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
