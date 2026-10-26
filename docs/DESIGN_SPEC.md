# Coin's Blog — Design Specification

> 本文档是面向 AI 的项目设计规范，目标是让 AI 能够仅凭此文档从零复现整个项目。

---

## 1. 项目概述

一个极简风格的个人博客，基于 Astro 静态站点生成器构建。核心特性：

- **纯静态输出** — 构建产物为纯 HTML/CSS/JS，无服务器运行时
- **Markdown 驱动** — 博客文章以 `.md` 文件存储在 `posts/` 目录
- **Memos 集成** — 通过外部 Memos API 拉取短笔记/动态，客户端渲染
- **双主题** — 支持 light/dark 模式，系统偏好感知 + 手动切换
- **响应式布局** — 桌面端侧边栏 + 主内容区；移动端折叠头部 + 全宽内容
- **克制的视觉语言** — 只用 Radix 色阶、0.5px 细线、4 档字号，不用阴影和彩色左边框（详见 §18）
- **Cloudflare Pages 部署** — 全球 CDN 静态托管

---

## 2. 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Astro | ^6.0.4 |
| 语言 | TypeScript | strict mode (extends `astro/tsconfigs/strict`) |
| CSS | Tailwind CSS v4 | ^4.2.1 (通过 `@tailwindcss/vite` 插件接入) |
| 排版插件 | @tailwindcss/typography | ^0.5.19 |
| Markdown 解析 | markdown-it | ^14.1.1 |
| 语法高亮 | Shiki (双主题: github-light / github-dark) | ^4.0.2 |
| Shiki-MarkdownIt 桥接 | @shikijs/markdown-it | ^4.0.2 |
| 锚点生成 | markdown-it-anchor | ^9.2.0 |
| GitHub Alerts | markdown-it-github-alerts | ^1.0.1 |
| Frontmatter 解析 | gray-matter | ^4.0.3 |
| 部署 CLI | Wrangler (Cloudflare) | ^4.73.0 |
| 包管理器 | pnpm | — |
| Node.js | >= 22.12.0 | — |

---

## 3. 目录结构

```
coin-blog/
├── posts/                          # Markdown 博客文章包
│   ├── {slug}/
│   │   ├── index.md                # 文章正文
│   │   └── assets/                 # 当前文章私有图片与附件
│   └── draft/                      # 未发布文章包 (scripts/check-drafts.sh 移入)
├── public/
│   ├── avatar.png               # 站点头像 (也用作 favicon)
│   ├── favicon.png
│   ├── favicon.ico
│   └── fonts/                   # 自托管字体 (latin 子集 woff2)
├── src/
│   ├── components/
│   │   ├── HomePage.astro       # 首页主体 (按年分组的文章列表 + Memos 标签页)
│   │   ├── MobileHeader.astro   # 移动端顶栏 + 导航抽屉
│   │   ├── Sidebar.astro        # 桌面端左侧边栏
│   │   └── ThemeToggle.astro    # 深色/浅色模式切换按钮
│   ├── layouts/
│   │   └── Layout.astro         # 全局 HTML 布局 (head + body 骨架)
│   ├── lib/
│   │   ├── config.ts            # 仅 re-export siteConfig
│   │   ├── markdown.ts          # Markdown → HTML 渲染 (Shiki 高亮 + 锚点)
│   │   ├── memo-time.mjs        # Memo 时间戳选取与格式化 (有单测)
│   │   ├── nav.ts               # 导航分组、激活判断、tab 映射
│   │   ├── nav-icons.ts         # 导航 SVG 图标 (按 label 索引) + 外链箭头
│   │   └── posts.ts             # 文章读取、排序、阅读时间估算
│   ├── pages/
│   │   ├── index.astro          # / 路由 → 渲染 HomePage
│   │   ├── post.astro           # /post 路由 → 渲染 HomePage
│   │   ├── memo.astro           # /memo 路由 → 渲染 HomePage
│   │   ├── [slug].astro         # /:slug 动态路由 → 文章详情页
│   │   ├── post-assets/[...path].ts  # 输出文章包内的 assets 文件
│   │   └── atom.xml.ts          # /atom.xml → Atom RSS feed
│   └── styles/
│       └── global.css           # Radix 色阶、语义令牌、排版规则
├── tests/
│   └── memo-time.test.mjs       # 运行: node --test tests/*.mjs
├── astro.config.mjs             # Astro 配置 (Tailwind 插件 + dev 下的 Memos 代理)
├── site.config.ts               # 站点级配置 (标题、导航、UI 文案等)
├── tsconfig.json                # TypeScript 配置
├── package.json                 # 依赖与脚本
└── wrangler.jsonc               # Cloudflare Pages 部署配置
```

---

## 4. 站点配置 (`site.config.ts`)

集中管理所有可配置项，导出一个 `siteConfig` 对象：

```typescript
export const siteConfig = {
  title: "Coin's Blog",
  description: "A personal blog by coin",
  author: "coin",
  url: "https://liaoguoyin.com",        // 用于 RSS feed、canonical 等绝对 URL
  lang: "zh-CN",
  avatar: "/avatar.png",                // public/ 目录下的头像

  // 导航链接
  // external: 新标签打开，主导航中显示外链箭头
  // iconOnly: 不进主导航，只在底部图标栏渲染
  navLinks: [
    { href: "/post", label: "Posts" },
    { href: "/memo", label: "Memos" },
    { href: "https://aiusage.liaoguoyin.com", label: "AI Usage", external: true },
    { href: "/atom.xml", label: "RSS", external: true, iconOnly: true },
    { href: "https://github.com/LiaoGuoYin/coin-blog", label: "GitHub", external: true, iconOnly: true },
  ],

  // UI 文案 (英文；正文内容仍是中文)
  ui: {
    tocLabel: "Contents",
    prevPost: "Previous",
    nextPost: "Next",
    readingTime: (min: number) => `${min} min read`,
    copyButton: "Copy",
    copiedButton: "Copied",
    noPosts: "No posts yet.",
    noMemos: "No memos yet.",
    loadMore: "Load more",
    loading: "Loading",
  },

  memosPerPage: 20,                     // 每次加载的 Memo 条数

  // dev 下走 astro.config.mjs 里的 /memos-api 代理，避免跨域
  memosApiUrl: import.meta.env.DEV ? "/memos-api" : "https://memo.liaoguoyin.com",
};
```

`src/lib/config.ts` 仅做 re-export：`export { siteConfig } from '../../site.config';`

导航图标在 `src/lib/nav-icons.ts` 中**按 `label` 索引**，改 label 时要同步改图标的 key。

---

## 5. 构建配置

### 5.1 Astro 配置 (`astro.config.mjs`)

注册 Tailwind CSS v4 的 Vite 插件，并在 dev server 上把 `/memos-api` 代理到 Memos 服务：

```javascript
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        '/memos-api': {
          target: 'https://memo.liaoguoyin.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/memos-api/, ''),
        },
      },
    },
  },
});
```

`memosApiUrl` 在 dev 下是相对路径，客户端构造请求时必须带 base：`new URL(path, location.origin)`。

### 5.2 TypeScript (`tsconfig.json`)

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

### 5.3 Cloudflare Pages (`wrangler.jsonc`)

```json
{
  "name": "coin-blog",
  "compatibility_date": "2026-01-01",
  "pages_build_output_dir": "./dist"
}
```

### 5.4 脚本 (`package.json scripts`)

```json
{
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "deploy": "astro build && wrangler pages deploy dist"
}
```

---

## 6. 内容模型

### 6.1 博客文章 (Post)

**存储位置**：`posts/{slug}/index.md`

**文章包结构**：

```text
posts/
└── hello-world/
    ├── index.md
    └── assets/
        └── cover.webp
```

**Frontmatter 格式**：

```yaml
---
title: 文章标题
date: '2025-03-13T17:03:38+00:00'   # ISO 8601 或 YYYY-MM-DD
published: true                       # 只有 true 才会被展示
feature: ''                           # 预留字段，当前未使用
---

正文 Markdown 内容...
```

**TypeScript 接口**：

```typescript
interface PostMeta {
  title: string;
  date: string;
  slug: string;   // 取自 posts/{slug}/ 文件夹名
}

interface Post extends PostMeta {
  content: string;    // 原始 Markdown 文本
  sourcePath: string; // index.md 绝对路径
  assetsDir: string;  // assets/ 绝对路径
  type: 'post';
}
```

**读取逻辑** (`src/lib/posts.ts`)：

1. 读取 `posts/` 下所有 `*/index.md` 文章包
2. 用 `gray-matter` 解析 frontmatter
3. 过滤 `published !== true` 的文章
4. 按 `date` 降序排列（最新在前）
5. slug 取自文章文件夹名
6. `./assets/...` 相对资源在渲染时映射为 `/post-assets/{slug}/assets/...`

### 6.2 Memo (来自外部 API)

**数据源**：外部 Memos API (`siteConfig.memosApiUrl`)，只读公开 Memo，无鉴权

**API 调用**：`GET {memosApiUrl}/api/v1/memos?pageSize={memosPerPage}&pageToken={token}`，按需分页（点 Load more 才取下一页）

**TypeScript 接口**：

```typescript
interface Memo {
  name: string;                  // "memos/123"，/ 换成 - 后作为 DOM id 和锚点
  content: string;               // Markdown 格式
  createTime: string;            // ISO 8601
  updateTime?: string;
  displayTime?: string | null;   // 可能缺失
  tags: string[];
  pinned: boolean;
  snippet: string;
  attachments: MemoAttachment[]; // 只渲染 image/* 类型
}
```

**展示时间**：`displayTime` → `createTime` → `updateTime` 依次兜底（`lib/memo-time.mjs`），格式 `YYYY-MM-DD HH:mm`

**排序规则**（每页内）：Pinned 优先 → 按 `createTime` 降序

---

## 7. 路由 & 页面

### 7.1 路由表

| URL | 文件 | 渲染方式 | 说明 |
|-----|------|----------|------|
| `/` | `pages/index.astro` | SSG | 首页，渲染 HomePage 组件，默认显示 Posts 标签 |
| `/post` | `pages/post.astro` | SSG | 同上，区别在于 URL 路径用于标签切换判断 |
| `/memo` | `pages/memo.astro` | SSG | 同上，URL 触发 Memos 标签 |
| `/:slug` | `pages/[slug].astro` | SSG (getStaticPaths) | 文章详情页 |
| `/atom.xml` | `pages/atom.xml.ts` | SSG (API Route) | Atom RSS Feed |

### 7.2 关键设计：`/`、`/post`、`/memo` 共用同一组件

三个路由页面文件内容完全一样，均渲染 `<HomePage />`。标签页切换通过客户端 JS 实现：

- 读取 `window.location.pathname` 判断当前是 `/post` 还是 `/memo`
- 点击导航链接时 `e.preventDefault()` + `history.replaceState()` 切换 URL
- 用 CSS class `.tab-hidden` 切换 Posts/Memos section 的显示/隐藏
- Memos 数据惰性加载：首次切换到 Memos 标签时才发起 API 请求

### 7.3 文章详情页 (`[slug].astro`)

**构建时**通过 `getStaticPaths()` 生成所有文章的静态页面。

每个页面的 props 包含：

- `post`: 当前文章
- `prev`: 上一篇 (按日期更早的) — 可能为 null
- `next`: 下一篇 (按日期更新的) — 可能为 null

页面结构：

1. **Header**: 标题 + 元信息行（等宽字体日期、阅读时长，两项只用 16px 间距分开）
2. **Body**: 左侧文章正文 (`prose`)，右侧 TOC（`lg` 1024px 起显示）
3. **Prev/Next 导航**: 底部上下篇链接
4. **移动端目录**: 顶栏的 Contents 按钮打开全屏目录面板（见 §15.2）

没有返回链接、回到顶部按钮和阅读进度条：侧边栏的 Posts 在文章页保持激活，已经承担返回入口。

### 7.4 RSS Feed (`atom.xml.ts`)

- 格式：Atom XML
- 内容：所有已发布文章
- 每篇文章包含前 2000 字符的原始 Markdown 作为 content
- XML 实体正确转义 (`&`, `<`, `>`, `"`, `'`)

---

## 8. 布局系统

### 8.1 全局布局 (`layouts/Layout.astro`)

```
┌─────────────────────────────────────────────┐
│ <html>                                       │
│ <head>                                       │
│   meta charset, viewport, description        │
│   title, canonical, Open Graph               │
│   favicon (avatar.png), RSS link             │
│   Dark mode 初始化脚本 (内联, 防闪烁)         │
│   自托管字体 preload (Poppins 400, Lora)     │
│ </head>                                      │
│ <body>                                       │
│   <div class="site-layout flex ...">         │
│     ┌──────────┬──────────────────────┐      │
│     │ Sidebar  │ <main class="p-2">   │      │
│     │ (desktop │   <div> 内容面板      │      │
│     │  only)   │     <slot />         │      │
│     │          │   </div>             │      │
│     │          │ </main>              │      │
│     ├──────────┤                      │      │
│     │ Mobile   │  (仅移动端显示)       │      │
│     │ Header   │                      │      │
│     └──────────┴──────────────────────┘      │
│   </div>                                     │
│ </body>                                      │
│ </html>                                      │
└─────────────────────────────────────────────┘
```

**Props**：`title`、`description`、`ogType`、`showToc`（文章页有标题时为 true，控制移动端顶栏的 Contents 按钮）

**两层表面**：

- 外层 chrome（body、侧边栏、移动端顶栏）：`--bg-chrome`
- 内容面板：`--bg-panel` 背景，`0.5px solid var(--line-chrome)` 细线，`--radius-panel` (12px)，**无阴影**
- `<main>` 的 8px 内边距让面板四周留出一圈 chrome

**响应式断点**：

- `lg` (1024px): Sidebar 显示，`flex-row` 布局，内容区独立滚动 (`lg:overflow-y-scroll lg:max-h-screen`)
- 移动端: MobileHeader 显示，`flex-col` 布局

### 8.2 Dark Mode 初始化

在 `<head>` 中放置内联 `<script is:inline>` 防止闪烁：

```javascript
// 压缩后的初始化脚本逻辑:
// 1. 移除 html 上的 light/dark class
// 2. 读取 localStorage('theme')
// 3. 若为 'system' 或未设置，检测 prefers-color-scheme
// 4. 添加对应的 class ('light' 或 'dark')
```

---

## 9. 组件详解

### 9.1 Sidebar (`components/Sidebar.astro`)

**仅桌面端显示** (`hidden lg:flex`)，宽 `lg:w-56`，`px-4 py-6`，区块间距 32px。

结构 (从上到下)：

1. **头部行**: 头像 (圆形 32px，无阴影) + 站点标题 (14px/600) + ThemeToggle（`-mr-2`，图标和右边距光学对齐）
2. **主导航**: `mainLinks`（非 `iconOnly` 的链接），每项是 `.nav-item`：图标 + 文字 + 外链箭头 (仅 external)
3. **底部图标栏**: `iconLinks`（RSS、GitHub），32px `.icon-link`，`-ml-2` 光学对齐

**`.nav-item`** (`global.css`)：

- 高 36px，`padding: 0 8px; margin: 0 -8px` —— 背景向两侧外扩，图标和文字仍落在 16px 栏线上
- 14px/500，`--text-2`，`--radius-control` (8px)
- hover：`--nav-hover` 背景 + `--text`
- 激活：`[aria-current="page"]` → `--nav-selected` 背景 + `--text`
- 激活判断 (`lib/nav.ts` 的 `isActive`)：`/memo` 只在 `/memo` 激活；`/post` 在其余所有内部页激活（文章页归属 Posts）

### 9.2 MobileHeader (`components/MobileHeader.astro`)

**仅移动端显示** (`lg:hidden`)

1. **顶栏** (`h-14 px-4`): 头像 (28px) + 站点标题 | 操作区
   - 操作区按钮都是 44px 触控目标 (`.icon-link--touch`)，容器 `-mr-3.5` 抵消最后一个按钮的内缩
   - 顺序：Contents（仅 `showToc`）→ ThemeToggle → 菜单
2. **导航抽屉** `#mobile-nav`: 初始 `hidden`，点击菜单按钮切换；条目为 `.nav-item.nav-item--touch`（高 44px，`margin: 0 -12px`），底部图标栏同样 44px

菜单按钮切换汉堡/X 图标并同步 `aria-expanded`，没有展开动画。

### 9.3 ThemeToggle (`components/ThemeToggle.astro`)

- 接受 `class` prop，调用方用它追加光学对齐的负 margin 或 `icon-link--touch`
- Sun 图标 (暗色模式下显示) / Moon 图标 (亮色模式下显示)，1.5 描边
- 通过 CSS `.dark .theme-icon-sun { display: block }` 控制图标显隐
- 点击时：读取当前主题 → 切换 → 更新 `<html>` class + `localStorage`

### 9.4 HomePage (`components/HomePage.astro`)

核心内容组件，被 `/`、`/post`、`/memo` 三个路由共用。

```
<Layout>
  <div class="px-4 py-5 sm:px-16 sm:py-12">
    <section id="tab-posts" class="max-w-[720px]">   ← 按年分组的文章列表
    <section id="tab-memos" class="max-w-[640px]">   ← Memos 流
  </div>
</Layout>
```

**文章列表**（只有一种样式，不分页，全部渲染）：

```
2025    用 Git 裸仓库在多台内网机器中同步代码        10-10
        俺的电子垃圾列表                             08-31
─────────────────────────────────────────────────────
2024    Zerotier 组网之自建 Moon 加速节点           11-27
```

- 构建时按 `formatDate(date).slice(0, 4)` 分组（文章已按日期降序，分组天然有序）
- `.year-group`：上下 16px 内边距，组之间 0.5px `--line` 分隔；`sm` 起为 `80px 1fr` 两列网格，窄屏年份在上
- `.year-label`：等宽 12px，`--text-2`
- `.post-item`：标题 + 右侧等宽 `MM-DD`，上下 10px；hover 时标题变 `--accent-text`

**Memos 标签页**的状态：

1. `#memo-loading` — 4 条静态占位条（无 shimmer 动画）
2. `#memo-error` — 空数据或请求失败时显示 `noMemos`
3. `#memo-list` — 实际内容（见 §16）
4. `#memo-load-more` — 还有下一页时显示 Load more 按钮，没有就整块隐藏（不显示禁用态）

#### 客户端 Memos 渲染逻辑

1. 懒初始化客户端 MarkdownIt 实例 (`breaks: true` + strikethrough + GitHub Alerts，不含语法高亮)
2. `fetchMemoPage(pageToken)` — 每次取 `memosPerPage` 条
3. 渲染为 `<article class="memo-item">` 注入 `#memo-list`，Load more 时追加
4. 首屏加载后若 URL 带 Memo 锚点，`scrollIntoView` 定位

#### 客户端 Tab 切换逻辑

```javascript
// 0. 内联脚本在首帧前根据 pathname / #memos- hash 隐藏对应 section，防闪烁
// 1. 拦截带 data-tab 的导航链接点击 → e.preventDefault()
// 2. history.replaceState 更新 URL (/post 或 /memo)
// 3. 切换 .tab-hidden class
// 4. 只切换 a[data-tab] 的 aria-current，样式全由 CSS 决定
// 5. 首次切到 Memos 时触发 loadMemos()
```

---

## 10. Markdown 渲染管线

### 10.1 构建时渲染 (`src/lib/markdown.ts`)

```
Markdown 文本
     ↓
  markdown-it (html: true, linkify: true, typographer: true)
     ├── 启用 strikethrough
     ├── 插件: markdown-it-anchor (slugify: encodeURI + lowercase + 空格转 -)
     ├── 插件: markdown-it-github-alerts
     ├── 自定义插件: image_to_figure (段落中的独立图片 → <figure><img><figcaption>)
     ├── 插件: @shikijs/markdown-it (双主题: github-light + github-dark)
     └── 自定义: 未知语言 fallback (未加载的语言 → 清空 info → 纯文本)
     ↓
  { html: string, headings: Heading[] }
```

**支持的语法高亮语言**：

```
javascript, typescript, jsx, tsx,
css, html, json, markdown, yaml, toml,
python, bash, sh, shell, zsh,
go, rust, java, c, cpp, swift, kotlin,
sql, xml, dockerfile, nginx, ini
```

### 10.2 Heading 提取

从 Markdown 原文中用正则 `/^(#{2,3}) (.+)$/gm` 提取 h2/h3 标题。

Slugify 函数：`encodeURIComponent(s.trim().toLowerCase().replace(/\s+/g, '-'))`

### 10.3 客户端渲染 (Memos 用)

HomePage 中的 Memos 使用独立的轻量 MarkdownIt 实例，和构建时的差异：

- `breaks: true` (构建时为 false)
- 无 Shiki 语法高亮 (代码块用普通 `pre` 样式，避免把高亮器打进客户端包)
- 无 `markdown-it-anchor` (Memo 不需要锚点)
- 无 `image_to_figure` (Memo 不需要 figure 标签)
- 保留 strikethrough + GitHub Alerts

### 10.4 Image → Figure 转换

自定义 markdown-it core rule：当一个段落 (`paragraph_open + inline + paragraph_close`) 中 **仅含一张图片** 且图片有 **非空 alt 文本** 时，将整个段落替换为：

```html
<figure>
  <img src="..." alt="..." loading="lazy">
  <figcaption>alt 文本</figcaption>
</figure>
```

---

## 11. 阅读时间估算

```typescript
function estimateReadingTime(content: string): number {
  const chineseChars = (content.match(/[一-鿿]/g) || []).length;
  const englishWords = content.replace(/[一-鿿]/g, '').split(/\s+/).filter(Boolean).length;
  const minutes = chineseChars / 300 + englishWords / 200;
  return Math.max(1, Math.round(minutes));
}
```

中文按 300 字/分钟，英文按 200 词/分钟，混合计算，最少 1 分钟。

---

## 12. 颜色系统

### 12.1 色阶

使用 **Radix UI Colors** 的 12 级色阶，6 个色族：

| 色族 | 用途 |
|------|------|
| **Sand** | 中性色：面板、元素背景、细线、文字 |
| **Gold** | 品牌色：外层 chrome 背景、导航 hover/选中、选区、强调文字 |
| **Blue** | Note 提示块 |
| **Grass** | Tip 提示块 |
| **Bronze** | Important 提示块 |
| **Red** | Caution 提示块 |

另有 `--black-a11` (`rgba(0,0,0,0.9)`，Radix blackA 11) 用于图片 lightbox 遮罩。

**按 Radix 的步骤语义取色**，不跨用途借用：

| 步骤 | 用途 |
|------|------|
| 1–2 | 应用背景 |
| 3–5 | 组件背景（常态 / hover / 选中） |
| 6–8 | 边框与分隔线 |
| 9–10 | 实色填充 |
| 11–12 | 文字（11 次要 / 12 主要） |

### 12.2 语义令牌

组件**只引用语义令牌**，不直接写色阶。令牌定义在 `global.css` 的 `:root`，`.dark` 只覆盖与亮色不同的映射：

| 令牌 | Light | Dark | 用途 |
|------|-------|------|------|
| `--bg-chrome` | gold-2 | gold-1 | body、侧边栏、移动端顶栏 |
| `--bg-panel` | sand-1 | sand-2 | 内容面板、浮层按钮底 |
| `--bg-subtle` | sand-2 | sand-3 | 代码块、引用块 |
| `--bg-element` | sand-3 | sand-4 | 行内代码、按钮 hover |
| `--nav-hover` | gold-3 | gold-3 | 导航 / 图标按钮 hover |
| `--nav-selected` | gold-4 | gold-4 | 当前导航项 |
| `--selection` | gold-5 | gold-5 | `::selection` |
| `--line` | sand-6 | sand-6 | 内容区分隔线、代码块边框 |
| `--line-chrome` | gold-6 | gold-6 | 内容面板外框 |
| `--line-control` | sand-7 | sand-7 | 按钮边框 |
| `--text` | sand-12 | sand-12 | 主要文字 |
| `--text-2` | sand-11 | sand-11 | 次要文字、日期、标签 |
| `--accent-text` | gold-11 | gold-11 | 正文链接、TOC 当前项、标题 hover |

暗色模式下色阶本身也会切换（Radix dark scale），所以同名步骤在两种主题下都成立。

### 12.3 其他令牌

```css
--radius-inline: 4px;    /* 行内代码、代码块内的复制按钮 */
--radius-control: 8px;   /* 导航项、图标按钮、引用块、提示块、Load more */
--radius-block: 10px;    /* 代码块 */
--radius-panel: 12px;    /* 内容面板 */
--ease-base: 250ms ease-out;  /* 全站唯一的过渡曲线 */
```

**同心圆角**：嵌套元素的圆角 = 外层圆角 − 间距。例如复制按钮距代码块边缘 6px，代码块 10px，按钮取 4px。

### 12.4 Tailwind v4 集成

通过 `@theme inline` 块将色阶映射为 Tailwind 颜色工具类（sand / gold / blue / bronze / grass 各 12 级）：

```css
@theme inline {
  --color-sand-1: var(--sand-1);
  --color-sand-2: var(--sand-2);
  /* ... */
}
```

组件实际上主要用 `style="color: var(--text-2)"` 或 scoped CSS 引用语义令牌，Tailwind 只负责布局类。

暗色模式自定义变体：`@custom-variant dark (&:where(.dark, .dark *));`

**层叠注意**：`global.css` 中没包在 `@layer` 里的规则优先级高于 Tailwind 工具类（工具类在 `@layer utilities` 里）。所以 `.nav-item` 的负 margin 直接写在全局规则里；`.icon-link` 全局不设 margin，调用处才能用 `-mr-2` 这类工具类做光学对齐。

---

## 13. 排版 & 字体

### 13.1 字体加载

自托管于 `public/fonts/`（latin 子集 woff2），`@font-face` 写在 `global.css`，统一 `font-display: optional`；`Layout.astro` 只 preload Poppins 400 和 Lora 两个首屏必需文件。中文字符走系统字体回退。

| 字体 | 变量 | 用途 | 字重 |
|------|------|------|------|
| Poppins | `--font-ui` | 全站 UI、文章内标题、图注 | 400, 500, 600 |
| Lora | `--font-body` | 文章正文 | 400–600 (可变)，italic 400 |
| JetBrains Mono | `--font-mono` | 代码、日期、年份 | 400–500 (可变) |

```css
--font-ui: "Poppins", system-ui, -apple-system, sans-serif;
--font-body: "Lora", Georgia, "Times New Roman", serif;
--font-mono: "JetBrains Mono", ui-monospace, "Cascadia Code", Menlo, monospace;
```

### 13.2 字号阶梯

全站**只有 4 档字号**，最小 12px：

| 字号 / 行高 | 用途 |
|-------------|------|
| 24 / 32 | 文章 h1 |
| 16 / 28 | 文章正文；文章内 h2/h3/h4 (16/24) |
| 14 / 20 | UI 正文：导航、列表标题、Memo 正文 (14/24)、代码 (14/22)、表格、提示块标题、Load more |
| 12 / 20 | 元信息：日期、阅读时长、年份、TOC、标签、图注、复制按钮 |

文章内标题不放大字号，用 UI 字体 + 字重区分层级：h2/h3 为 600，h4 为 500；上边距 h2 40px、h3 32px、h4 24px。

### 13.3 Prose 排版规则

`@tailwindcss/typography` 的 `--tw-prose-*` 变量全部映射到语义令牌（正文 `--text`、链接 `--accent-text`、分隔线 `--line` 等）。

```css
.prose {
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 28px;
  font-weight: 400;
  text-align: justify;
  text-autospace: ideograph-alpha ideograph-numeric;
}
```

- 段落下边距 16px；列表上 12px 下 16px，`li` 上下 4px
- `hr`、表格行线均为 0.5px

### 13.4 块级元素

- **选区**: `::selection { background-color: var(--selection); }`
- **Inline code** (非 `<pre>` 内): `--bg-element` 底，无边框，`--radius-inline`，14px/400，隐藏 Markdown 反引号 (`::before/::after { content: none }`)
- **Blockquote**: `--bg-subtle` 底，**无边框**，`--radius-control`，`12px 16px` 内边距，`--text-2`，正体（不斜体），去掉 typography 插件自动加的引号
- **Figcaption**: UI 字体 12/20，`--text-2`，居中，正体
- **链接**: `--accent-text`，无下划线，hover 变 `gold-12`
- **外部链接**: `a[href^="http"]::after` 用 `mask` + `background-color: currentColor` 画箭头图标（跟随文字颜色），透明度 0.6；含图片的链接不显示
- **代码块** (Shiki): 背景强制 `--bg-subtle`（两种主题都用 Radix 底色，token 颜色仍来自 github-light/dark），0.5px `--line` 边框，`--radius-block`，`16px 20px` 内边距，14/22；暗色模式通过 `.dark .shiki span { color: var(--shiki-dark) !important }` 切换 token 色

---

## 14. 全局样式亮点

### 14.1 滚动条

```css
.scrollable-area {
  scrollbar-width: thin;
  scrollbar-color: var(--line) transparent;
}
/* WebKit: 4px 宽，--line 色滑块 */
```

### 14.2 图标按钮 `.icon-link`

- 32×32，`--radius-control`，`--text-2`；hover 为 `--nav-hover` 背景 + `--text`
- `.icon-link--touch`：44×44，移动端使用
- 调用处用负 margin（桌面 -8px，移动端 -14px）让图标本身而不是点击区域对齐栏线

### 14.3 GitHub Alerts / Callouts

用 Radix 步骤 3 做背景、步骤 11 做标题色，**无边框、无彩色左边框**；`--radius-control`，`12px 16px` 内边距；标题为 UI 字体 14/20/600。

| 类型 | 背景 | 标题色 |
|------|------|--------|
| Note | blue-3 | blue-11 |
| Tip | grass-3 | grass-11 |
| Important | bronze-3 | bronze-11 |
| Warning | gold-3 | gold-11 |
| Caution | red-3 | red-11 |

### 14.4 Code Copy 按钮

- 运行时把 `.shiki` 包进 `.shiki-wrapper`，按钮绝对定位在 `top: 6px; right: 6px`
- 高 28px，0.5px `--line-control` 边框，`--radius-inline`，`--bg-panel` 底，12px/500
- **始终可见**（触屏没有 hover，不做隐藏）
- 点击后文字从 "Copy" 变为 "Copied"，1.5 秒后恢复

### 14.5 Heading Anchor

- 绝对定位于 h2/h3 左侧，`--text-2`
- 默认 `opacity: 0`，hover 标题时以 `--ease-base` 淡入 `#`
- 点击时复制完整 URL 到剪贴板，显示 `✓`，1.5 秒后恢复

---

## 15. 文章详情页交互

### 15.1 TOC (目录导航，桌面端)

- `lg` (1024px) 起显示；宽 176px，`xl` 起 208px
- `position: sticky; top: 48px`（`xl` 起 64px）
- 标题 "Contents"：12/20/600，`--text`，不大写、不加字距
- 条目：12/20，`4px 0` 内边距，`--text-2`；h3 缩进 12px
- 当前项：`--accent-text` + 500 字重；**无竖线、无进度条**

**Active 高亮**：

- `IntersectionObserver` (`rootMargin: -80px 0px 0px 0px`) 追踪进入视口的标题，取文档顺序中第一个
- 没有标题在视口内时，取最后一个已滚过顶部的标题
- 滚动到底部 (距底 <=2px) 时激活最后一个标题
- 自动适配自定义滚动容器 (找到最近的 `overflow-y: auto/scroll` 祖先)
- 同一个 active 状态同步到移动端目录面板

### 15.2 移动端目录面板

- 入口：移动端顶栏的 Contents 按钮 `#toc-open-btn`（仅文章有标题时渲染），`aria-controls="toc-sheet"`，`aria-expanded` 随开关同步
- 面板 `#toc-sheet`：`position: fixed`，从顶栏下方 (56px) 铺到底部，左右各留 8px；`--bg-panel` 底，0.5px `--line-chrome` 外框，顶部 12px 圆角——和内容面板同形
- **无动画**，直接显示/隐藏 (`hidden` 属性)；打开时锁定 body 滚动
- 头部：标题 "Contents" 14/600 + 44px 关闭按钮
- 条目：最小高 44px，14px，h3 缩进 16px；当前项 `--accent-text` + 500
- 关闭方式：关闭按钮、点任一条目、`Esc`

### 15.3 Prev/Next 导航

- 位于文章底部，上边距 48px，`border-top: 0.5px solid var(--line)`，上内边距 24px
- 两列等宽网格，上一篇在左，下一篇在右对齐；缺一侧时用空 `<div>` 占位
- 标签 (`Previous` / `Next`) 12/20 `--text-2`，标题 14/20/500 `--text`
- Hover 时标题变为 `--accent-text`

---

## 16. Memos 列表 UI

纵向列表，没有时间线竖线、圆点或卡片：

```
2026-04-26 08:04
不要再碰触制造的东西了
─────────────────────────────
2026-04-18 11:12
好的产品功能入口是唯一的…
#tag1 #tag2
─────────────────────────────
```

- `.memo-item`：纵向 flex，子元素间距 8px，上下 20px，条目之间 0.5px `--line` 分隔
- `.memo-time`：等宽 12px `--text-2`，本身就是固定链接 (`/memo#memos-123`)，hover 变 `--accent-text`
- `.memo-body`：14/24；内部 blockquote、pre、code 复用语义令牌，规则同文章 prose 的简化版
- `.memo-tags`：12px `--text-2` 纯文字 `#tag`，不加背景
- `.memo-images`：`auto-fill, minmax(200px, 1fr)` 网格，间距 8px；点击图片打开 lightbox

**Lightbox**：全屏 `--black-a11` 遮罩，无模糊、无阴影，透明度以 `--ease-base` 过渡；图片最大 90vw × 90vh，`--radius-control`；点击遮罩或 `Esc` 关闭

**加载占位**：4 条静态 `--bg-element` 条块（日期条 + 正文条），不做 shimmer

**Load more 按钮**：高 36px，14px/500，`--bg-panel` 底，0.5px `--line-control` 边框，`--radius-control`，hover 为 `--bg-element`；加载中文字变 "Loading"

---

## 17. RSS Feed

**路径**: `/atom.xml`

**格式**: Atom 1.0

```xml
<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>{url}/atom.xml</id>
  <title>{title}</title>
  <link href="{url}" />
  <link rel="self" href="{url}/atom.xml" />
  <updated>{newest post date}</updated>
  <author><name>{author}</name></author>
  <entry>
    <id>{url}/{slug}</id>
    <title>{title}</title>
    <link href="{url}/{slug}" />
    <updated>{date}</updated>
    <published>{date}</published>
    <author><name>{author}</name></author>
    <content type="html">{first 2000 chars of raw markdown, XML-escaped}</content>
  </entry>
  <!-- ... -->
</feed>
```

---

## 18. 设计原则

视觉与交互改动必须满足以下约束：

1. **不用 `·` 当分隔符** — 并列信息用间距分开
2. **不写冗余说明文字** — 界面元素能自解释就不加注释性文案
3. **文案面向读者** — 用通用词汇，不造词；UI 文案用英文
4. **颜色只来自 Radix Colors，并按其步骤语义使用**（见 §12.1）
5. **光学对齐 + 同心圆角** — 用负 margin 让图标/文字而非点击区域对齐；嵌套圆角 = 外层 − 间距
6. **边框统一 0.5px**
7. **动效最少** — 只做颜色/透明度过渡，统一 `250ms ease-out`；面板、抽屉开合不做动画
8. **字号最多 4 档，最小 12px**（见 §13.2）
9. **少让用户做决定** — 不提供列表/网格切换之类的偏好开关，信息按优先级排好
10. **少用圆角和阴影** — 不用阴影；卡片、引用、提示块**禁止彩色左边框**

延续的工程原则：

- **性能第一** — 纯静态、自托管字体、按需加载 Memos、CDN 部署
- **可配置** — 单文件 `site.config.ts` 集中管理所有可变项
- **无跟踪** — 不接入任何分析/追踪服务
- **中文内容优化** — 阅读时间按中文计算、正文适配中文排版 (`text-autospace`、两端对齐)

---

## 19. 部署

### 19.1 构建流程

```bash
pnpm install                # 安装依赖
pnpm build                  # Astro SSG → dist/
```

构建产物：纯静态 HTML + CSS + JS 文件，输出到 `dist/` 目录。

### 19.2 部署到 Cloudflare Pages

```bash
pnpm deploy                 # = astro build && wrangler pages deploy dist
```

### 19.3 本地开发

```bash
pnpm dev                    # 启动开发服务器 (默认 http://localhost:4321)
pnpm preview                # 预览构建产物
node --test tests/*.mjs     # 运行单测
```
