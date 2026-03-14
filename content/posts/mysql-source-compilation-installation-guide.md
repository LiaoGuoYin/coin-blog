---
title: 编译安装 MySQL 配置跳坑记
date: '2019-07-07T19:53:38+00:00'
published: true
feature: ''
---

好好看官方文档
好好看官方文档
好好看官方文档

## 两种发行版

跌跌撞撞看了那么多辣鸡信息流，发现还是 [官方文档](https://dev.mysql.com/doc/refman/5.7/en/installing.html) 上手比较基础规整：

> Several versions of MySQL are available, and most are available in several distribution formats. You can choose from pre-packaged distributions containing binary (precompiled) programs or source code. When in doubt, use a binary distribution. Oracle also provides access to the MySQL source code for those who want to see recent developments and test new code.

Oracle 公司为大多版本提供了两种发行版:

- source code distribution: 源码包，需要自己编译安装
- binary distribution (pre-packaged): 二进制程序安装包，直接安装(pre-compiled)

官方推荐，大多数情况下使用程序安装包 (binary distribution)，并给出几个选择另一种源码包安装的理由。也就是需要自己编译的场景：

- 想自定义安装路径的用户，程序安装包为用户提供了通用路径，因此目录结构可能是散乱的，如果想自定义，则可以编译安装
- 程序安装包中不包含我们想要得 MySQL feature 功能，需自己编译安装
- 程序安装包中包含了多余的部分 feature 功能，我们可能用不上，则可以自己编译
- 想看里面的 C 和 C++ 源代码，自己造轮子，源代码包含了更多的测试样例和示例

既然你都看到这里了，那么体验一把编译安装不需要理由 ：）

区别你所下载发行版的包类型：

> File names for source distributions can be distinguished from those for **precompiled binary distributions in that source distribution names are generic and include no platform name**, whereas binary distribution names include a platform name indicating the type of system for which the distribution is intended (for example, pc-linux-i686 or winx64).

也就是直接通过文件名，未编译的源码包是有没操作系统名的，道理简单到令人发指 :emoji

## 安装

参考了两个手动编译安装配置文档：

- [Installing MySQL from Source](https://dev.mysql.com/doc/refman/5.7/en/source-installation.html) - MySQL 官方安装文档
- [Installing MySQL Server](http://howtolamp.com/lamp/mysql/5.6/installing/) - 非官方文档

### 找到安装包

第一步找 GA(Generally Available)安装包就给我整哭了，没有看文档的我瞎几把找也不知道浪费了多少时间，直到打开了文档：

> Let us goto [http://dev.mysql.com/downloads/](http://dev.mysql.com/downloads/). On the top of page, click on the **Downloads tab**, which will take us to the download page listing different MySQL projects. Below MySQL Community Server, click on the **DOWNLOAD link**, which will take us to the download page. We will see a list of **Generally Available (GA) Releases**. Select Platform as Source Code. Scroll to the bottom and we will see Generic Linux (Architecture Independent), Compressed TAR Archive. Click the Download button, which will take us to a page where we can Login/SignUp with an Oracle Web account. If you want, you can. But I chose to click on No thanks, just start my download.

- [MySQL 官网](http://dev.mysql.com/downloads/)
- Downloads 栏目
- Community
- 左边栏 MySQLl 选社区版本：Community Server
- 选版本 5.6
- 选系统：Source Code
- 会跳出来一个 Select OS Version:
- 选择 Generic Linux
 （注意：文件名中有操作系统的版本不是源码包，例：pc-linux-i686）

### 下载解压

    wget[https://dev.mysql.com/get/Downloads/MySQL-5.6/mysql-5.6.41.tar.gz](https://dev.mysql.com/get/Downloads/MySQL-5.6/mysql-5.6.41.tar.gz) | tar -zxvf mysql-5.6.41.tar.gz

### 安装依赖

    yum install -y git gcc gcc-c++ ncurses-devel bison

### 预编译

    cmake . -DENABLE_DOWNLOADS=1

> cmake 指预编译。DENABLE_DOWNLOADS=1 意味着自动下载相关依赖。/usr/local/mysql 是默认安装目录，换目录的话加参数 CMAKE_INSTALL_PREFIX=/diy_path

出现下面这段就是预编译完成：

-- Configuring done
-- Generating done
-- Build files have been written to: /root/mysql-5.6.42

### 编译安装

   make && make install

5. 最后可以看到 mysql 被安装到: /usr/local/mysql

### 配置

添加 service mysql start：

    cp /usr/local/mysql/support-files/mysql.server /etc/init.d/mysql /etc/init.d/mysql start

启动

搞定
