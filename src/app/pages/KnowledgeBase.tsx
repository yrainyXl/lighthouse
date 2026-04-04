import { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  getKnowledgeTypeIcon,
  knowledgeFolders,
  knowledgeItems,
} from "../data/knowledge";
import { cn } from "../components/ui/utils";

export function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    return knowledgeItems.filter((item) => {
      const keyword = searchQuery.toLowerCase();
      const matchesSearch =
        !keyword ||
        item.title.toLowerCase().includes(keyword) ||
        item.summary.toLowerCase().includes(keyword) ||
        item.tags.some((tag) => tag.toLowerCase().includes(keyword));

      const matchesFolder = !selectedFolder || item.folder === selectedFolder;
      return matchesSearch && matchesFolder;
    });
  }, [searchQuery, selectedFolder]);

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-white/85 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <Badge className="rounded-full bg-slate-950 text-white hover:bg-slate-950">
              UI 已统一，数据边界已抽离
            </Badge>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              知识库
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">
              这一页先完成统一视觉、搜索和分类结构；知识条目当前来自本地 adapter，后续可替换成真实内容源而不重写整个页面。
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "分类数", value: String(knowledgeFolders.length) },
              { label: "条目数", value: String(knowledgeItems.length) },
              { label: "数据源", value: "本地 adapter" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Card className="border-white/70 bg-white/85">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-10"
              placeholder="搜索标题、摘要或标签"
            />
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1">
            <button
              type="button"
              className={cn(
                "rounded-full border px-4 py-2 text-sm whitespace-nowrap transition",
                !selectedFolder
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white",
              )}
              onClick={() => setSelectedFolder(null)}
            >
              全部分类
            </button>
            {knowledgeFolders.map((folder) => {
              const Icon = folder.icon;
              const active = selectedFolder === folder.id;

              return (
                <button
                  key={folder.id}
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm whitespace-nowrap transition",
                    active
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white",
                  )}
                  onClick={() =>
                    setSelectedFolder((current) =>
                      current === folder.id ? null : folder.id,
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {folder.name}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {knowledgeFolders.map((folder) => {
          const Icon = folder.icon;
          const active = selectedFolder === folder.id;

          return (
            <Card
              key={folder.id}
              className={cn(
                "cursor-pointer border-white/70 bg-white/85 transition hover:-translate-y-0.5 hover:shadow-lg",
                active && "ring-2 ring-slate-950",
              )}
              onClick={() =>
                setSelectedFolder((current) =>
                  current === folder.id ? null : folder.id,
                )
              }
            >
              <CardContent className="p-5">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl",
                    folder.surface,
                  )}
                >
                  <Icon className={cn("h-5 w-5", folder.accent)} />
                </div>
                <p className="mt-4 font-semibold text-slate-950">{folder.name}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {folder.count}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {folder.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="grid" className="gap-4">
        <TabsList className="h-auto w-full flex-wrap justify-start rounded-2xl bg-white/80 p-1">
          <TabsTrigger value="grid" className="flex-none rounded-xl px-4">
            卡片视图
          </TabsTrigger>
          <TabsTrigger value="list" className="flex-none rounded-xl px-4">
            列表视图
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          <div className="grid gap-4 md:grid-cols-2">
            {filteredItems.map((item) => {
              const folder = knowledgeFolders.find(
                (current) => current.id === item.folder,
              );
              const Icon = getKnowledgeTypeIcon(item.type);

              return (
                <Card
                  key={item.id}
                  className="border-white/70 bg-white/85 transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="mb-3 flex flex-wrap gap-2">
                          <Badge variant="outline">{item.type}</Badge>
                          {folder && (
                            <Badge
                              variant="outline"
                              className="border-slate-200 bg-slate-50"
                            >
                              {folder.name}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl">{item.title}</CardTitle>
                        <CardDescription className="mt-3 text-sm leading-7 text-slate-600">
                          {item.summary}
                        </CardDescription>
                      </div>
                      <div
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-2xl",
                          folder?.surface ?? "bg-slate-100",
                        )}
                      >
                        <Icon className={cn("h-5 w-5", folder?.accent ?? "text-slate-700")} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>更新于 {item.lastUpdated}</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <Card className="border-white/70 bg-white/85">
            <CardContent className="divide-y divide-slate-200 p-0">
              {filteredItems.map((item) => {
                const folder = knowledgeFolders.find(
                  (current) => current.id === item.folder,
                );

                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="max-w-2xl">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{item.type}</Badge>
                        {folder && (
                          <Badge
                            variant="outline"
                            className="border-slate-200 bg-slate-50"
                          >
                            {folder.name}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-3 text-lg font-semibold text-slate-950">
                        {item.title}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {item.summary}
                      </p>
                    </div>
                    <div className="text-sm text-slate-500 sm:text-right">
                      <p>{item.lastUpdated}</p>
                      <p className="mt-2">{item.tags.join(" · ")}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
