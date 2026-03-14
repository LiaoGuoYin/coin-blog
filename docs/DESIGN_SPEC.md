# Coin's Blog — Design Specification

> 本文档是面向 AI 的项目设计规范，目标是让 AI 能够仅凭此文档从零复现整个项目。

---

## 1. 项目概述

一个极简风格的个人博客，基于 Astro 静态站点生成器构建。核心特性：

- **纯静态输出** — 构建产物为纯 HTML/CSS/JS，无服务器运行时
- **Markdown 驱动** — 博客文章以 `.md` 文件存储在 `content/posts/` 目录
- **Memos 集成** — 通过外部 Memos API 拉取短笔记/动态，客户端渲染
- **双主题** — 支持 light/dark 模式，系统偏好感知 + 手动切换
- **响应式布局** — 桌面端侧边栏 + 主内容区；移动端折叠头部 + 全宽内容
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
├── content/
│   └── posts/                   # Markdown 博客文章 (每篇一个 .md 文件)
├── public/
│   ├── avatar.png               # 站点头像 (也用作 favicon)
│   ├── favicon.png
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── ActivityGraph.astro  # GitHub 风格活跃度贡献图
│   │   ├── HomePage.astro       # 首页主体 (文章列表 + Memos 标签页)
│   │   ├── MobileHeader.astro   # 移动端头部导航栏
│   │   ├── PostListDivided.astro    # 文章列表样式 A: 标题左 + 日期右
│   │   ├── PostListTwoLine.astro    # 文章列表样式 B: 双行 (标题 + 日期·阅读时间)
│   │   ├── PostListPreview.astro    # 文章列表样式 C: 带摘要预览
│   │   ├── Sidebar.astro        # 桌面端左侧边栏
│   │   └── ThemeToggle.astro    # 深色/浅色模式切换按钮
│   ├── layouts/
│   │   └── Layout.astro         # 全局 HTML 布局 (head + body 骨架)
│   ├── lib/
│   │   ├── activity.ts          # 活跃度图数据生成逻辑
│   │   ├── config.ts            # 仅 re-export siteConfig
│   │   ├── markdown.ts          # Markdown → HTML 渲染 (Shiki 高亮 + 锚点)
│   │   └── posts.ts             # 文章读取、排序、阅读时间估算
│   ├── pages/
│   │   ├── index.astro          # / 路由 → 渲染 HomePage
│   │   ├── post.astro           # /post 路由 → 渲染 HomePage
│   │   ├── memo.astro           # /memo 路由 → 渲染 HomePage
│   │   ├── [slug].astro         # /:slug 动态路由 → 文章详情页
│   │   └── atom.xml.ts          # /atom.xml → Atom RSS feed
│   └── styles/
│       └── global.css           # 全局样式、颜色令牌、排版规则
├── astro.config.mjs             # Astro 配置
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
  url: "https://coin-blog.pages.dev",   // 用于 RSS feed 等绝对 URL
  lang: "zh-CN",
  avatar: "/avatar.png",                // public/ 目录下的头像

  // 导航链接
  navLinks: [
    { href: "/post", label: "Post" },
    { href: "/memo", label: "Memo" },
    { href: "/atom.xml", label: "RSS", external: true },
  ],

  // UI 文案 (中文)
  ui: {
    tocLabel: "本文导览",
    prevPost: "← 上一篇",
    nextPost: "下一篇 →",
    backToTop: "返回顶部",
    readingTime: (min: number) => `约 ${min} 分钟`,
    copyButton: "复制",
    copiedButton: "已复制",
    noPosts: "No posts yet.",
    noMemos: "No memos yet.",
    postsHeading: "Posts",
    allPostsHeading: "All Posts",
    memosHeading: "Memos",
  },

  // 文章列表展示风格: "divided" | "twoLine" | "preview"
  postListStyle: "twoLine" as "divided" | "twoLine" | "preview",

  // Memos API 地址
  memosApiUrl: "https://memo.nas.hz.moyumomokan.cn",
};
```

`src/lib/config.ts` 仅做 re-export：`export { siteConfig } from '../../site.config';`

---

## 5. 构建配置

### 5.1 Astro 配置 (`astro.config.mjs`)

极简配置，仅注册 Tailwind CSS v4 的 Vite 插件：

```javascript
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
});
```

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

**存储位置**：`content/posts/*.md`

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
  slug: string;   // 取自文件名（去掉 .md），或 frontmatter 中的 slug 字段
}

interface Post extends PostMeta {
  content: string; // 原始 Markdown 文本
  type: 'post';
}
```

**读取逻辑** (`src/lib/posts.ts`)：

1. 读取 `content/posts/` 下所有 `.md` 文件
2. 用 `gray-matter` 解析 frontmatter
3. 过滤 `published !== true` 的文章
4. 按 `date` 降序排列（最新在前）
5. slug 取自 `frontmatter.slug`，若无则取文件名去掉 `.md`

### 6.2 Memo (来自外部 API)

**数据源**：外部 Memos API (`siteConfig.memosApiUrl`)

**API 调用**：`GET {memosApiUrl}/api/v1/memos?pageSize=50&pageToken={token}`

**TypeScript 接口**：

```typescript
interface Memo {
  name: string;
  content: string;       // Markdown 格式
  displayTime: string;   // ISO 8601
  tags: string[];
  pinned: boolean;
  snippet: string;
}
```

**排序规则**：Pinned 优先 → 按 `displayTime` 降序

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

1. **Header**: ← Posts 返回链接 + 标题 + 日期·阅读时间
2. **Body**: 左侧为文章正文 (`prose` 排版)，右侧为 TOC (目录导航，`>1100px` 才显示)
3. **Prev/Next 导航**: 底部上下篇链接
4. **回到顶部按钮**: 固定定位，滚动超过 400px 后显示

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
│   · meta charset, viewport, description      │
│   · title                                    │
│   · favicon (avatar.png)                     │
│   · RSS link                                 │
│   · Dark mode 初始化脚本 (内联, 防闪烁)       │
│   · Google Fonts 预连接 + 加载               │
│ </head>                                      │
│ <body>                                       │
│   <div class="site-layout flex ...">         │
│     ┌──────────┬──────────────────────┐      │
│     │ Sidebar  │ <main>               │      │
│     │ (desktop │   <div> 白色卡片容器  │      │
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

**关键 CSS 变量**（在 `.site-layout` 上设置）：

```css
--link-color: var(--blue-11);
--primary-text-color: var(--bronze-12);
--secondary-text-color: var(--grass-11);
--site-background-color: var(--gold-2);
```

**响应式断点**：

- `lg` (1024px): Sidebar 显示，`flex-row` 布局
- 移动端: MobileHeader 显示，`flex-col` 布局

**主内容区**：

- `lg:overflow-y-scroll lg:max-h-screen` — 桌面端内容区独立滚动
- 白色卡片容器：`rounded-2xl`，带阴影 `box-shadow: 0 2px 12px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.1)`
- 暗色模式卡片背景覆盖为 `var(--sand-2)`

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

**仅桌面端显示** (`hidden lg:flex`)

结构 (从上到下)：

1. **Logo 区域**: 头像 (圆形 40x40) + 站点标题 + ThemeToggle
2. **导航链接**: 遍历 `siteConfig.navLinks`
   - 当前激活项：`shadow-border bg-white` + `color: var(--sand-12)`
   - 普通项：`hover:bg-sand-3` + `color: var(--sand-11)`
   - 激活判断：`/post` 路由匹配 `/` 或 `/post` 开头的路径
3. **Activity Graph**: 固定在底部 (`mt-auto`)

宽度：`lg:w-48 xl:w-56`

### 9.2 MobileHeader (`components/MobileHeader.astro`)

**仅移动端显示** (`lg:hidden`)

结构：

1. **顶栏**: Logo 头像 (32x32) + 站点标题 | ThemeToggle + 汉堡菜单按钮
2. **可折叠导航抽屉**: 初始 `hidden`，点击汉堡按钮切换

菜单按钮行为：

- 打开：汉堡图标 → X 图标，`aria-expanded="true"`
- 关闭：X 图标 → 汉堡图标，`aria-expanded="false"`

### 9.3 ThemeToggle (`components/ThemeToggle.astro`)

- Sun 图标 (暗色模式下显示) / Moon 图标 (亮色模式下显示)
- 通过 CSS `.dark .theme-icon-sun { display: block }` 控制图标显隐
- 点击时：读取当前主题 → 切换 → 更新 `<html>` class + `localStorage`

### 9.4 HomePage (`components/HomePage.astro`)

核心内容组件，被 `/`、`/post`、`/memo` 三个路由共用。

结构：

```
<Layout>
  <div class="p-5 sm:p-8 flex flex-col gap-4">
    <section id="tab-posts">     ← 文章列表
    <section id="tab-memos">     ← Memos 时间线
  </div>
</Layout>
```

**文章列表**根据 `siteConfig.postListStyle` 选择渲染组件：

- `"divided"` → `<PostListDivided />`
- `"twoLine"` → `<PostListTwoLine />` (当前默认)
- `"preview"` → `<PostListPreview />`

**Memos 标签页**包含三个状态：

1. `#memo-loading` — 骨架屏动画 (5 个 shimmer 条目)
2. `#memo-error` — 错误/空状态文案
3. `#memo-list` — 实际内容容器

#### 客户端 Memos 渲染逻辑

1. 初始化客户端 MarkdownIt 实例 (与构建时同配置: Shiki 双主题 + GitHub Alerts)
2. `fetchAllMemos()` — 分页获取所有 Memos，50 条/页
3. 并行执行 Markdown 渲染器初始化 + 数据获取 (`Promise.all`)
4. 渲染为时间线 HTML 注入 `#memo-list`

#### 客户端 Tab 切换逻辑

```javascript
// 1. 拦截导航链接点击 → e.preventDefault()
// 2. history.replaceState 更新 URL (/post 或 /memo)
// 3. 切换 .tab-hidden class
// 4. 更新导航链接样式 (active vs inactive)
// 5. 首次切到 Memos 时触发 loadMemos()
```

### 9.5 ActivityGraph (`components/ActivityGraph.astro`)

GitHub 风格的活跃度贡献图。

**侧边栏小图**：

- 展示最近 5 周 (35 天)
- 7 行 × 5 列网格，`grid-auto-flow: column`（周一在顶部）
- 颜色等级：
  - 无活动: `var(--sand-4)` (浅灰)
  - 有 Post 或 Memo: `var(--grass-7)` (浅绿)
  - 同时有 Post 和 Memo: `var(--grass-9)` (深绿)
- 未来日期: `visibility: hidden`
- 顶部月份标签行

**全屏模态框**：

- 点击展开按钮打开
- 展示最近 10 年，每年一行
- 每年从 1 月 1 日所在周的周一开始，到 12 月 31 日所在周的周日结束
- 底部图例: Less → 浅灰 → 浅绿 → 深绿 → More
- ESC 或点击遮罩层关闭

**数据流**：

1. 构建时：从文章列表提取发布日期 → 传入组件 (SSG)
2. 运行时：异步 fetch Memos API 获取 memo 日期 → 动态更新 cell 颜色/类型

**交互**：

- Hover: 显示 tooltip (`YYYY-MM-DD · Post/Memo/Post & Memo/No activity`)
- Click: 导航到对应文章 (`/slug`) 或 Memo 页面 (`/memo`)

### 9.6 PostList 三种样式

**PostListDivided**:

```
┌─────────────────────────────────────────┐
│ 文章标题                    2025-03-13  │
│─────────────────────────────────────────│
│ 文章标题                    2025-03-12  │
└─────────────────────────────────────────┘
```

标题左对齐，日期右对齐，底部细线分隔。

**PostListTwoLine** (默认):

```
┌─────────────────────────────────────────┐
│ 文章标题                                │
│ 2025-03-13 · 约 5 分钟                  │
│                                         │
│ 文章标题                                │
│ 2025-03-12 · 约 3 分钟                  │
└─────────────────────────────────────────┘
```

标题一行 + 日期·阅读时间一行，带 `border-bottom` 分隔。

**PostListPreview**:

```
┌─────────────────────────────────────────┐
│ 文章标题                    2025-03-13  │
│ 正文前80字摘要预览文本...               │
│─────────────────────────────────────────│
│ 文章标题                    2025-03-12  │
│ 正文前80字摘要预览文本...               │
└─────────────────────────────────────────┘
```

摘要通过 `getExcerpt()` 函数生成：去除 Markdown 语法后取前 80 字符，超出加 `…`。

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

HomePage 中的 Memos 使用独立的客户端 MarkdownIt 实例，配置与构建时类似但有差异：

- `breaks: true` (构建时为 false)
- 无 `markdown-it-anchor` (Memo 不需要锚点)
- 无 `image_to_figure` (Memo 不需要 figure 标签)
- 同样有 Shiki 双主题 + GitHub Alerts + 未知语言 fallback

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
  const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWords = content.replace(/[\u4e00-\u9fff]/g, '').split(/\s+/).filter(Boolean).length;
  const minutes = chineseChars / 300 + englishWords / 200;
  return Math.max(1, Math.round(minutes));
}
```

中文按 300 字/分钟，英文按 200 词/分钟，混合计算，最少 1 分钟。

---

## 12. 颜色系统

### 12.1 设计语言

使用 **Radix UI 颜色系统**的 12 级色阶，5 个色族：

| 色族 | 用途 |
|------|------|
| **Sand** | 中性灰色，用于背景、边框、文字 |
| **Gold** | 暖色调背景 (`gold-2` 是页面底色) |
| **Blue** | 链接颜色 |
| **Bronze** | 主要文字和标题 |
| **Grass** | 强调色/成功色/活跃状态 |

### 12.2 CSS 变量声明

在 `global.css` 中：

- `:root, .light, .light-theme` — 亮色模式下的所有色阶
- `.dark, .dark-theme` — 暗色模式下的所有色阶

每个色族 12 级 (1-12)：1 最浅，12 最深 (暗色模式相反)。

### 12.3 Tailwind v4 集成

通过 `@theme inline` 块将 CSS 变量映射为 Tailwind 颜色工具类：

```css
@theme inline {
  --color-sand-1: var(--sand-1);
  --color-sand-2: var(--sand-2);
  /* ... 完整映射 5 色族 × 12 级 = 60 个颜色 */
  --shadow-border: 0 0 0 1px var(--sand-6);
}
```

暗色模式自定义变体：`@custom-variant dark (&:where(.dark, .dark *));`

---

## 13. 排版 & 字体

### 13.1 字体加载

通过 Google Fonts CDN 加载：

| 字体 | 用途 | 字重 |
|------|------|------|
| Poppins | 全站 UI 文字 (sans-serif) | 400, 500, 600 |
| Lora | 文章正文 (serif) | 400, 500, 600 (含 italic) |
| JetBrains Mono | 代码/日期 (monospace) | 400, 500 |

### 13.2 防布局偏移 Fallback

```css
@font-face {
  font-family: "Poppins Fallback";
  src: local("Arial");
  size-adjust: 110%;
  ascent-override: 105%;
  descent-override: 35%;
  line-gap-override: 10%;
}

@font-face {
  font-family: "Lora Fallback";
  src: local("Georgia");
  size-adjust: 97%;
  ascent-override: 100%;
  descent-override: 30%;
  line-gap-override: 0%;
}
```

### 13.3 Prose 排版规则

```css
.prose {
  font-family: "Lora", "Lora Fallback", Georgia, "Times New Roman", serif;
  font-size: 1.0625rem;    /* 17px */
  line-height: 1.85;
  font-weight: 500;
}
```

### 13.4 特殊排版规则

- **选区颜色**: `::selection { background-color: rgba(204, 120, 92, 0.25); }`
- **Inline code** (非 `<pre>` 内): 灰底 `sand-3`，小圆角，`sand-5` 边框，`0.875em` 字号，隐藏 Markdown 反引号 (`::before/::after { content: none }`)
- **Blockquote**: 灰底 `sand-2`，`bronze-8` 左边框 3px，圆角 0.375rem，斜体
- **外部链接**: 自动加箭头图标 (SVG 内联 `::after` 伪元素)，含图片的链接不显示
- **代码块** (Shiki): `sand-2` 背景，`sand-5` 边框，0.5rem 圆角；暗色模式使用 `--shiki-dark` 变量

---

## 14. 全局样式亮点

### 14.1 滚动条

```css
.scrollable-area {
  scrollbar-width: thin;
  scrollbar-color: var(--sand-6) transparent;
}
/* WebKit: 4px 宽，sand-6 圆角滑块 */
```

### 14.2 GitHub Alerts / Callouts

5 种类型，每种有独立配色：

| 类型 | 背景 | 边框 | 标题色 |
|------|------|------|--------|
| Note | blue-2 | blue-8 | blue-11 |
| Tip | grass-2 | grass-8 | grass-11 |
| Important | bronze-2 | bronze-8 | bronze-11 |
| Warning | gold-2 | gold-8 | gold-11 |
| Caution | #fef2f2 | #f87171 | #dc2626 |

### 14.3 Code Copy 按钮

- 绝对定位于代码块右上角
- 默认 `opacity: 0`，hover 时显示
- 点击后文字从 "复制" 变为 "已复制"，1.5 秒后恢复

### 14.4 Heading Anchor

- 绝对定位于标题左侧
- 默认 `opacity: 0`，hover 标题时显示 `#` 符号
- 点击时复制完整 URL 到剪贴板，显示 `✓`，1.5 秒后恢复

---

## 15. 文章详情页交互

### 15.1 TOC (目录导航)

- 仅在 `>1100px` 屏幕宽度时显示
- 宽度：`13rem`，`>1440px` 时 `16rem`
- `position: sticky; top: 1.5rem`
- 左侧 2px `sand-5` 竖线，当前项为 `bronze-12` 粗体

**Progress Bar**：

- 绝对定位覆盖在竖线上
- `bronze-9` 颜色
- 高度跟随页面滚动百分比 (`scrollTop / (scrollHeight - clientHeight) * 100`)

**Active 高亮**：

- 监听滚动事件 (passive)
- 向上遍历所有标题元素，找到最后一个 `rect.top <= 80` 的标题
- 到达页面底部 (距底 <=2px) 时激活最后一个标题
- 自动适配自定义滚动容器 (找到最近的 `overflow-y: auto/scroll` 祖先)

### 15.2 Back to Top

- 固定定位 `bottom: 2rem; right: 2rem`
- 滚动超过 400px 时 `opacity: 1`，否则 `opacity: 0; pointer-events: none`
- 点击时 `scrollTo({ top: 0, behavior: 'smooth' })`

### 15.3 Prev/Next 导航

- 位于文章底部，`border-top: 1px solid var(--sand-5)` 分隔
- Flex 布局，上一篇靠左，下一篇靠右 (`margin-left: auto; text-align: right`)
- 标签文字 (`← 上一篇` / `下一篇 →`) + 文章标题
- Hover 时标题变为 `grass-11` 色

---

## 16. Activity Graph 数据逻辑

### 16.1 网格生成 (`src/lib/activity.ts`)

```typescript
generateGrid(weeks: number): { cells: GridCell[], monthLabels: { text: string, col: number }[] }
```

1. 找到本周一 (Monday)
2. 向前推 `weeks - 1` 周，得到起始周一
3. 按列优先生成 cells (`grid-auto-flow: column`)：外循环 col (周)，内循环 row (周一到周日)
4. 月份标签：当 row=0 且月份变化时记录

### 16.2 日期工具函数

- `getPostDateSet(posts)` — 返回 `Set<string>` (YYYY-MM-DD)
- `getPostDateSlugMap(posts)` — 返回 `Record<string, string>` (date → first post slug)

### 16.3 Memo 日期获取

客户端异步 fetch Memos API，提取 `displayTime` 中的日期部分 (YYYY-MM-DD)。

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

## 18. Memos Timeline UI

垂直时间线样式：

```
│
├ ● ┌─────────────────────────┐
│   │ 2025-03-13 14:30        │
│   │ #tag1 #tag2             │
│   │ Memo 正文内容...         │
│   └─────────────────────────┘
│
├ ● ┌─────────────────────────┐
│   │ 2025-03-12 09:15        │
│   │ 另一条 Memo...           │
│   └─────────────────────────┘
│
```

- 竖线：`2px solid var(--sand-5)`，通过 `.timeline::before` 伪元素实现
- 圆点：`8px` 圆形，`sand-6`，hover 时变为 `bronze-9` 且放大 1.3x
- 卡片：`sand-2` 背景，`sand-4` 边框，`0.625rem` 圆角
- 日期：JetBrains Mono，`sand-9` 色
- 标签：`grass-11` 色文字 + `sand-3` 背景

**骨架屏加载动画**：

```css
background: linear-gradient(90deg, var(--sand-3) 25%, var(--sand-4) 50%, var(--sand-3) 75%);
background-size: 200% 100%;
animation: shimmer 1.5s infinite;
```

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
```

---

## 20. 设计原则

1. **极简至上** — 无多余装饰、无动画干扰、无 JS 框架运行时
2. **内容优先** — 排版精心调教 (Lora 衬线体 + 1.85 行高 + 17px 字号)
3. **性能第一** — 纯静态、字体防偏移、按需加载 Memos、CDN 部署
4. **可配置** — 单文件 `site.config.ts` 集中管理所有可变项
5. **无跟踪** — 不接入任何分析/追踪服务
6. **中文优化** — 阅读时间按中文计算、UI 文案中文化、适配中文排版
