/**
 * UI 版本切换配置
 *
 * 修改 UI_VERSION 后重启 dev server 即可切换：
 *   'old' — 旧版 UI（src_backup/，原生 CSS 风格，路由：/ /notion /interests）
 *   'new' — 统一版 UI（src/app/，响应式单应用树，兼容旧路由）
 */
export const UI_VERSION: "old" | "new" = "new";
