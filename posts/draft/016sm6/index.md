---
title: null
date: '2025-07-07T21:37:00+00:00'
published: false
feature: ''
---
VS Code Remote SSH 提供了丝滑、一致的开发体验。

可以把代码和开发环境依赖放在服务器上，本机只负责连接和编辑。

一方面，本地电脑环境会干净很多，随时可弹射（link）。另一方面，服务器有不断电的稳定性和更强的性能，长任务也更稳。

但因为一些不可描述的网络原因，或者单纯的兼容性问题，有时候没法直接通过在线方式安装 Remote SSH。比如我就遇到过下面这些情况：

*   服务器没网络，无法在线安装 VS Code Remote SSH 配套程序
    
*   本机 VS Code 版本太旧，又无法安装最新版本；能装到的最新版 Remote SSH 插件反而不兼容当前 VS Code
    

## 手动安装

### 下载 VS Code Remote SSH 套件（配套的 vscode-cli、vscode-server）

早期（2024 年 11 月）插件网页里还有在线下载按钮，但后续被隐藏掉了。个人猜测，可能是为了避免 Cursor 这类直接魔改 VS Code 的产品直接复用 VS Code 生态插件。

*   下载合适版本
    
    *   查看支持的 VS Code version
        
*   解压到指定目录
    
    *   .vscode, .vscode-cli
        
*   手动连接
    

Ref

*   闭源是因为有基于服务的部分：[https://stackoverflow.com/questions/55979489/wheres-the-actual-remote-ssh-source-code-repo-on-github](https://stackoverflow.com/questions/55979489/wheres-the-actual-remote-ssh-source-code-repo-on-github)
