import { ArrowRight, BookOpen, Languages, Library, Receipt } from "lucide-react";
import { Link } from "react-router";
import { Card, CardContent } from "../components/ui/card";

export function Dashboard() {
  const modules = [
    {
      title: "账单统计",
      description: "看支出、分类、趋势和预算。",
      icon: Receipt,
      link: "/bills",
      surface: "bg-rose-100",
      accent: "text-rose-700",
    },
    {
      title: "文章推荐",
      description: "按话题拉取推荐和 AI 洞察。",
      icon: BookOpen,
      link: "/articles",
      surface: "bg-sky-100",
      accent: "text-sky-700",
    },
    {
      title: "知识库",
      description: "查看整理好的知识内容。",
      icon: Library,
      link: "/knowledge",
      surface: "bg-emerald-100",
      accent: "text-emerald-700",
    },
    {
      title: "英语阅读",
      description: "收藏词句，做精读并同步 Notion。",
      icon: Languages,
      link: "/english-reading",
      surface: "bg-violet-100",
      accent: "text-violet-700",
    },
  ];

  return (
    <div className="space-y-4">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          首页
        </h2>
        <p className="mt-1 text-sm text-slate-500">选择一个模块继续。</p>
      </section>

      <div className="grid gap-3">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.title} to={module.link} className="group">
              <Card className="border-slate-200 bg-white shadow-sm transition hover:border-slate-300">
                <CardContent className="flex items-center gap-4 p-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${module.surface}`}
                  >
                    <Icon className={`h-5 w-5 ${module.accent}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-950">{module.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {module.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
