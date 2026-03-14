# Coin's Blog

一个简洁、快速的个人博客。基于 Astro 构建，部署在 Cloudflare Pages。

[English](./Docs/README_EN.md) | [Design Spec](./Docs/DESIGN_SPEC.md)

## 快速开始

### 1. Fork 仓库

点击页面右上角的 **Fork** 按钮，将项目复制到你的 GitHub 账号下。

### 2. 克隆到本地

```bash
git clone https://github.com/<你的用户名>/coin-blog.git
cd coin-blog
```

### 3. 安装依赖

需要 Node.js >= 22 和 pnpm。

如果还没有 pnpm，先安装：

```bash
npm install -g pnpm
```

然后安装项目依赖：

```bash
pnpm install
```

### 4. 修改配置

打开根目录下的 `site.config.ts`，修改成你自己的信息：

```ts
export const siteConfig = {
  title: "你的博客名",
  description: "你的博客描述",
  author: "你的名字",
  url: "https://你的域名",
  avatar: "/avatar.png",       // 替换 public/avatar.png 为你的头像
  memosApiUrl: "https://...",  // 你的 Memos 地址，不用可以留空
};
```

### 5. 本地预览

```bash
pnpm dev
```

打开浏览器访问 <http://localhost:4321> 即可预览。

### 6. 写文章

在 `content/posts/` 目录下新建 `.md` 文件：

```markdown
---
title: 文章标题
date: '2025-01-01'
published: true
---

正文内容...
```

- `published: true` 必须设为 `true` 文章才会显示
- 文件名就是 URL 路径，比如 `hello-world.md` 对应 `/hello-world`

### 7. 部署到 Cloudflare Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，进入 **Pages**
2. 点击 **Create a project** → **Connect to Git**
3. 选择你 Fork 的仓库
4. 填写构建设置：
   - **Build command**: `pnpm build`
   - **Build output directory**: `dist`
   - **Environment variable**: `NODE_VERSION` = `22`
5. 点击 **Save and Deploy**

部署完成后会得到一个 `xxx.pages.dev` 的域名。如果你有自己的域名，可以在 Cloudflare Pages 设置中绑定。

### 8. 更新内容

之后每次写完文章，只需要：

```bash
git add .
git commit -m "新文章"
git push
```

Cloudflare Pages 会自动构建和部署。

## License

MIT
