---
title: MySQL
date: '2025-06-18T16:04:41+00:00'
published: false
feature: ''
---
# MySQL 密码重置并开启远程登录

MySQL 重置密码需要注意版本，5.7 和 8.0 有很多语句是不兼容的。

## 密码重置

MySQL 官网给出了两种重置密码的方式：

1. 通过 `--skip-grant-tables` 模式启动 MySQLD，在 MySQL Client 执行修改密码语句
2. MySQL Server 启动时附带有重置密码语句的文件

原理大差不差，主要流程都是：关闭现有 MySQL 服务器、用特殊模式启动 MySQLD、执行修改密码操作、刷新权限、重新以正常模式启动 MySQLD。

不同操作系统里的服务管理方式不一样，下面先记录用 `--skip-grant-tables` 的方式。

### 彻底关闭 MySQLD

```bash
brew services stop mysql
```

注意不要直接通过 `kill` MySQL 进程号关闭 MySQL 服务端。Linux 和 macOS 启动 MySQLD 时通常都有守护进程，手动杀掉 MySQL 后，很快又会被拉起来。

> Linux 系统可能是 `systemctl`，macOS 如果是用 Homebrew 安装的可以用 `brew` 管理守护进程。

### 跳过授权模式启动 MySQLD

```bash
mysqld --skip-grant-tables
```

### 无密码登录 MySQL

```bash
mysql
```

正常情况下，由于 MySQL Server 通过 `--skip-grant-tables` 启动，这个模式下连接 MySQL 无需密码。

### 刷新权限并重置密码

```sql
FLUSH PRIVILEGES;
```

在 MySQL 客户端执行这句，让 MySQL Server 重新载入权限表，以便后续账户管理语句生效。

> In the mysql client, tell the server to reload the grant tables so that account-management statements work

```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'MyNewPass';
```

修改 `root@localhost` 用户密码。

然后使用 `pkill Process Name` 或者 `kill + PID` 关闭 MySQLD：

```bash
pkill mysqld
```

或

```bash
kill `cat /mysql-data-directory/host_name.pid`
```

最后使用正常模式启动 MySQLD：

```bash
brew services start mysql
```

## 开启远程登录

开启远程登录需要三步：把 MySQLD 监听地址改为 `0.0.0.0`，重启 MySQLD，新增远程登录用户（`%`）并授权。

为了能改变绑定的地址范围为 `0.0.0.0`，首先需要找到配置文件路径：

```bash
mysql --help
```

可以看到默认配置文件路径：`/etc/my.cnf`、`/etc/mysql/my.cnf`、`/usr/local/etc/my.cnf`、`~/.my.cnf`

```bash
vi /usr/local/etc/my.cnf
```

在配置文件中添加：

```ini
bind-address = 0.0.0.0
```

创建远程 root 用户。是的，这是一个新用户，因为现有的是 `'root'@'localhost'`，只能本地访问：

```sql
CREATE USER 'root'@'%' IDENTIFIED BY '123';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%';
```

MySQL 8 不再支持在创建用户时候使用 `GRANT` 关键字进行授权。

> MySQL 8 can no longer create a user with GRANT, so there is an error in IDENTIFIED BY '123' if you try to use it with GRANT, which is the most common error.


## 参考资料

- [Resetting Permissions](https://dev.mysql.com/doc/refman/8.0/en/resetting-permissions.html)
- [MySQL 8 Remote Access](https://stackoverflow.com/questions/50570592/mysql-8-remote-access)
