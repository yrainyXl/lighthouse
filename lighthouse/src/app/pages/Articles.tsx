import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { BookOpen, Plus, Search, Filter, Sparkles, ExternalLink, Calendar, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

export function Articles() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const articles = [
    {
      id: 1,
      title: "React 19 新特性详解",
      url: "https://react.dev/blog/2024/12/05/react-19",
      summary: "深入了解 React 19 带来的全新特性，包括服务器组件、Server Actions、以及改进的并发渲染能力。",
      category: "前端开发",
      tags: ["React", "JavaScript", "Web开发"],
      date: "2026-03-24",
      status: "已整理",
      aiInsights: "这篇文章重点介绍了 React 的服务器组件架构，对于构建现代 Web 应用非常重要。建议结合 Next.js 15 一起学习。",
    },
    {
      id: 2,
      title: "TypeScript 高级类型系统",
      url: "https://www.typescriptlang.org/docs/",
      summary: "探索 TypeScript 的高级类型特性，包括条件类型、映射类型、模板字面量类型等。",
      category: "编程语言",
      tags: ["TypeScript", "类型系统", "编程"],
      date: "2026-03-23",
      status: "待整理",
      aiInsights: null,
    },
    {
      id: 3,
      title: "系统设计：如何构建可扩展的架构",
      url: "https://example.com/system-design",
      summary: "学习大型分布式系统的设计原则，包括负载均衡、缓存策略、数据库分片等关键技术。",
      category: "系统架构",
      tags: ["系统设计", "架构", "后端"],
      date: "2026-03-22",
      status: "已整理",
      aiInsights: "系统设计是高级工程师必备技能。重点关注 CAP 定理和微服务架构模式，可以结合实际项目案例深入学习。",
    },
    {
      id: 4,
      title: "深入理解 PostgreSQL 查询优化",
      url: "https://example.com/postgresql",
      summary: "掌握 PostgreSQL 的查询计划、索引优化、以及性能调优技巧。",
      category: "数据库",
      tags: ["PostgreSQL", "SQL", "性能优化"],
      date: "2026-03-21",
      status: "已整理",
      aiInsights: "数据库性能优化是后端开发的核心能力。建议创建实践项目，测试不同的索引策略对查询性能的影响。",
    },
    {
      id: 5,
      title: "CSS Grid 与 Flexbox 完全指南",
      url: "https://example.com/css-layout",
      summary: "全面了解现代 CSS 布局技术，何时使用 Grid，何时使用 Flexbox。",
      category: "前端开发",
      tags: ["CSS", "布局", "UI"],
      date: "2026-03-20",
      status: "待整理",
      aiInsights: null,
    },
    {
      id: 6,
      title: "机器学习基础：从零开始",
      url: "https://example.com/ml-basics",
      summary: "机器学习的基本概念、算法和应用场景介绍。",
      category: "人工智能",
      tags: ["机器学习", "AI", "Python"],
      date: "2026-03-19",
      status: "已整理",
      aiInsights: "建议先掌握线性代数和统计学基础，然后通过 scikit-learn 进行实践。可以从简单的分类问题开始。",
    },
  ];

  const categories = ["all", "前端开发", "编程语言", "系统架构", "数据库", "人工智能"];

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategory === "all" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: articles.length,
    organized: articles.filter((a) => a.status === "已整理").length,
    pending: articles.filter((a) => a.status === "待整理").length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900">文章推荐</h2>
          <p className="text-gray-600 mt-2">
            记录学习文章，AI 自动整理并同步至 Notion 知识库
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              添加文章
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>添加新文章</DialogTitle>
              <DialogDescription>
                记录你想学习的文章，AI 会自动整理摘要并同步到 Notion
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="url">文章链接</Label>
                <Input
                  id="url"
                  placeholder="https://example.com/article"
                  type="url"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">标题</Label>
                <Input id="title" placeholder="文章标题" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">分类</Label>
                <Select>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frontend">前端开发</SelectItem>
                    <SelectItem value="backend">后端开发</SelectItem>
                    <SelectItem value="ai">人工智能</SelectItem>
                    <SelectItem value="design">设计</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">笔记</Label>
                <Textarea
                  id="notes"
                  placeholder="添加你的学习笔记或想法..."
                  rows={4}
                />
              </div>
              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <p className="text-sm text-purple-900">
                  AI 将自动提取文章摘要并生成学习建议
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline">取消</Button>
              <Button>保存并整理</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">总文章数</p>
                <p className="text-3xl font-semibold mt-2 text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">已整理</p>
                <p className="text-3xl font-semibold mt-2 text-gray-900">{stats.organized}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <Sparkles className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">待整理</p>
                <p className="text-3xl font-semibold mt-2 text-gray-900">{stats.pending}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="搜索文章标题、标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有分类</SelectItem>
                  {categories.slice(1).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Articles List */}
      <div className="space-y-4">
        {filteredArticles.map((article) => (
          <Card key={article.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline">{article.category}</Badge>
                      <Badge
                        variant={article.status === "已整理" ? "default" : "secondary"}
                      >
                        {article.status}
                      </Badge>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {article.date}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600">{article.summary}</p>
                  </div>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-5 h-5 text-gray-500" />
                  </a>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-4 h-4 text-gray-400" />
                  {article.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm rounded-full bg-blue-50 text-blue-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* AI Insights */}
                {article.aiInsights && (
                  <div className="flex gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-purple-900 mb-1">
                        AI 学习建议
                      </p>
                      <p className="text-sm text-purple-800">{article.aiInsights}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到文章</h3>
            <p className="text-gray-600">尝试调整搜索条件或添加新文章</p>
          </CardContent>
        </Card>
      )}

      {/* Integration Notice */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-white">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">AI 自动整理功能</h4>
              <p className="text-sm text-gray-700 mt-1">
                添加文章后，AI 会自动：
              </p>
              <ul className="text-sm text-gray-700 mt-2 space-y-1 list-disc list-inside">
                <li>提取文章核心内容和关键知识点</li>
                <li>生成学习建议和相关推荐</li>
                <li>整理到你的 Notion 知识库，方便后续检索</li>
                <li>定期生成学习报告和知识图谱</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
