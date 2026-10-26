---
title: 多平台配置 SSH 登录
date: '2025-03-28T11:47:48+00:00'
published: false
feature: ''
---

SSH 登录非常方便。SSH 作为一种协议，在多个平台下都有对应的 SSH Server 实现。

其中 OpenSSH Server 使用最广。

推荐尽量在多台机器上配置 SSH 密钥登录，并关闭密码登录。这样既不用每次输入密码，也能有效避免内网弱口令扫描。

与此同时，配置 SSH 免密登录后，不仅登录方便，SCP 文件传输也方便，甚至还能直接用主机别名 ping 各台机器，统一管理会舒服很多。

# SSH 免密登录配置

OpenSSH 是一款用于远程登录的连接工具，使用 SSH 协议。SSH 配置是双向的，OpenSSH 分为 Server 端和 Client 端：

- 需要在被登录端（Server）安装 openssh-server
- 也需要在客户端（Client）安装 ssh，Windows 10+、Ubuntu、macOS 基本都自带了

免密登录的总体步骤为：

1. 在服务器安装 openssh-server，并开启密钥登录鉴权
2. 生成一对密钥（公钥和私钥）
3. 将公钥放到 Server 的 Authorized_keys 文件中
4. 在客户端写配置文件，指定要登录的 IP、用户、端口和私钥路径

### Server SSH 安装配置

`sudo apt install openssh-server`

开启密钥登录，编辑配置文件：

`vi /etc/ssh/sshd_config`

找到 `PubkeyAuthentication yes` 项，删除前面的注释，保存并退出。

### 生成密钥

在 Mac 或者 Ubuntu 服务器上打开终端，执行 `ssh-keygen` 生成一对密钥：`id_rsa` 和 `id_rsa.pub`。

### Server 添加密钥到信任清单

将 id_rsa.pub 内容拷贝到服务器指定用户的信任密钥清单内：

如果想以 root 用户登录，就拷贝到：`/root/.ssh/authorized_keys`。

如果想以 chireal 用户登录，就拷贝到：`/home/chireal/.ssh/authorized_keys`。

如果没有就新建 authorized_keys 文件，新建完成后修改文件权限为 600：

`mkdir -p /root/.ssh/`
`touch /root/.ssh/authorized_keys`
`chmod 600 /root/.ssh/authorized_keys`

### MAC 作为客户端配置 SSH

在当前用户家目录下创建 `~/.ssh` 文件夹和 `config` 文件：

`mkdir -p ~/.ssh/`

`touch ~/.ssh/config`

将第一步生成的密钥移到 ~/.ssh/ 下（或者修改以下配置文件的路径）

最后的 `~/.ssh/config` 文件内容如下：

```text
Host tz
    User root
    HostName 192.168.191.11
    Port 22
    IdentityFile ~/.ssh/id_rsa

Host jf
    User root
    HostName 192.168.191.21
    Port 22
    IdentityFile ~/.ssh/id_rsa

Host lab
    User root
    HostName 192.168.191.48
    Port 22
    IdentityFile ~/.ssh/id_rsa
```

> 更多配置项详见标准配置文件模板：`/etc/ssh/ssh_config`
> 或者帮助文档：`man ssh_config`

### Windows 作为客户端配置 SSH

可以在 Windows Server 2019 和 Windows 10 设备上的 Windows 设置中安装这两个 OpenSSH 组件。详情可见：

[OpenSSH 安装文档](https://learn.microsoft.com/zh-cn/windows-server/administration/openssh/openssh_install_firstuse)

安装启用完成后，配置文件同上，直接放到 Windows 用户的家目录下即可：

`C:\Users\Administrator\.ssh`

### 测试

配置完成后可使用以下常见命令登录服务器、Ping 服务器、向服务器传文件、从服务端拉文件等：

```bash
# 登录服务器
ssh lab

# Ping 服务器
ping lab

# 向服务器传输文件
scp demofile lab:~/

# 从服务器下载文件
scp lab:~/demofile .
```
