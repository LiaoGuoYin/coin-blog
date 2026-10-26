---
title: AWS CloudFront CDN 配置教程
date: '2023-11-18T03:47:48+00:00'
published: false
feature: ''
---

记录一次从 Cloudflare 转向 AWS CloudFront 的 CDN 配置实践，顺便把 CDN、DNS、CloudFront 几个概念串一下。

<!-- more -->

Cloudflare 的 CDN 算是被玩坏了，于是把视野转向 AWS CloudFront。

之前只是听过 CDN 是用来给网站加速的，配置也一直稀里糊涂，不太知其所以然。

网上很多教程都是东一句西一句，原理和配置大多只讲其中一个。花了一下午把这个问题捋清楚之后，还是想整理出来，给看到这里的朋友一点参考。



## CDN 原理和示意图

1. 不使用 IP，使用域名解析跳转
2. CDN 边缘节点优先返回缓存，缓存不存在时再回源

## DNS 解析原理

1. 用户访问 `chatpot.org`，浏览器先进行 DNS 域名解析
2. DNS 中配置 CNAME 记录，将 `chatpot.org` 解析到 CloudFront 临时域名 `dri8e2lmin5lj.cloudfront.net`
3. CloudFront 优先使用边缘节点缓存响应；如果缓存不存在，再回源访问源站，并把结果缓存下来供下次使用



## CDN 云服务配置流程

1. A 记录解析 origin 域名到服务器或者源站 IP，例如 `original.chatpot.org` A 记录到 Vercel 的 `76.76.21.21`
2. CloudFront 配置
   1. TLS 申请（DNS 验证）
   2. 得到 CDN 临时域名：`dri8e2lmin5lj.cloudfront.net`
   3. 配置 WAF
3. CNAME 记录解析 CDN 域名到 CloudFront 临时域名



### CDN 加速前后访问延迟对比



### 可能存在的问题

CDN 是利用缓存优化访问速度。缓存带来好处的同时，也可能带来一些局部问题：

1. 缓存更新可能不及时。我遇到过局部地区 JS 缓存丢失的问题，解决方案是重新部署，并设定好回源策略和缓存刷新策略。
2. WAF 可以防刷流量，但规则太激进时也可能误伤。



## ref

- [CDN优选节点监测服务-美国VPS综合讨论-全球主机交流论坛 - Powered by Discuz! (hostloc.com)](https://hostloc.com/thread-1205395-1-1.html)
- [CloudFlare 监测平台API文档 (gacjie.cn)](https://monitor.gacjie.cn/page/api/index.html)
- 有关删除 CDN 原理：[Deleting a distribution - Amazon CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/HowToDeleteDistribution.html)
- CDN 403 错误（HTTPS 问题）：[解决 CloudFront 错误请求问题 | AWS re:Post](https://repost.aws/zh-Hans/knowledge-center/resolve-cloudfront-bad-request-error)
- [使用 AWS 的 CloudFront CDN 给你的网站加速 | Bruce's Blog](https://www.xiebruce.top/1808.html)
- [主流CDN自选IP | tanglu's blog](https://blog.tanglu.me/select-ip-for-CDN/#国内CDN自选IP)
- [手把手配置Amazon CloudFront 实现全站加速 | 亚马逊AWS官方博客](https://aws.amazon.com/cn/blogs/china/configure-amazon-cloudfront-to-accelerate-the-whole-site/)
