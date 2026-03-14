---
title: Hadoop 完全分布式集群搭建指南
date: '2020-11-24T19:31:26+00:00'
published: true
feature: 'https://cdn.liaoguoyin.com/images/hadoop-fully-distributed-cluster-setup_0.jpg'
---

别问，问就是繁琐。

对自己的记忆力不太放心，也算是对近期实践的一个回顾，记录一下完全分布式 Hadoop 生态组件的基本搭建流程。

实质上，集群搭建只是繁琐，你只要熟悉一些基本的 Linux 命令，再简单理解一下集群架构就能很快上手，再把手翻过来，就会了。

所以严格来说，这应该算是一次 Linux 基本命令训练。

**本文内容包括：**
- 内网组建、免密登录、环境变量配置
- 搭建 Hadoop + MySQL + Hive + Zookeeper

**环境要求：**
- 操作系统：CentOS 7.6
- 读者需具备基本的 Linux 知识
- 了解 Hadoop 基本架构
- 预计阅读时间：15 分钟

## 环境准备

### 软件下载源

**建议使用国内镜像源：**
- [腾讯云 Apache 镜像](https://mirrors.cloud.tencent.com/apache/)
- [阿里云 Apache 镜像](https://mirrors.aliyun.com/apache/)

**国外源（备用）：**
- [Apache 官方软件源](https://archive.apache.org/dist/)

### 所需软件

- [OpenJDK 8](https://download.java.net/openjdk/jdk8u41/ri/openjdk-8u41-b04-linux-x64-14_jan_2020.tar.gz)
- [MySQL Connector/J](https://repo1.maven.org/maven2/mysql/mysql-connector-java/5.1.47/mysql-connector-java-5.1.47.jar)

### 配置约定

**环境变量：**
- 统一写入 `/etc/profile`，对所有用户生效，容错更高

**软件安装路径：**
- 默认安装目录：`/usr/local`

## 准备工作

搭建集群前，为方便集群的启动和文件传递，主要要确保以下配置：
- 内网组建
- 免密登录
- 环境变量

### 组建内网

#### 修改主机名

`hostnamectl set-hostname master`

`hostnamectl set-hostname slave1`

`hostnamectl set-hostname slave2`

#### 编辑内网别名

为了方便集群间通信，设置了主机别名

查询内网 IP `ifconfig`

```
cat > ~/etc/hosts << EOF
10.104.0.1 master
10.104.0.2 slave1
10.104.0.3 slave2
EOF
```

#### 配置免密登录

生成密钥公钥 `ssh-keygen -t rsa`

拷贝公钥到信任授权列表 `ssh-copy-id -i id_rsa.pub master`

#### 配置环境变量

```
cat >> /etc/profile << EOF

export JAVA_HOME=/usr/local/java-se-8u41-ri
export HADOOP_HOME=/usr/local/hadoop-2.9.2
export ZOOKEEPER_HOME=/usr/local/apache-zookeeper-3.5.8-bin
export HIVE_HOME=/usr/local/apache-hive-2.3.7-bin

export JAVA_BIN=\$JAVA_HOME/bin
export CLASSPATH=.:\$JAVA_HOME/lib/dt.jar:\$JAVA_HOME/lib/tools.jar
export HADOOP_CONF_DIR=\$HADOOP_HOME/etc/hadoop

export PATH=\$JAVA_HOME/bin:\$ZOOKEEPER_HOME/bin:\$HADOOP_HOME/bin:\$HADOOP_HOME/sbin:\$HIVE_HOME/bin:\$PATH
EOF
```

生效环境变量 `source /etc/profile`

## 1. Java

解压 `tar -zxvf openjdk-8u41-b04-linux-x64-14_jan_2020.tar.gz -C /usr/local`

测试 `java -version`

## 2. Hadoop

`cat > output.log << EOF` 是 [heredoc 语法](https://stackoverflow.com/questions/2500436/how-does-cat-eof-work-in-bash)，可以多行追加\覆盖写内容到文件，简洁易用

### 配置文件

- core-site.xml

  ```shell
  cat > $HADOOP_HOME/etc/hadoop/core-site.xml << EOF
  <configuration>
    <property>
      <name>fs.defaultFS</name>
      <value>hdfs://master:9000</value>
    </property>
    <property>
      <name>io.file.buffer.size</name>
      <value>131072</value>
    </property>
    <property>
      <name>fs.checkpoint.period</name>
      <value>60</value>
    </property>
    <property>
      <name>fs.checkpoint.size</name>
      <value>67108864</value>
    </property>
  </configuration>
  EOF
  ```
- hdfs-site.xml

  ```shell
  cat > $HADOOP_HOME/etc/hadoop/hdfs-site.xml << EOF
  <configuration>
    <property>
     <name>dfs.replication</name>
     <value>3</value>
   </property>
   <property>
     <name>dfs.namenode.name.dir</name>
     <value>/tmp/name</value>
   </property>
   <property>
     <name>dfs.datanode.data.dir</name>
     <value>/tmp/data</value>
   </property>
  </configuration>
  EOF
  ```
- mapred-site.xml

  ```shell
  cat > $HADOOP_HOME/etc/hadoop/mapred-site.xml << EOF
  <configuration>
    <property>
      <!--指定Mapreduce运行在yarn上-->
      <name>mapreduce.framework.name</name>
      <value>yarn</value>
    </property>
  </configuration>
  EOF
  ```
- yarn-site.xml

  ```shell
  cat > $HADOOP_HOME/etc/hadoop/yarn-site.xml << EOF
    <configuration>
    <!-- 指定ResourceManager的地址-->
    <property>
     <name>yarn.resourcemanager.address</name>
     <value>master:18040</value>
   </property>
   <property>
     <name>yarn.resourcemanager.scheduler.address</name>
     <value>master:18030</value>
   </property>
   <property>
     <name>yarn.resourcemanager.webapp.address</name>
     <value>master:18088</value>
   </property>
   <property>
     <name>yarn.resourcemanager.resource-tracker.address</name>
     <value>master:18025</value>
   </property>
   <property>
     <name>yarn.resourcemanager.admin.address</name>
     <value>master:18141</value>
   </property>
   <!-- 指定reducer获取数据的方式-->
   <property>
    <name>yarn.nodemanager.aux-services</name>
    <value>mapreduce_shuffle</value>
   </property>
   <property>
    <name>yarn.nodemanager.auxservices.mapreduce.shuffle.class</name>
    <value>org.apache.hadoop.mapred.ShuffleHandler</value>
   </property> 
  </configuration>
  EOF
  ```

### 配置节点文件

- master

  ```shell
  cat > $HADOOP_HOME/etc/hadoop/master << EOF
  master
  EOF
  ```
- slaves

  ```shell
  cat > $HADOOP_HOME/etc/hadoop/slaves << EOF
  slave1
  slave2
  EOF
  ```

### 配置运行时环境

手动配置以下文件中的  *JAVA_HOME*

- $HADOOP_HOME/etc/hadoop/yarn-env.sh
- $HADOOP_HOME/etc/hadoop/hadoop-env.sh

### 分发配置文件

`scp -r $HADOOP_HOME slave1:$HADOOP_HOME`

`scp -r $HADOOP_HOME slave2:$HADOOP_HOME`

### 格式化名称节点

`hdfs namenode -format`

### 其他

启动节点: `start-dfs.sh `、`start-yarn.sh`

检测节点状态: `hdfs dfsadmin -report`

刷新节点状态: `hdfs dfsadmin -refreshNodes`

## 4. Zookeeper

[Zookeeper Config](https://www.cnblogs.com/qingyunzong/p/8618965.html)

## 5. MySQL

MySQL 简单的外表下藏露着凶恶，是我们练习过程中踩坑踩得最多的地方，主要原因是 MySQL 的版本之间差异很大，做同一件事情的命令可能因为版本区别而存在差异，所以建议 Google 过程中带上 MySQL 版本号。

### 安装

### 通过第三方包管理器安装(RPM, Yum)

https://dev.mysql.com/doc/refman/5.7/en/linux-installation-yum-repo.html

https://dev.mysql.com/downloads/repo/yum

1. 添加 YUM 源

   `wget https://dev.mysql.com/get/mysql80-community-release-el7-3.noarch.rpm -P ./`

   `yum localinstall mysql80-community-release-el7-3.noarch.rpm`
2. 编辑默认版本

   `yum-config-manager --enable mysql56-community` 或者手动编辑 `/etc/yum.repos.d/mysql-community.repo`
3. 安装

   ```shell
   yum install mysql-community-server
   ```

### 通过通用发行版安装**(GA)**

1. [找安装包](https://dev.mysql.com/downloads/mysql/)
2. 安装：sudo yum install mysql-community-{server,client,common,libs}-*

### 其他

- 配置初始密码

  ```shell
  service mysqld start
  grep 'temporary password' /var/log/mysqld.log
  mysql_secure_installation
  ```
- 修改密码策略并开启远程访问

  ```
  SHOW VARIABLES LIKE 'validate_password%';
  SET GLOBAL validate_password_length = 6;
  SET GLOBAL validate_password_number_count = 0;
  SET GLOBAL validate_password_policy=LOW;
  ALTER USER 'root'@'%' IDENTIFIED BY 'newpassword';
  GRANT ALL ON *.* to user@'%' IDENTIFIED BY 'newpassword';
  ```
- [忘记密码](https://dev.mysql.com/doc/refman/5.7/en/resetting-permissions.html)

  ```
  service mysqld stop # 关闭 MySQL-Server
  service mysqld --user=mysql --skip-grant-tables # 跳过密码临时开启 MySQL-Server 并挂起

  # 另外开一个 MySQL-Client
  mysql
  flush privileges;
  ALTER USER 'root'@'localhost' IDENTIFIED BY 'newpassword';
  ```

## 6. Hive

[Hive 是为了解决 Hadoop 中 Mapreduce 编写困难，提供给熟悉 SQL 的人使用的。只要你对 SQL 有一定的了解，就能通过 Hive 写出 Mapreduce 的程序，而不需要去学习 Hadoop 中的 Java API](https://www.cnblogs.com/xing901022/p/5775954.html)

### 配置运行时环境

- $HIVE_HOME/conf/hive-env.sh

  ```shell
  cat > $HIVE_HOME/conf/hive-env.sh << EOF
  # 配置 Hadoop 安装路径
  export HADOOP_HOME=$HADOOP_HOME
  # 配置 Hive 配置文件存放路径
  export HIVE_CONF_DIR=$HIVE_HOME/conf
  # 配置 Hive 运行资源库路径
  export HIVE_AUX_JARS_PATH=$HIVE_HOME/lib
  EOF
  ```

### 配置节点文件

master 和 slaves 节点的配置文件不完全相同，这是因为各个节点所承担的角色，完成的任务不同所导致的，

在完全分布式模式中，Hive 分为 Server\Client

任务分工：

1. slave1 上安装 MySQL，通过 MySQL 存储 Hive 元数据信息
2. slave2 作为 Hive-Server，并承担来自 Client 的请求，并把数据存储到 MySQL 中
3. slave1, master 作为 Hive-Client，有命令行模式供用户输入 HiveQL 语句

配置文件:

- Hive-Server(slave2)

  ```shell
  cat > $HIVE_HOME/conf/hive-site.xml << EOF
   <configuration>
    <!-- Hive产生的元数据存放位置-->
    <property>
      <name>hive.metastore.warehouse.dir</name>
      <value>/root/hive/warehouse</value>
    </property>
    <!-- 数据库连接driver，即MySQL驱动-->
    <property>
      <name>javax.jdo.option.ConnectionDriverName</name>
      <value>com.mysql.jdbc.Driver</value>
    </property>
    <!-- 数据库连接JDBC的URL地址-->
    <property>
      <name>javax.jdo.option.ConnectionURL</name> 
      <value>jdbc:mysql://slave1:3306/hive?createDatabaseIfNotExist=true&useSSL=false&useUnicode=true&characterEncoding=UTF-8</value>
    </property>
    <!-- MySQL数据库用户名-->
    <property>
      <name>javax.jdo.option.ConnectionUserName</name>
      <value>root</value>
    </property>
    <!-- MySQL数据库密码-->
    <property>
      <name>javax.jdo.option.ConnectionPassword</name>
      <value>123456</value>
    </property>
    <!--shemas自动管理配置-->
    <property>
      <name>datanucleus.metadata.validate</name>
      <value>false</value>
    </property>
    <property>
      <name>hive.metastore.schema.verification</name>
      <value>false</value>
    </property>
    <property>
      <name>datanucleus.schema.autoCreateAll</name>
      <value>true</value>
    </property>
  </configuration>
  EOF
  ```
- Hive-Client(slave1, master)

  ```shell
  cat > $HIVE_HOME/conf/hive-site.xml << EOF
    <configuration>
  <!-- Hive产生的元数据存放位置-->
  <property>
  <name>hive.metastore.warehouse.dir</name>
  <value>/root/hive/warehouse</value>
  </property>
  <!--- 使用本地服务连接Hive,默认为true-->
  <property>
  <name>hive.metastore.local</name>
  <value>false</value>
  </property>
  <!-- 连接服务器-->
  <property>
  <name>hive.metastore.uris</name>
  <value>thrift://slave2:9083</value>
  </property>
    </configuration>
  EOF
  ```

### 导入 JDBC 驱动

导入 JDBC 驱动到 $HIVE_HOME/lib

`wget https://repo1.maven.org/maven2/mysql/mysql-connector-java/5.1.47/mysql-connector-java-5.1.47.jar -P $HIVE_HOME/lib`

### 初始化 Hive metastore

`schematool -initSchema -dbType mysql`

## 7. 日志 & 文档

http://www.hadooplessons.info/2017/12/log-files-in-hadoop-eco-system.html

查报错、[对文档](https://www.iteblog.com/archives/896.html)是最基本的操作，这个少不了

### 日志

Logs 文件常见类型有：

- *.out 记录了**启动**后台进程过程中遇到的失败消息
- *.log 记录了**运行**后台进程的过程中的错误信息，一般查询时要用 tail -f 实时捕获

下面是组件**默认日志文件的位置、及日志文件所在的配置文件**位置:

Hadoop：

- 配置文件: $HADOOP_HOME/etc/hadoop/hadoop-env.sh
- 默认日志位置: $HADOOP_HOME/logs

Zookeeper：

- 配置文件: $ZOOKEEPER_HOME/conf/log4j.properties
- 默认日志位置: $ZOOKEEPER_HOME/logs

Hive:

- 配置文件:  $HIVE_HOME/conf/hive-log4j.properties
- 默认日志位置: /tmp/<*user.name*>/hive.log

MySQL:

- 配置文件: /etc/my.cnf
- 默认日志位置: /var/log/mysqld.log

### 文档

Hadoop 文档:

http://www.hadoop.org/hadoop-project-dist/hadoop-common/core-default.xml

http://www.hadoop.org/hadoop-project-dist/hadoop-hdfs/hdfs-default.xml

http://www.hadoop.org/hadoop-project-dist/hadoop-hdfs-rbf/hdfs-rbf-default.xml

http://www.hadoop.org/hadoop-mapreduce-client/hadoop-mapreduce-client-core/mapred-default.xml

http://www.hadoop.org/hadoop-yarn/hadoop-yarn-common/yarn-default.xml

[Hive 文档](https://cwiki.apache.org/confluence/display/Hive/AdminManual+Configuration)

## 8. 部署完成后各组件 WebUI

For a basic single node configuration here the web interfaces (hadoop1 is my hostname):

- Resource Manager:  http://hadoop1:8088
- Web UI of the NameNode daemon:  http://hadoop1:50070
- HDFS NameNode web interface:  http://hadoop1:8042
