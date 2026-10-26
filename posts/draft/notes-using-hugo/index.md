---
title: 使用 Hugo 记笔记
date: '2023-06-26T14:05:41+00:00'
published: false
feature: ''
---

## 主题引用

Hugo 主题引用会涉及到 Git Submodules 工作流，后面如果要换主题或固定主题版本，最好先把这块摸清楚：

- [Git submodule | Atlassian](https://www.atlassian.com/git/tutorials/git-submodule)
- [How effectively delete a git submodule. · GitHub](https://gist.github.com/myusuf3/7f645819ded92bda6677)

## 图片路径自定义

为了自定义图片引用路径，需要使用 Hugo Markdown Render Hook 修改图片路径。核心部分如下：

```
在主题中新建 `layouts/_default/_markup/render-image.html` 文件，并写入如下内容：

{{- $img_destination := .Destination }}
{{ if (and .Page.Site.Params.CDN.enable (not .Page.Site.IsServer)) }}
    {{ $img_destination = (print .Page.Site.Params.CDN.HOST (path.Join .Page.RelPermalink .Destination)) }}
{{ end }}

<img class="mx-auto" alt="{{ $.Text }}" src="{{ $img_destination | safeURL }}" />

在配置文件 `config.toml` 中新建一项：
[params.CDN]
enable = true
# Host 必须不以 `/` 结尾
Host = "https://wrong-wang-1251968348.file.myqcloud.com"
```

参考：

- [本站引用图片的“顺滑”流程 - wrong.wang](https://wrong.wang/blog/20190301-%E6%9C%AC%E7%AB%99%E5%BC%95%E7%94%A8%E5%9B%BE%E7%89%87%E7%9A%84%E9%A1%BA%E6%BB%91%E6%B5%81%E7%A8%8B/)
- [GitHub - zoni/obsidian-export: Rust library and CLI to export an Obsidian vault to regular Markdown](https://github.com/zoni/obsidian-export#relative-links-with-hugo)
- [Images in markdown relative to content · Issue #1240 · gohugoio/hugo · GitHub](https://github.com/gohugoio/hugo/issues/1240)
- [Images in Typora - Typora Support](https://support.typora.io/Images/#when-insert-images)

最终可用的版本如下：

```
{{ $postImagePath := path.Join .Page.RelPermalink ".." .Destination }}

{{ if (and .Page.Site.Params.CDN.enable (not .Page.Site.IsServer)) }}
    {{ $postImagePath = path.Join .Page.Site.Params.CDN.HOST $postImagePath }}
{{ end }}

<img
  loading="lazy"
  src="{{ $postImagePath }}"
  alt="{{ .Text }}"
  {{ with .Title }}
    title="{{ . }}"
  {{end}}
/>

```

## 本地调试

**本机预览：**
```bash
hugo server -D
```

**局域网预览：**
```bash
hugo server -D --bind 0.0.0.0 --baseURL http://192.168.0.35:1313
```

更多预览参数详见：
```bash
hugo server -h
```

## 部署

**Hugo 部署到 Cloudflare Pages：**

参考文档：[Deploy a Hugo site · Cloudflare Pages docs](https://developers.cloudflare.com/pages/framework-guides/deploy-a-hugo-site/)

> 注意：Hugo 版本一定要加到环境变量中，否则可能出现首页 404。

**结合 Rclone 自动部署：**

结合 Rclone 可以自动同步文件，比如图片，到其他存储目录。参考：[Deployment with Rclone | Hugo](https://gohugo.io/hosting-and-deployment/deployment-with-rclone/)

推荐配置完 `rclone config` 后：

1. **站点精简化**（参考：[Hugo 命令文档](https://gohugo.io/commands/hugo/)）：
   ```bash
   hugo --gc --minify
   ```

   参数说明：
   - `--gc`：启用清理任务，删除构建后的未使用缓存文件
   - `--minify`：压缩所有支持的输出格式（HTML、XML 等）

2. **Rclone 文件同步：**
   ```bash
   rclone sync --interactive public/ hugo-www:www/
   ```

## R2 / S3 GitHub Action 同步

**相关资源：**
- [市场现有 Action](https://github.com/marketplace?type=actions&query=cloudflare++r2+)
- [自己动手做一个 GitHub Action](https://docs.github.com/en/actions/creating-actions/creating-a-composite-action)
- [Run in CI/CD · Cloudflare Workers docs](https://developers.cloudflare.com/workers/wrangler/ci-cd/)


## 参考资料

- [Golang 模版语法](https://pkg.go.dev/text/template)
- [Hugo 模版](https://gohugo.io/templates/)
- [Hugo 可用变量](https://gohugo.io/variables/site/)
- [Markdown Render Hooks](https://gohugo.io/templates/render-hooks/#prose)
- [Page Resources](https://gohugo.io/content-management/page-resources/)
