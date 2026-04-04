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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div>
            <p className="text-base font-semibold">LithtHouse</p>
            <p className="text-xs text-slate-500">{currentItem.label}</p>
          </div>
          {location.pathname !== "/" && (
            <Link
              to="/"
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600"
            >
              首页
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-4 pb-24">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/96 backdrop-blur">
        <div className="mx-auto grid max-w-3xl grid-cols-5">
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
                  "flex flex-col items-center gap-1 px-2 py-2 text-[11px] transition",
                  isActive ? "text-slate-950" : "text-slate-400",
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
