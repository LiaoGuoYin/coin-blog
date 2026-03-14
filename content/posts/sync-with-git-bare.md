---
title: 用 Git 裸仓库在多台内网机器中同步代码
date: '2025-10-10T16:00:00+00:00'
published: true
feature: ''
---
由于一些特殊的环境限制，个人需要在多台内网主机之间同步代码仓库。

从表面上看，这似乎只是一个“文件同步”问题。我最初的方案也很直观：通过 Rsync, Syncthing 等应用软件同步代码文件夹和 .git 文件夹，这样既能同步代码数据，又能保留提交历史。

不过细想，这种做法经不起推敲。在弱网、断网或延迟同步的场景下，这种**文件层级的同步**几乎注定会破坏 .git 数据库。

举个简单的例子：如果 A、B 两台主机各自提交了新的代码（即形成了“硬分叉”），那么在它们重新联网、自动触发同步时，双向的文件更新会直接覆盖 .git 内部的索引与对象文件。结果不仅是当前分支元数据混乱，更严重的是整个历史记录可能被污染，甚至两台机器的仓库都可能损坏。而且这还只是两台主机的情况——随着同步节点数量增加，这种“分布式文件同步”方式只会让 .git 乱成一锅粥。

## 0. 问题分析

要避免上面的问题，必须重新审视两个核心点：

*   同步方向：原方案是“双向同步”，双方在网络恢复后会同时互相写入，无法保证优先级，从而破坏仓库一致性。
    
*   同步操作原子性：文件同步程序控制同步触发时机的不可靠，弱网或中断时可能发生“同步一半”的非原子状态。
    

经过一番调研后，发现 **Git 裸仓库（bare repository）同步** 能完美解决这两个问题：

*   **单向同步机制**：  
    Git 的 push/pull 天然是单向的。任何节点都可以主动推送或拉取，仓库的版本流向始终可控。
    
*   **原子性与一致性保证**：  
    Git 在传输时只处理对象级别的差异，并且会有文件粒度的哈希校验，push/pull 操作要么全部成功，要么全部失败，不会出现“同步到一半”的状态。
    
*   **离线友好**：  
    各主机在离线时可独立提交，网络恢复后通过 `git push` / `git pull` 合并更新，过程完全受版本控制系统管理。
    

因此，最后确定 **Git 裸仓库作为中转节点** 的方案做数据仓库同步，以下是一些相关的理论和实操记录，存档防忘。

## 1. 什么是「裸仓库」？

在普通 Git 仓库中，结构大致如下：

```markup

myrepo/
├── .git/ ← Git 数据库
└── src/ ← 工作区（实际文件）

```

而裸仓库（bare repository）去掉了工作区，只保留 .git 目录的内容结构：

```markup

myrepo.git/
├── HEAD
├── config
├── objects/
└── refs/

```

它只保存版本历史，不保存任何可编辑文件。也就是说，**不能直接编辑代码，只能被 push / pull。** 这也是 GitHub、GitLab 等远程托管服务背后的核心模型。

## 2. 为什么要用裸仓库？（典型应用场景）

*   在两台机器之间同步开发代码
    
*   自建局域网版「私有 GitHub」
    
*   自动镜像同步到 GitLab / Gitee / 备份服务器
    
*   国内服务器不方便拉 GitHub 代码的中转方案
    
*   建立 CI/CD 触发源（`post-receive` 钩子）
    

## 3. 动手实践：两台机器间同步

假设：

*   开发机：`A`
    
*   同步服务器：`B`
    

### 3.1 在 B 上创建裸仓库

```bash
mkdir -p /git-server/repo.git
cd /git-server/repo.git
git init --bare

```

执行后目录结构如下：

```markup
repo.git/
├── HEAD
├── objects/
├── refs/
└── config

```

### 3.2 在 A 上添加远程并推送

```bash
cd ~/workspace/myproject
git remote add b ssh://user@B_IP:/git-server/repo.git
git push b main

```

此时，B 的 `/git-server/repo.git` 完整保存了 A 推送的文件更新。

你可以在任意机器 `git clone ssh://user@B_IP:/git-server/repo.git` 拉取最新版本。

## 4. 在服务器也能看到最新源码

如果你希望在服务器 B 上也能直接查看代码，可基于裸仓库克隆一份工作区：

```bash
git clone /git-server/repo.git /git-server/repo-work
cd /git-server/repo-work
git checkout main

```

更新方式：

```bash
cd /git-server/repo-work
git pull

```

## 5. 让服务器自动推送到 GitLab（镜像）

如果你希望这台裸仓库还能同步更新到 GitLab，可以用 `post-receive` 钩子。

```bash
cd /git-server/repo.git
git remote add --mirror=push gitlab git@gitlab.com:<group>/<project>.git

```

然后创建钩子脚本：

```bash
cat > hooks/post-receive <<'SH'
#!/bin/sh
set -e
export HOME=/home/git   # ← 替换为实际用户的 HOME 路径
export PATH=/usr/bin:/bin
git push --mirror gitlab
SH

chmod +x hooks/post-receive

```

每次有 push 到这台服务器时，它都会自动把变更推到 GitLab。相当于基于 SSH 协议，自建了一个「私有中转层」。

## 6. 命令速查表

| 操作 | 命令 |
| --- | --- |
| 创建裸仓库 | `git init --bare` |
| 添加远程 | `git remote add b ssh://user@host:/path/repo.git` |
| 推送代码 | `git push b main` |
| 自动同步 GitLab | `hooks/post-receive` 中添加 `git push --mirror gitlab` |
| 同步工作区 | `git clone` / `git pull` |

总的来说，裸仓库是没有工作区的纯 Git 仓库。换一个角度来看，我们平时推来推去的 GitHub、GitLab，背后其实就是一堆「.git 文件夹」 而已。

一想到当年 Linus 为了维护 Linux 内核，顺手写了这个 Git 就觉得牛逼到不行。

Elegant，实在是 Elegant。
