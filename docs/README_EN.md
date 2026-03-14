# Coin's Blog

A minimal, fast personal blog. Built with Astro, deployed on Cloudflare Pages.

[中文](../README.md)

## Quick Start

### 1. Fork the Repository

Click the **Fork** button in the top-right corner to copy the project to your GitHub account.

### 2. Clone Locally

```bash
git clone https://github.com/<your-username>/coin-blog.git
cd coin-blog
```

### 3. Install Dependencies

Requires Node.js >= 22 and pnpm.

If you don't have pnpm yet:

```bash
npm install -g pnpm
```

Then install the project dependencies:

```bash
pnpm install
```

### 4. Edit Configuration

Open `site.config.ts` in the root directory and update it with your information:

```ts
export const siteConfig = {
  title: "Your Blog Name",
  description: "Your blog description",
  author: "Your Name",
  url: "https://your-domain.com",
  avatar: "/avatar.png",       // Replace public/avatar.png with your avatar
  memosApiUrl: "https://...",  // Your Memos URL, leave empty if not used
};
```

### 5. Local Preview

```bash
pnpm dev
```

Open http://localhost:4321 in your browser.

### 6. Write Posts

Create a `.md` file in `content/posts/`:

```markdown
---
title: Post Title
date: '2025-01-01'
published: true
---

Your content here...
```

- `published: true` is required for the post to appear
- The filename becomes the URL path, e.g. `hello-world.md` → `/hello-world`

### 7. Deploy to Cloudflare Pages

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) and go to **Pages**
2. Click **Create a project** → **Connect to Git**
3. Select your forked repository
4. Enter the build settings:
   - **Build command**: `pnpm build`
   - **Build output directory**: `dist`
   - **Environment variable**: `NODE_VERSION` = `22`
5. Click **Save and Deploy**

You'll get a `xxx.pages.dev` URL. To use a custom domain, configure it in Cloudflare Pages settings.

### 8. Update Content

After writing a new post, just:

```bash
git add .
git commit -m "new post"
git push
```

Cloudflare Pages will automatically build and deploy.

## License

MIT
