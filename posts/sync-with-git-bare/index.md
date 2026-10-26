---
title: 用 Git 裸仓库在多台内网机器中同步代码
date: '2025-10-10T16:00:00+00:00'
published: true
feature: ''
---
因为一些特殊的环境限制，我需要在多台内网主机之间同步代码仓库。

一开始看，这好像只是一个「文件同步」问题。我最初的想法也很直观：用 Rsync、Syncthing 这类工具同步代码文件夹和 `.git` 文件夹。这样既同步了代码，也保留了提交历史。

但仔细想一下，这个方案经不起推敲。在弱网、断网或者延迟同步的场景下，这种**文件层级的同步**很容易把 `.git` 数据库搞坏。

举个简单的例子：A、B 两台主机离线期间各自提交了新代码，也就是形成了硬分叉。等它们重新联网、自动触发同步时，双向文件更新可能直接覆盖 `.git` 里的索引和对象文件。轻一点是当前分支元数据乱掉，严重一点是历史记录被污染，甚至两台机器的仓库一起损坏。两台机器都已经够麻烦了，节点再多一点，`.git` 很快就会乱成一锅粥。

## 0. 问题分析

要避开这个坑，先看两个核心点：

*   同步方向：原方案是「双向同步」，双方在网络恢复后会互相写入，优先级不可控，仓库一致性也就没法保证。
    
*   同步操作原子性：文件同步程序很难保证触发时机可靠。弱网或中断时，可能出现「同步到一半」这种最要命的状态。
    

调研之后，发现 **Git 裸仓库（bare repository）同步** 正好能解决这两个问题：

*   **单向同步机制**：  
    Git 的 push/pull 天然是单向的。任何节点都可以主动推送或拉取，版本流向始终可控。
    
*   **原子性与一致性保证**：  
    Git 传输时处理的是对象级别的差异，并且有哈希校验。push/pull 要么全部成功，要么全部失败，不会留下「同步到一半」的状态。
    
*   **离线友好**：  
    各主机在离线时可独立提交，网络恢复后通过 `git push` / `git pull` 合并更新，过程完全受版本控制系统管理。
    

所以最后确定用 **Git 裸仓库作为中转节点** 来做代码仓库同步。下面是一些理论和实操记录，存档防忘。

## 1. 什么是「裸仓库」？

普通 Git 仓库的结构大概是这样：

```markup

myrepo/
├── .git/ ← Git 数据库
└── src/ ← 工作区（实际文件）

```

裸仓库（bare repository）去掉了工作区，只保留 `.git` 目录里的内容：

```markup

myrepo.git/
├── HEAD
├── config
├── objects/
└── refs/

```

它只保存版本历史，不保存可以直接编辑的源码。也就是说，**裸仓库不能直接改代码，只能被 push / pull。** GitHub、GitLab 这类远程托管服务背后用的也是这个模型。

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

如果希望在服务器 B 上也能直接查看代码，可以基于裸仓库再克隆一份工作区：

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

如果希望这台裸仓库顺手同步到 GitLab，可以用 `post-receive` 钩子。

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

之后每次有人 push 到这台服务器，它都会自动把变更推到 GitLab。相当于基于 SSH 协议，自建了一个「私有中转层」。

## 6. 命令速查表

| 操作 | 命令 |
| --- | --- |
| 创建裸仓库 | `git init --bare` |
| 添加远程 | `git remote add b ssh://user@host:/path/repo.git` |
| 推送代码 | `git push b main` |
| 自动同步 GitLab | `hooks/post-receive` 中添加 `git push --mirror gitlab` |
| 同步工作区 | `git clone` / `git pull` |

裸仓库本质上就是没有工作区的纯 Git 仓库。换个角度看，我们平时推来推去的 GitHub、GitLab，背后其实就是一堆「.git 文件夹」。

一想到当年 Linus 为了维护 Linux 内核，顺手写了这个 Git 就觉得牛逼到不行。

Elegant，实在是 Elegant。
