---
title: 科学上网配置指南
date: '2019-12-07T19:37:32+00:00'
published: false
feature: ''
---

这篇也是早年的折腾记录，写的是当时用 Shadowsocks-go 在 VPS 上跑服务端的过程。现在看起来非常“古早”，所以更适合当资料备份：思路可以参考，具体版本、命令和安全性都需要自己重新确认。

适合人群：有一点 Linux 基础，知道怎么登录 VPS、怎么编辑文件，也愿意自己搜索报错。

## 登录 VPS

连接工具按系统来：

- Windows：PuTTY / Xshell
- macOS：系统自带 Terminal

当时的测试环境：

- 操作系统：CentOS 7
- 虚拟化：KVM

## 下载 Shadowsocks 服务端

先到 [Shadowsocks-go 项目](https://github.com/shadowsocks/shadowsocks-go) 的 `Releases` 页面复制下载链接，然后在服务器上下载、解压。

```bash
wget https://github.com/shadowsocks/shadowsocks-go/releases/download/1.2.1/shadowsocks-server.tar.gz
tar -zxvf shadowsocks-server.tar.gz
```

创建配置文件：

```bash
vi config.json
```

按 `i` 进入插入模式后写入配置。

**单用户配置：**

```json
{
    "server": "0.0.0.0",
    "server_port": 8888,
    "local_port": 1080,
    "local_address": "127.0.0.1",
    "password": "password.@",
    "method": "aes-128-cfb",
    "timeout": 600
}
```

**多用户配置：**

```json
{
    "server": "0.0.0.0",
    "local_port": 1080,
    "port_password": {
        "1111": "password.@",
        "2222": "password.@",
        "3333": "password.@",
        "4444": "password.@",
        "5555": "password.@",
        "6666": "password.@",
        "7777": "password.@",
        "8888": "password.@",
        "9999": "password.@"
    },
    "method": "aes-128-cfb",
    "timeout": 600
}
```

写完后按 `Esc`，输入 `:wq` 保存退出。

启动服务：

```bash
./shadowsocks-server -c config > log &
```

这条命令会把 Shadowsocks 服务端放到后台运行，并把日志重定向到当前目录的 `log` 文件里。后面可以用 `cat log` 看连接记录。

如果防火墙挡住了端口，可以先临时关闭：

```bash
service firewalld stop
```

到这里，最基础的服务就跑起来了。

为了方便重启，可以把下面内容保存成 `restart.sh`：

```bash
pidof shadowsocks-server | xargs kill -9
nohup ./shadowsocks-server -c config > log &
service firewalld stop
```

## 优化

下面这些都是 `非必要` 优化项，主要是网络参数、拥塞算法和服务器安全配置。当年为了榨一点体验会折腾，现在更建议先确认自己到底有没有这个需求。

### 调整 TCP 参数

编辑 sysctl 文件：

```bash
vi /etc/sysctl.d/local.conf
```

加入以下配置并保存：

```text
fs.file-max = 51200
net.core.rmem_max = 67108864
net.core.wmem_max = 67108864
net.core.rmem_default = 65536
net.core.wmem_default = 65536
net.core.netdev_max_backlog = 4096
net.core.somaxconn = 4096
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_tw_recycle = 0
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.ip_local_port_range = 10000 65000
net.ipv4.tcp_max_syn_backlog = 4096
net.ipv4.tcp_max_tw_buckets = 5000
net.ipv4.tcp_fastopen = 3
net.ipv4.tcp_rmem = 4096 87380 67108864
net.ipv4.tcp_wmem = 4096 65536 67108864
net.ipv4.tcp_mtu_probing = 1
net.ipv4.tcp_congestion_control = hybla
```

执行：

```bash
sysctl -e -p
```

### 改善 TCP 拥塞算法

先查看系统版本：

```bash
cat /etc/redhat-release
```

下面是 CentOS 7 的老步骤。Debian、Ubuntu、CentOS 6 可以参考 [Github Wiki：改善 TCP 拥塞算法](https://github.com/iMeiji/shadowsocks_install/wiki/%E5%BC%80%E5%90%AF-TCP-BBR-%E6%8B%A5%E5%A1%9E%E7%AE%97%E6%B3%95)。

下载并更换内核：

```bash
rpm --import https://www.elrepo.org/RPM-GPG-KEY-elrepo.org
rpm -Uvh http://www.elrepo.org/elrepo-release-7.0-3.el7.elrepo.noarch.rpm
yum --enablerepo=elrepo-kernel install kernel-ml -y
```

查看内核是否安装成功：

```bash
rpm -qa | grep kernel
```

更新 grub 引导并重启：

```bash
egrep ^menuentry /etc/grub2.cfg | cut -f 2 -d "'"
grub2-set-default 0
reboot
```

重启后重新登录服务器，确认内核版本是否已经大于等于 4.9：

```bash
uname -r
```

查看 BBR 状态：

```bash
lsmod | grep bbr
```

如果结果里没有 `tcp_bbr`，再手动加载：

```bash
sudo modprobe tcp_bbr
echo "tcp_bbr" | sudo tee --append /etc/modules-load.d/modules.conf
echo "net.core.default_qdisc=fq" | sudo tee --append /etc/sysctl.conf
echo "net.ipv4.tcp_congestion_control=bbr" | sudo tee --append /etc/sysctl.conf
sudo sysctl -p
```

最后检查：

```bash
sysctl net.ipv4.tcp_available_congestion_control
sysctl net.ipv4.tcp_congestion_control
lsmod | grep bbr
```

能看到 `bbr` 和 `tcp_bbr`，基本就说明 BBR 已经启用。

### 调整安全

[Securing Public Shadowsocks Server](https://github.com/shadowsocks/shadowsocks/wiki/Securing-Public-Shadowsocks-Server)

## 测速脚本

Linux 服务器网络测速 / 硬盘速度测试脚本：

```bash
wget -N --no-check-certificate https://raw.githubusercontent.com/FunctionClub/ZBench/master/ZBench-CN.sh && bash ZBench-CN.sh
```

如果只想简单测网络，可以用 `wget`：

```bash
wget -O /dev/null http://ping.online.net/1000Mo.dat
```

## 系统监控命令

安装：

```bash
yum install sysstat
```

常用命令：

- 内存监控：`free`、`vmstat`
- CPU 监控：`top`、`mpstat`
- 网络监控：`ethtool`、`sar`、`netstat`
- 磁盘监控：`df`、`iostat`
- 进程监控：`top`、`ps`

## 选择 VPS

- [BandwagonHost](https://bandwagonhost.com/aff.php?aff=30902)：搬瓦工，当时主要看 CN2 线路。
- [Vultr](https://www.vultr.com/?ref=7521267)：硅谷、洛杉矶、加拿大都有人用，适合拿来练手，用完就删。
- [阿里云国际](https://www.alibabacloud.com/)：注意是国际站，不是大陆区。香港、日本都可以看，购买门槛比普通 VPS 高一些。
- [HostDare](https://manage.hostdare.com/aff.php?aff=1218)：当时口碑还行，主要看 CN2 KVM。

## 选择线路

[https://github.com/haoel/haoel.github.io](https://github.com/haoel/haoel.github.io)

## 选择 SS 衍生版

在 [GitHub](https://github.com) 搜索 Shadowsocks，可以看到很多衍生版。

版本之间的差异可以看 [官方文档](https://github.com/shadowsocks/shadowsocks/wiki/Feature-Comparison-across-Different-Versions)。简单说：

> Go：比较轻量，但功能也少。Python：支持 Multiple Users / Workers / Graceful Restart，更适合多用户场景。libev：支持 ss-redir 和 ss-tunnel，很多能力更偏客户端。

## Reference

[Linux服务器/VPS 网络测速/硬盘速度 测试脚本](https://www.openos.org/post/106/)

[shadowsocks 的优化和安全设置总结](https://www.590103.idv.tw/blog/%E8%BD%89%E8%B2%BC%E5%82%99%E4%BB%BD%E7%94%A8shadowsocks%E7%9A%84%E4%BC%98%E5%8C%96%E5%92%8C%E5%AE%89%E5%85%A8%E8%AE%BE%E7%BD%AE%E6%80%BB%E7%BB%93#.XKahmeszYl4)

[Wiki：改善 TCP 拥塞算法](https://github.com/iMeiji/shadowsocks_install/wiki/%E5%BC%80%E5%90%AF-TCP-BBR-%E6%8B%A5%E5%A1%9E%E7%AE%97%E6%B3%95)

[常用 Linux 系统监控命令](https://songlee24.github.io/2015/09/05/linux-monitor-tools/)

[如今我这样科学上网](https://medium.com/@unbiniliumm/%E5%A6%82%E4%BB%8A%E6%88%91%E8%BF%99%E6%A0%B7%E7%A7%91%E5%AD%A6%E4%B8%8A%E7%BD%91-95187ef07ced)
