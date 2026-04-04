import {
  ArrowRight,
  BookOpen,
  Brain,
  Languages,
  Library,
  Receipt,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

export function Dashboard() {
  const modules = [
    {
      title: "账单统计",
      description: "保留真实账单同步和分析能力，同时把图表改造成桌面/手机都能读的结构。",
      icon: Receipt,
      accent: "text-rose-700",
      surface: "bg-rose-100",
      link: "/bills",
      badge: "真实数据",
    },
    {
      title: "文章推荐",
      description: "沿用旧版兴趣聚合的数据流，用新壳层统一话题、刷新和 AI 洞察体验。",
      icon: BookOpen,
      accent: "text-sky-700",
      surface: "bg-sky-100",
      link: "/articles",
      badge: "兴趣聚合",
    },
    {
      title: "知识库",
      description: "先统一 UI 和信息架构，再把知识内容的数据适配边界独立出来。",
      icon: Library,
      accent: "text-emerald-700",
      surface: "bg-emerald-100",
      link: "/knowledge",
      badge: "结构整理",
    },
    {
      title: "英语阅读",
      description: "并入 remote 的英语阅读能力，把词句收藏、AI 精读和 Notion 同步放到统一入口。",
      icon: Languages,
      accent: "text-violet-700",
      surface: "bg-violet-100",
      link: "/english-reading",
      badge: "Remote 对齐",
    },
    {
      title: "统一工作台",
      description: "旧 UI 风格重建后的首页，用更轻的结构串起桌面端和移动端的全部模块。",
      icon: Sparkles,
      accent: "text-amber-700",
      surface: "bg-amber-100",
      link: "/",
      badge: "响应式壳",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] bg-slate-950 px-6 py-8 text-white shadow-[0_30px_80px_-45px_rgba(15,23,42,0.85)] sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.45fr_0.95fr]">
          <div>
            <Badge className="rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/10">
              旧 UI 交互基底
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              用一套响应式界面收口所有能力
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              这次重构不再维护两棵 UI。桌面端保留数据密度，手机端改成更短路径的导航和更轻的图表信息层级。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/bills"
                className="rounded-full bg-white px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-slate-100"
              >
                先看账单统计
              </Link>
              <Link
                to="/english-reading"
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                进入英语阅读
              </Link>
            </div>
          </div>

          <div className="grid gap-3 rounded-[28px] border border-white/10 bg-white/5 p-4 sm:grid-cols-2">
            {[
              { label: "应用树", value: "1 套", hint: "src/app 成为唯一入口" },
              { label: "核心模块", value: "5 个", hint: "首页/账单/文章/知识/英语" },
              { label: "移动优先", value: "已纳入", hint: "导航和图表都按窄屏重排" },
              { label: "Remote 对齐", value: "进行中", hint: "英语阅读和后端同步并入中" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-300">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                <p className="mt-2 text-xs leading-5 text-slate-400">{item.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.title} to={module.link} className="group">
              <Card className="h-full overflow-hidden border-white/70 bg-white/80 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.35)]">
                <CardContent className="flex h-full flex-col gap-5 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-3xl ${module.surface}`}>
                      <Icon className={`h-7 w-7 ${module.accent}`} />
                    </div>
                    <Badge variant="outline" className="rounded-full border-slate-200 bg-white/80">
                      {module.badge}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                      {module.title}
                    </h3>
                    <p className="text-sm leading-7 text-slate-600">{module.description}</p>
                  </div>

                  <div className="mt-auto flex items-center gap-2 text-sm font-medium text-slate-700">
                    <span>进入模块</span>
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <Card className="border-white/70 bg-white/80">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100">
                <Sparkles className="h-5 w-5 text-violet-700" />
              </div>
              <div>
                <p className="font-semibold text-slate-950">真实能力优先</p>
                <p className="text-sm text-slate-600">优先迁移旧 UI 里已经接通 API 的模块。</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/80">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100">
                <Brain className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <p className="font-semibold text-slate-950">移动端重排</p>
                <p className="text-sm text-slate-600">不把桌面图表硬压缩到手机，而是按信息层级重组。</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/80">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100">
                <Languages className="h-5 w-5 text-sky-700" />
              </div>
              <div>
                <p className="font-semibold text-slate-950">Remote 并入</p>
                <p className="text-sm text-slate-600">英语阅读会直接进入这棵 canonical app，不再挂双树。</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
