---
title: 记 Docker 容器内外文件夹权限一致性问题的坑
date: '2024-11-09T08:47:02+00:00'
published: true
feature: ''
---

最近频繁使用 docker-compose，发现在容器迁移、备份和使用方面非常便利。

容器的启停只需要 `docker-compose up` 和 `docker-compose down`，大大降低了心智负担。

但是在一次使用 `docker-compose up` 启动（创建）以下容器时，遇到了创建文件 ./data/config.json 失败的问题。

```
# https://hub.docker.com/r/shellngn/pro/
services:
  shellngn:
    image: shellngn/pro:latest
    container_name: shellngn
    ports:
      - "8080:8080"
    volumes:
      - ./data:/home/node/server/data
    environment:
      - HOST=0.0.0.0
      - TZ=Asia/Shanghai
    restart: unless-stopped
```

通过 `docker logs shellngn` 查看日志，发现是挂载本地目录 ./data 到容器后，容器在创建文件时报错：

```
shellngn is up-to-date
Attaching to shellngn
shellngn    | node:internal/fs/utils:356
shellngn    |     throw err;
shellngn    |     ^
shellngn    | 
shellngn    | Error: EACCES: permission denied, open './data/config.json'
shellngn    |     at Object.openSync (node:fs:596:3)
shellngn    |     at Object.writeFileSync (node:fs:2322:35)
shellngn    |     at _0xb7420b.<computed>.<computed> [as init] (/home/node/server/bundle.js:1:1213484)
shellngn    |     at 40392 (/home/node/server/bundle.js:1:1069259)
shellngn    |     at _0x2d71f3 (/home/node/server/bundle.js:1:9475095)
shellngn    |     at /home/node/server/bundle.js:1:9475859
shellngn    |     at /home/node/server/bundle.js:1:9483783
shellngn    |     at Object.<anonymous> (/home/node/server/bundle.js:1:9483984)
shellngn    |     at Module._compile (node:internal/modules/cjs/loader:1364:14)
shellngn    |     at Module._extensions..js (node:internal/modules/cjs/loader:1422:10) {
shellngn    |   errno: -13,
shellngn    |   syscall: 'open',
shellngn    |   code: 'EACCES',
shellngn    |   path: './data/config.json'
shellngn    | }
shellngn    | Node.js v18.20.1

```

查阅资料后发现，这个问题通常是 **Docker 容器内外的操作用户权限不匹配** 导致的：

- 当使用 `docker-compose up` 创建文件夹时，这些文件夹通常是由容器内部的进程创建的。容器内部的进程可能以 root 用户或其他特定用户身份运行，而这个用户的 UID（用户 ID）可能与宿主机系统上的用户权限不匹配，这就导致了权限错误
- 相比之下，如果使用 Docker Volume 就不会有文件权限的问题。因为 Docker 守护进程创建文件夹时，它通常能够正确处理权限问题

## 解决方法

解决方法其实非常简单：限制、同步权限

### 方法一：使用 user 指令

在 docker-compose.yml 文件中，指定容器以哪个用户/用户组运行：**user: "${UID}:${GID}"**

```
...省略...
version: '3'
services:
  your_service:
    image: your_image
    user: "${UID}:${GID}"
    volumes:
      - ./data:/app/data
...省略...
```

### 方法二：使用 Docker Volumes

使用 Docker Volumes 让 Docker 服务自动完成权限管理（但 volumes 迁移不是很方便，用起来不如文件夹挂载灵活）

```
...省略...
version: '3'
services:
  your_service:
    image: your_image
    volumes:
      - myvolume:/app/data
volumes:
  myvolume
...省略...
```

## 排查问题

问题解决后，很疑惑 **Docker 容器内外的操作用户权限不匹配** 背后到底是什么不匹配。问题出现后，进行了如下排查：

- 查看文件夹用户组和权限，发现容器新建出来的文件所属用户及用户组是 1000:1000
- 为了查看容器的操作用户，查看了容器镜像配置 `docker inspect shellngn`

  发现 ID 1000 用户在容器内对应着 node 用户

  ![image-20241010010359365](https://cdn.liaoguoyin.com/images/docker-file-permission-consistency-issues_1.png)
- 在宿主机和容器中命令行中输入 id 查看默认用户，发现 ID 默认运行用户都是 0 号用户（root 用户）

  - 宿主机中 /etc/passwd 文件里没有 1000 用户

    ![image-20241010010707953](https://cdn.liaoguoyin.com/images/docker-file-permission-consistency-issues_2.png)
  - 容器中 /etc/passwd 中有 1000 用户，且就是上文的 node 用户

    ![image-20241010010218935](https://cdn.liaoguoyin.com/images/docker-file-permission-consistency-issues_3.png)
  - 尝试在宿主机新建 ID 为 1000 的用户：`useradd -u 1000 coincoin`
  - 再执行没有传入 user 的 docker-compose.yaml 新建成功，且所属文件是宿主机 ID 1000 的用户（刚创建的用户 coincoin）

    ![image-20241010010556788](https://cdn.liaoguoyin.com/images/docker-file-permission-consistency-issues_4.png)

    **在容器中：文件夹的权限在容器内外所属于的用户/用户组可能不一致，文件其实属于各自域内的对应 ID 的用户，认 ID 而不认用户名。上文最开始遇到的问题中，这些文件属于 ID 1000 的用户，但在宿主机中不存在这个 ID 的用户，因此报错。**
- 此外，通过 `docker history shellngn` 查看镜像层发现：容器镜像默认用户在创建文件夹之前就被切换为了 node（USER node）

  `<missing>      2 months ago    /bin/sh -c #(nop)  USER node                    0B`

  ![image-20241204000404832](https://cdn.liaoguoyin.com/images/docker-file-permission-consistency-issues_5.png)

  至此真相大白，容器在创建文件夹时创建的用户在映射到外部时无法根据内部的用户 ID 找到对应的用户，导致文件操作没有权限。

在容器中，这种切换操作用户是一种安全手段，通过切换到非特权用户来运行应用程序，减少潜在的安全风险。Node.js 官方镜像就经常使用这个做法。但这可能会导致上文这样的潜在权限问题。

## 总结

总的来说，**Docker 容器内外的操作用户权限不匹配** 是指在运行容器时，内外操作的用户不一致，导致的文件夹权限归属无法确认。因此：

- 尽量保持容器内外用户 ID 的一致性。在 docker-compose.yml 文件中，可以指定容器以哪个用户/用户组运行：**user: "${UID}:${GID}"**
- 在使用挂载目录时要考虑权限映射问题
- 可以根据具体需求选择使用 user 指令或 Docker Volumes

## 参考资料

- [Docker Dockerfile USER 指令官方文档](https://docs.docker.com/reference/dockerfile/#user)
- ChatGPT
