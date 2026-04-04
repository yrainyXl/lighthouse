import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import {
  BookOpen,
  Home,
  Languages,
  Library,
  Menu,
  Receipt,
  X,
} from "lucide-react";
import { cn } from "./ui/utils";

const navItems = [
  { path: "/", label: "首页", icon: Home },
  { path: "/bills", label: "账单统计", icon: Receipt },
  { path: "/articles", label: "文章推荐", icon: BookOpen },
  { path: "/knowledge", label: "知识库", icon: Library },
  { path: "/english-reading", label: "英语阅读", icon: Languages },
];

export function Layout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const activeLabel = useMemo(() => {
    return (
      navItems.find((item) =>
        item.path === "/"
          ? location.pathname === "/"
          : location.pathname.startsWith(item.path),
      )?.label ?? "工作台"
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.14),_transparent_28%),linear-gradient(180deg,_#eef4ff_0%,_#f8fafc_35%,_#f3f4f6_100%)] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-white/20 bg-slate-950/92 text-white backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-violet-500 shadow-lg shadow-sky-950/30">
              <Library className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">LithtHouse</p>
              <p className="text-xs text-slate-300">旧 UI 交互基底 · 统一响应式应用</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
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
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm transition",
                    isActive
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-300 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 md:hidden"
            aria-label={menuOpen ? "关闭导航" : "打开导航"}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 bg-slate-950/98 md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6">
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
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                      isActive
                        ? "bg-white text-slate-950"
                        : "text-slate-200 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="mb-6 rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.4)] backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                Unified Responsive Workspace
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                一套 UI，同步兼容桌面和移动端
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                以旧 UI 的导航和信息层级为基底，把账单、推荐、知识库和英语阅读统一到同一棵应用树。
              </p>
            </div>
            <div className="w-fit rounded-full border border-slate-200 bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-slate-950/15">
              当前模块：{activeLabel}
            </div>
          </div>
        </section>

        <Outlet />
      </main>

      <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
          LithtHouse © 2026 · Canonical responsive app for desktop and mobile
        </div>
      </footer>
    </div>
  );
}
