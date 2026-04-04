import { createRoot } from "react-dom/client";
import { UI_VERSION } from "../ui.config";

async function bootstrap() {
  const root = createRoot(document.getElementById("root")!);

  if (UI_VERSION === "old") {
    // 旧版 UI：原生 CSS 风格
    // @ts-ignore
    await import("../src_backup/styles/index.css");
    const { default: App } = await import("../src_backup/App");
    root.render(<App />);
  } else {
    // 新版 UI：shadcn/ui + Tailwind（CSS 由 ./styles/index.css 提供）
    // @ts-ignore – CSS 模块由 Vite 处理，无需类型声明
    await import("./styles/index.css");
    const { default: App } = await import("./app/App");
    root.render(<App />);
  }
}

bootstrap();
