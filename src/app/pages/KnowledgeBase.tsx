import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
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
    <div className="space-y-4">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          知识库
        </h2>
        <p className="mt-1 text-sm text-slate-500">搜索和查看内容。</p>
      </section>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-3 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-10"
              placeholder="搜索标题、摘要或标签"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              className={cn(
                "rounded-full border px-4 py-2 text-sm whitespace-nowrap transition",
                !selectedFolder
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-700",
              )}
              onClick={() => setSelectedFolder(null)}
            >
              全部
            </button>
            {knowledgeFolders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                className={cn(
                  "rounded-full border px-4 py-2 text-sm whitespace-nowrap transition",
                  selectedFolder === folder.id
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700",
                )}
                onClick={() =>
                  setSelectedFolder((current) =>
                    current === folder.id ? null : folder.id,
                  )
                }
              >
                {folder.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {filteredItems.map((item) => {
          const folder = knowledgeFolders.find((current) => current.id === item.folder);

          return (
            <Card key={item.id} className="border-slate-200 bg-white shadow-sm">
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{item.type}</Badge>
                  {folder && <Badge variant="outline">{folder.name}</Badge>}
                </div>
                <div>
                  <p className="font-medium text-slate-950">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.summary}
                  </p>
                </div>
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
                <p className="text-xs text-slate-500">{item.lastUpdated}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
