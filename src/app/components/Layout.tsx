import { Link, Outlet, useLocation } from "react-router";
import {
  BookOpen,
  Home,
  Languages,
  Library,
  Receipt,
} from "lucide-react";
import { cn } from "./ui/utils";

const navItems = [
  { path: "/", label: "首页", icon: Home },
  { path: "/bills", label: "账单", icon: Receipt },
  { path: "/articles", label: "推荐", icon: BookOpen },
  { path: "/knowledge", label: "知识库", icon: Library },
  { path: "/english-reading", label: "英语", icon: Languages },
];

export function Layout() {
  const location = useLocation();
  const currentItem =
    navItems.find((item) =>
      item.path === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(item.path),
    ) ?? navItems[0];

  const todayLabel = new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_28%),radial-gradient(circle_at_bottom,_rgba(168,85,247,0.14),_transparent_24%),linear-gradient(180deg,_#f8fbff_0%,_#f8fafc_45%,_#f1f5f9_100%)] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-white/50 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-violet-500 text-white shadow-[0_12px_28px_-14px_rgba(14,116,144,0.8)]">
              <span className="text-sm font-semibold">L</span>
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight">LithtHouse</p>
              <p className="text-xs text-slate-500">{currentItem.label}</p>
            </div>
          </div>

          <div className="rounded-full border border-slate-200/80 bg-slate-50/80 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
            {todayLabel}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-4 pb-28">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-3 z-40 px-3">
        <div className="mx-auto grid max-w-md grid-cols-5 rounded-[28px] border border-white/70 bg-white/90 p-1.5 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] backdrop-blur-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-[20px] px-2 py-2 text-[11px] font-medium transition",
                  isActive
                    ? "bg-slate-950 text-white shadow-[0_14px_28px_-16px_rgba(15,23,42,0.8)]"
                    : "text-slate-400",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
