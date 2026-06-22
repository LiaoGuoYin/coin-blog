---
title: 半自动化获取网站 Cookie 的方法
date: '2020-08-15T00:30:00+00:00'
published: true
feature: ''
---


通过 Nginx 配置和 SSL 证书，实现半自动化获取网站 Cookie 的方法。

<!-- more -->

## 配置说明

当需要获取网站的 Cookie 时，特别是一些要求 Secure 标记的 Cookie，可以通过 Nginx 反向代理来实现。

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



## nginx

Docroot is: /opt/homebrew/var/www

The default port has been set in /opt/homebrew/etc/nginx/nginx.conf to 8080 so that
nginx can run without sudo.

nginx will load all files in /opt/homebrew/etc/nginx/servers/.

To start nginx now and restart at login:
  brew services start nginx
Or, if you don't want/need a background service you can just run:
  /opt/homebrew/opt/nginx/bin/nginx -g daemon\ off\;
