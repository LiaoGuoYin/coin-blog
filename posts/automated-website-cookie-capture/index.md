---
title: 半自动化获取网站 Cookie 的方法
date: '2020-08-15T00:30:00+00:00'
published: true
feature: ''
---

记录一种用 Nginx 配置和 SSL 证书半自动获取网站 Cookie 的方法，主要用于自己调试登录态和本地脚本。

<!-- more -->

## 配置说明

有些网站的 Cookie 带 Secure 标记，普通 HTTP 页面拿不到。这时候可以通过本地 Nginx 反向代理加 SSL 的方式，把浏览器请求里的 Cookie 暂时打出来。

### Nginx 配置示例

```nginx
server {
    listen 443;  # 如果微博Cookie要求Secure，需改为443并配置SSL
    server_name coin.weibo.cn;

    ssl_certificate /opt/homebrew/etc/nginx/ssl/coin.weibo.cn.crt;      # 证书路径
    ssl_certificate_key /opt/homebrew/etc/nginx/ssl/coin.weibo.cn.key;  # 私钥路径

    location /get_cookie {
        add_header x-self-cookie $http_cookie;  # 捕获请求中的Cookie
        return 200 "Cookie captured successfully";
    }

    location / {
        root /Users/leocoin/html;  # 静态文件目录
        index index.html;    # 默认页面
    }
}
```



## Nginx

Docroot 是：`/opt/homebrew/var/www`

默认端口在 `/opt/homebrew/etc/nginx/nginx.conf` 里被设置成 8080，这样 Nginx 不需要 sudo 就能运行。

Nginx 会加载 `/opt/homebrew/etc/nginx/servers/` 目录下的所有配置文件。

立即启动 Nginx，并设置登录时自动启动：
  brew services start nginx
如果不需要后台服务，也可以直接运行：
  /opt/homebrew/opt/nginx/bin/nginx -g daemon\ off\;
