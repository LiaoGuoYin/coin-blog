---
title: Zerotier 组网之自建 Moon 加速节点
date: '2024-11-27T08:46:38+00:00'
published: true
feature: ''
---

ZeroTier 是商业级的 P2P 组网方案。因其服务器位于境外，中国大陆用户经常遇到延迟较高的问题。为解决这个问题，[从 ZeroTier 1.2.0 版本开始，引入了自建 Moon 节点功能](https://docs.zerotier.com/roots)，允许用户部署私有中转节点来优化网络性能。

本文记录了 Moon 节点的部署和使用步骤。

## 1. Moon 节点工作原理概述

ZeroTier 网络中的所有节点默认都位于 Planet 中，即 ZeroTier 的官方根服务器网络。Moon 节点作为用户自定义的根服务器，具有以下特点：

1. **双重路由机制**
   - 节点同时使用 Planet 和 Moon 服务器
   - 自动选择延迟最低的路由
   - 当两者都不可用时回退到官方服务器
2. **适用场景**
   - 优化特定地理位置的网络性能
   - 创建离线/内网组网环境（毕竟整个互联网也算是个大局域网）

## 2. 部署 moon 节点

前置条件：

- 节点需要具有静态 IP（可以是公网 IP 或内网 IP。如果没有公网 IP，无法通过路由公网访问）
- 开放 UDP 9993 端口（防火墙和安全组都需要放行，可在服务器防火墙和云服务商安全组中放行）
- 主要需求是稳定的网络连接

### 2.1 安装 Zerotier

打开命令行，在云服务器 linux 上安装 Zerotier：

```

# Linux 下载安装

curl -s https://install.zerotier.com/ | sudo bash

# 验证安装情况

zerotier-cli info

```

![image-20241204225936251](https://cdn.liaoguoyin.com/images/zerotier-custom-moon-acceleration-node_1.png)

### 2.2 生成 moon 配置文件

```

# 进入配置目录

cd /var/lib/zerotier-one

# 生成初始配置。读取 identity.public 中的公钥信息，生成初始的 moon 节点配置的 JSON 文件:

zerotier-idtool initmoon identity.public > moon.json

```

> 如果没有生成 moon.json 文件，可能是因为没有写文件的权限。可以 sudo -i 切换为超级用户后再执行命令

![image-20241204230001959](https://cdn.liaoguoyin.com/images/zerotier-custom-moon-acceleration-node_2.png)

```

# 生成最终配置文件。基于 moon.json 配置文件，生成最终的 moon 配置文件（通常命名为 000000xxxx.moon）：

zerotier-idtool genmoon moon.json

```

![image-20241204230044465](https://cdn.liaoguoyin.com/images/zerotier-custom-moon-acceleration-node_3.png)

如上图，最终的 000000a62f602019.moon，其中包含了完整的配置信息：

- 是二进制文件，不可读
- 带有加密签名
- 通常放在 /var/lib/zerotier-one/moons.d/ 目录下
- moon-id 为(10 位或 16 位标识符)：**000000a62f602019**或**a62f602019**

## 3. 使用 Moon 节点加速

同样地，首先需要在客户端安装 Zerotier，然后在在客户端中加入 moon 节点。

#### 3.1 在客户端添加 moon 节点

> 不同客户端版本 moon-id 不一致，需要检查本机 zerotier 版本（zerotier-cli -v 命令可查看版本），如：
>
> - 在 zerotier 1.10.6 版本中，moon-id 是 16 位，前面有多余 0
> - 在 zerotier 1.12.2 版本后，moon-id 是 10 位字符串
>
> 总的来说，在新版中 moon-id 是 10 位字符串，需要注意删除前面多余的 0
>
> 这是一个很奇怪的更新，在官方的文档中我没找到任何明确的说明，[还是自己去 Github 开 Issues 问到的（笑脸黄豆.jpg）](https://github.com/zerotier/ZeroTierOne/issues/2197)

```

zerotier-cli orbit <moon-id> <moon-id>

```

注意版本差异：

- 1.10.6 版本：使用 16 位 moon-id（含前导零）

```

zerotier-cli orbit 000000a62f602019 000000a62f602019

```

- 1.12.2+ 版本：使用 10 位 moon-id（去除前导零）

```

zerotier-cli orbit a62f602019 a62f602019

```

orbit 命令会返回 200 状态码表示添加成功。如果 orbit 一直返回 404 状态需要检查上文的版本，多重试几次 orbit

#### 3.2 检查所添加的 moon 状态

可以通过 listmoons 和 listpeers 检查 moon 状态

#### 3.2.1 检查 moons 列表

listmoons 命令可以列出本机所加入的自建 moons 节点情况

```

zerotier-cli listmoons

```

![image-20240530080516172](https://cdn.liaoguoyin.com/images/zerotier-custom-moon-acceleration-node_4.png)

上图可以看到加入 moons 前后 listmoons 情况。如果 listmoons 不为空，即表明添加成功

#### 3.2.2 检查 peers 状态

listpeers 命令可将本机所加入的网络组下、组网环境中的节点列出，可用于检查机器间的连接情况

```

zerotier-cli listpeers

```

![image-20240530081529008](https://cdn.liaoguoyin.com/images/zerotier-custom-moon-acceleration-node_5.png)

其中最后一个字段 `<role>`表明机器身份：

- PLANET 表示 zerotier 官方的中转节点，延迟 42364ms
- MOON 表示自建 zerotier 中转节点，延迟 55ms
- LEAF 表示组网范围内的其他同级别节点

通过在两台 LEAF 节点中同时添加 MOON 节点，可以实现大幅加速效果

> 确定添加完成后。可在添加 moon 节点后观察组网机器内的机器延迟情况（ping 测试）观察中转效果
>
> 加入前后两机之间的 ﻿ping 时间明显减少，500ms+ -> 50ms+

其他指令：

-`zerotier-cli deorbit <moon-id>`可用于取消加入 moon 节点
- `zerotier-cli -h`，帮助，可查看所有指令

## 4. 最佳实践

- 建议客户端至少加入两个 Moon 节点
- Moon 节点专注于网络中转功能
  - 避免将多个节点部署在同一物理服务器上
  - 避免将 Moon 服务器同时作为 Moon 和 Leaf 节点
  - 适合将 Moon 部署在就近的数据中心（如国内云服务商）

## 5. Ref

- [Private Root Servers | ZeroTier Documentation](https://docs.zerotier.com/roots/)
- [MoonID 变更情况，新机器无法加入 moon-id 的方案](https://github.com/zerotier/ZeroTierOne/issues/2197)
- [Private Root Servers](https://docs.zerotier.com/roots)
