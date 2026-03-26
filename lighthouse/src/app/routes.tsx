import { createBrowserRouter } from "react-router";
import { Dashboard } from "./pages/Dashboard";
import { Bills } from "./pages/Bills";
import { Articles } from "./pages/Articles";
import { KnowledgeBase } from "./pages/KnowledgeBase";
import { Layout } from "./components/Layout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "bills", Component: Bills },
      { path: "articles", Component: Articles },
      { path: "knowledge", Component: KnowledgeBase },
    ],
  },
]);
