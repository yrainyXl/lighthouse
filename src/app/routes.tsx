import { createBrowserRouter, Navigate } from "react-router";
import { Dashboard } from "./pages/Dashboard";
import { Bills } from "./pages/Bills";
import { Articles } from "./pages/Articles";
import { KnowledgeBase } from "./pages/KnowledgeBase";
import { EnglishReading } from "./pages/EnglishReading";
import { Layout } from "./components/Layout";

function RedirectToBills() {
  return <Navigate to="/bills" replace />;
}

function RedirectToArticles() {
  return <Navigate to="/articles" replace />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "bills", Component: Bills },
      { path: "articles", Component: Articles },
      { path: "knowledge", Component: KnowledgeBase },
      { path: "english-reading", Component: EnglishReading },
      { path: "notion", Component: RedirectToBills },
      { path: "interests", Component: RedirectToArticles },
    ],
  },
]);
