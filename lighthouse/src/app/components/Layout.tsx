import { Outlet, Link, useLocation } from "react-router";
import { Home, Receipt, BookOpen, Library, Languages } from "lucide-react";

export function Layout() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "首页", icon: Home },
    { path: "/bills", label: "账单", icon: Receipt },
    { path: "/articles", label: "文章", icon: BookOpen },
    { path: "/english-reading", label: "英语阅读", icon: Languages },
    { path: "/knowledge", label: "知识库", icon: Library },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto h-14 max-w-7xl px-4 sm:h-16 sm:px-6 lg:px-8">
          <div className="flex h-full items-center justify-between">
            <div className="flex items-center gap-2">
              <Library className="h-7 w-7 text-blue-600 sm:h-8 sm:w-8" />
              <h1 className="text-base font-semibold text-gray-900 sm:text-xl">我的知识库</h1>
            </div>
            <nav className="hidden gap-1 sm:flex">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
                      isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-4 pb-24 sm:px-6 sm:py-8 sm:pb-8 lg:px-8">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white sm:hidden">
        <div className="grid grid-cols-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 py-2 text-xs ${
                  isActive ? "text-blue-600" : "text-gray-500"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
