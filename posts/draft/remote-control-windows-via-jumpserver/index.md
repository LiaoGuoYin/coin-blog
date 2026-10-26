---
title: 通过跳板机实现内网 Windows 主机远程控制
date: '2025-04-12T05:02:07+00:00'
published: false
feature: ''
---

## 背景介绍

在受限网络环境中，经常会遇到需要远程访问内网主机的场景。这篇记录一下如何通过一台能连接互联网的跳板机，访问内网 Windows 主机。

## 网络拓扑

涉及三台主机：

- 本地主机（A）：操作发起端
- 跳板机（B）：中转服务器，同时接入外网和目标内网，具备双网卡，网卡可以是虚拟的
- 目标主机（C）：位于内网的 Windows 主机

网络特点：

- 本地主机（A）无法直接访问目标主机（C）
- 跳板机（B）可以同时访问本地主机（A）和目标主机（C）
- 目标主机（C）处于隔离网络环境中

## 先决条件

### 跳板机（B）要求

1. 必须能够同时与本地主机（A）和目标主机（C）网络互通
2. 需安装 OpenSSH 服务
   - Linux 系统默认已安装
   - Windows 系统：
     - 最新版 Windows 默认已安装
     - 较老版本需手动安装，参考：[Microsoft 官方指南](https://learn.microsoft.com/en-us/windows-server/administration/openssh/openssh_install_firstuse)

### 目标主机（C）要求

需要开启远程访问服务，支持以下两种方式之一：

1. RDP（Windows 远程桌面协议）

   - Windows 专业版默认支持 RDP，在系统高级设置中开启即可
   - Windows 家庭版需安装 [SuperRDP 补丁](https://github.com/anhkgg/SuperRDP) 启用支持 RDP
2. VNC 协议

   - 需安装 VNC 服务端，推荐：
     - [TightVNC](https://www.tightvnc.com/download.php)
     - [RealVNC](https://www.realvnc.com/en/connect/download/viewer/)

## 配置步骤

### 1. SSH 端口转发配置

以 RDP 协议为例，在本地主机（A）上执行以下命令：

```bash
ssh -L 3900:目标主机 IP:3389 用户名@跳板机 IP -N

```

参数说明：

- `-L 3900:目标主机 IP:3389`：将本地 3900 端口转发至目标主机的 3389 端口（RDP 默认端口）
- `用户名@跳板机 IP`：跳板机的登录信息
- `-N`：仅建立端口转发，不执行远程命令

### 2. 远程连接

1. 在本地主机（A）上打开远程桌面连接工具
2. 连接地址输入：`localhost:3900`
3. 输入目标主机（C）的登录凭据即可访问

## 其他实现方案

除了 SSH 端口转发，还可以考虑：

1. WireGuard VPN

   - 在跳板机上配置 WireGuard 服务
   - 优点：稳定性好，配置完成后使用方便
2. iptables 路由转发

   - 适用于 Linux 跳板机
   - 通过配置路由规则实现转发

## 参考资料

- [SSH 端口转发详解](https://wangdoc.com/ssh/port-forwarding)
- [OpenSSH 官方文档](https://www.openssh.com/manual.html)
