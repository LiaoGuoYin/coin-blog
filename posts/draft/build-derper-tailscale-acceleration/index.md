---
title: 搭建 Derper 实现 Tailscale 网络加速
date: '2025-03-12T11:47:48+00:00'
published: false
feature: ''
---

## 基本原理

Tailscale 是一种基于 WireGuard 的网络组网解决方案，Derper（DERP Relay）是 Tailscale 的中继服务器，用于在无法直接连接的设备之间提供中继转发服务。

**优势：**
- 提升国内访问速度
- 降低网络延迟
- 提高连接稳定性



### 先决条件

- 备案域名
- 国内服务器

### 通过容器运行 Derper

```
# https://hub.docker.com/r/fredliang/derper
# https://github.com/fredliang44/derper-docker
version: '3'

services:
  derper:
    image: fredliang/derper
    environment:
      - DERP_DOMAIN=coin.ailzw.fun
      - DERP_VERIFY_CLIENTS=false
      - DERP_CERT_DIR=/app/ssl
    ports:
      - "80:80"
      - "443:443"
      - "3478:3478"
      - "3000:3000"
    volumes:
      - ./data:/app/ssl
    restart: always
```

3000 端口一定要打开，否则无法验证。



### 修改 ACL 控制台

https://login.tailscale.com/admin/acls/file



### 参数优化

[在 ACL 配置中，"randomizeClientPort": true 最好设置为 true](https://www.nodeseek.com/post-129538-1)

官方文档藏得比较深，经测试打开后打通率会有明显变化。原理在于如果不配置随机端口，Tailscale 默认使用 41641，一些复杂网络环境很容易在光猫或上游网络层面被拦住，导致打洞失败。



#### 防止 derper 被白嫖

白嫖步骤：



#### 使用大带宽服务器

- 小水管速度肯定跟不上，Derper 本质上还是中继，带宽太小会直接拖体验。



## Ref

- https://www.nodeseek.com/post-129538-1
- https://icloudnative.io/posts/custom-derp-servers/#%E9%98%B2%E6%AD%A2-derp-%E8%A2%AB%E7%99%BD%E5%AB%96
