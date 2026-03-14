---
title: 配一台新 Mac 我都配些什么
date: '2025-03-26T11:47:00+00:00'
published: true
feature: ''
---
最近装机频繁，抹掉系统之后装来装去就那几个 App，就那点设置。

索性记录下配置新 Mac 时的设置，顺便整理分享一些比较好用的 Mac App。

内容主要分为三大块：[系统设置](https://macos-defaults.com/)、安装应用软件(Homebrew)、数据迁移。

## 系统设置

### 键盘

为了方便连续输入，调整按键重复速度：系统偏好设置 > 键盘

* 按键重复速度：最快

* 重复前延迟：短（或倒数第二格）

### 触控板

[默认触控板需要按到底，且部分手势没开启，按需调整](https://wild-flame.github.io/guides/docs/mac-os-x-setup-guide/preference_and_settings/readme)

![image-20250329124059851](https://cdn.liaoguoyin.com/images/new-mac-setup-configuration-guide_1.png)

* 修改点按力度，开启轻按触摸：系统设置 > 触控板 > 光标与点按 > 点按「**中**」

* 快速单词查询，开启三指轻点：系统设置 > 触控板 > 光标与点按 > 查询数据检测器「**三指轻点**」

* 实现鼠标右键，开启双指点按：系统设置 > 触控板 > 光标与点按 > 辅助点按「**双指点按**」

* 避免误触发，关闭轻点：系统设置 > 触控板 > 光标与点按 > 辅助点按关闭「**轻点来点按**」

![image-20250329124642156](https://cdn.liaoguoyin.com/images/new-mac-setup-configuration-guide_2.png)

* [三指选中多行文本](https://sspai.com/post/39202)。开启三指拖拽：系统设置 > 辅助功能 > 互动 > 鼠标与触控板 > 触控板选项「三指拖移」

### 台前调度设置

![1744471692361](https://cdn.liaoguoyin.com/images/new-mac-setup-configuration-guide_3.png)非常糟糕的交互特性，容易误触，关闭台前调度中墙纸点按收放：设置 > 桌面与拓展坞 > 点按墙纸以显示桌面「仅在台前调度中」

### Finder 设置

![image-20250329123547842](https://cdn.liaoguoyin.com/images/new-mac-setup-configuration-guide_4.png)打开 Finder，在屏幕右上角选择「偏好设置」（command + .）

* 设置新窗口默认打开位置：Home 目录

* 自定义侧边栏选项

* 显示路径栏和状态栏

### Terminal 设置

Mac 自带的 Terminal 终端很好用，但缺点是比较简陋，文本既没高亮，信息又不完整。

可以通过修改 Shell 配置文件 `~/.zshrc` 来实现 **文件夹高亮显示、完整路径显示。**

配置前后的差异如下：

![1](https://cdn.liaoguoyin.com/images/new-mac-setup-configuration-guide_5.png)

```bash
export CLICOLOR='Yes' # 是否输出颜色
export LSCOlORS='Exfxcxdxbxegedabagacad' # 定义 ls 命令输出的颜色和样式
export LC_ALL=en_US.UTF-8 # 设置所有区域设置为美国英语，字符编码为 UTF-8
export LANG=en_US.UTF-8 # 设置默认语言为美国英语，字符编码为 UTF-8
export PS1="%B%F{034}%m%f%b:%d %% " # 设置命令提示符格式，包含主机名和当前目录

export LC_ALL=en_US.UTF-8 # 重复设置所有区域设置
export LANG=en_US.UTF-8 # 重复设置默认语言

```

### Time Machine

![Xnip2024-11-21_23-52-39](https://cdn.liaoguoyin.com/images/new-mac-setup-configuration-guide_6.png)有 Mac，有 NAS，那么碎片化整机增量备份，Time Machine 自然少不了。

注：为避免 NAS 硬盘炒豆子噪音，可以降低备份频率到「每周一次」

### 远程连接

为了能随时方便地把本机当作服务器，通过 CLI 或者 VNC 形式进行连接，可以配置远程登录配置项实现 Ubuntu 下 openssh-server 的效果。

> * Mac Mini：[https://www.youtube.com/watch?v=CITHNloGlnU](https://www.youtube.com/watch?v=CITHNloGlnU)
>
> * 文件共享：[https://sspai.com/post/61388](https://sspai.com/post/61388)
>

### 禁用 .DS_Store

用 Mac 压缩过文件的朋友应该都见过 zip 包中的 💩：[.DS\_Store](https://zh.wikipedia.org/wiki/.DS_Store)，[\_\_MACOSX](https://www.betterzip.net/faq/mac-osx.html)

.DS\_Store 文件（Desktop Service Store）是一种由苹果公司的 Mac OS X 操作系统所创造的隐藏文件，目的在于存贮目录的自定义属性，主要用于存放元数据，比如记录一些图标大小、查看方式等。

打开命令行，[禁用 .DS\_Store 文件生成](https://www.bilibili.com/video/BV1L4znYWECG/)：

```bash
defaults write com.apple.desktopservices DSDontWriteNetworkStores -bool TRUE

```

## 开发工具

### Surge

配置好科学上网后，后续软件的安装难度呈指数级下降。

配置为软路由，DHCP 接管网络，可参考（TODO）：

* [https://dosbat.com/2024/10/08/Macmini+surge+asus%20mesh%E7%BB%84%E7%BD%91/index.html](https://dosbat.com/2024/10/08/Macmini+surge+asus%20mesh%E7%BB%84%E7%BD%91/index.html)

* [https://oftime.net/2021/07/27/net/](https://oftime.net/2021/07/27/net/)

* [https://qust.me/post/MacSurgeRouter/](https://qust.me/post/MacSurgeRouter/)

### Homebrew

[Homebrew](https://brew.sh/) 是 Mac 下面的包管理工具（类似于 apt、yum），可以安装、卸载 Mac GUI/CLI 应用程序。

* 安装 Command Line Tools

```bash
xcode-select --install

```

* 安装 Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

```

### NVM

![Xnip2024-11-21_23-38-56](https://cdn.liaoguoyin.com/images/new-mac-setup-configuration-guide_7.png)

[NVM](https://github.com/nvm-sh/nvm)（Node Version Manager）是 Node.js 版本管理工具，可以方便地安装卸载不同版本的 Node.js。

* 安装 NVM

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

```

* 安装 Node.js 20，并启用

```bash
nvm install 20
nvm use 20

node --version # 验证 Node.js 版本
npm install -g yarn # 全局安装 Yarn 包管理器

```

### Claude Code

* 安装

```markup
npm install -g @anthropic-ai/claude-code
```

* 备份恢复 ~/.claude 可以查看历史用量，对话历史记录，token 等

### Codex CLI

* 安装

```markup
npm install -g @openai/codex
```

* 备份 ~/.codex：

  * 仅备份 ~/.codex/auth.json 即可无登录切换，[事实上官方也推荐这么做](https://github.com/openai/codex/blob/main/docs/authentication.md)

## 应用软件

通过 Homebrew 可以快速安装各种 GUI app：`brew install --cask 软件名标识符`

个人使用 Homebrew 安装的软件如下。

```markup
# 完整安装脚本见：https://gist.github.com/LiaoGuoYin/fe54e5e653ec3e2debbc02828189d651
# 开发工具包
echo "Installing development tools..."
brew install git
brew install vim
brew install curl
brew install wget
brew install tree
brew install jq

# 安装常用应用程序
echo "Installing applications..."
# 下文会详细介绍的 app
brew install --cask surge
brew install --cask 1password
brew install --cask baidunetdisk
brew install --cask downie
brew install --cask figma
brew install --cask handbrake
brew install --cask heynote
brew install --cask orbstack
brew install --cask raycast
brew install --cask rustdesk
brew install --cask spotify
brew install --cask typora
brew install --cask visual-studio-code
brew install --cask adobe-creative-cloud

# 其他常规软件
brew install --cask wechat
brew install --cask google-chrome
brew install --cask tencent-meeting
brew install --cask appcleaner
brew install --cask imageoptim
brew install --cask charles
brew install --cask postman
brew install --cask microsoft-office
brew install --cask telegram-desktop
brew install --cask proxyman
brew install --cask eudic
brew install --cask royal-tsx
brew install --cask iina
brew install --cask ogdesign-eagle
brew install --cask zerotier-one
brew install --cask tailscale
brew install --cask keka

```

下面捡几个详细介绍一下。

### OrbStack

几年前用过 Docker for Desktop 不是很好用，用着有种比较臃肿、很重的感觉。

OrbStack 是一个不错的轻量化替代方案。

注：M 系列 Mac 是 Arm 架构，实际测试下来有很多容器程序可能没有非 x86 镜像

![image-20250329121810545](https://cdn.liaoguoyin.com/images/new-mac-setup-configuration-guide_8.png)

### Git

代码版本管理。安装 Git，配置 commiter 信息。

```bash
git config --global user.name "coin"
git config --global user.email "liaoguoyin#live.com"

```

### VS Code

![Xnip2024-11-21_23-40-59](https://cdn.liaoguoyin.com/images/new-mac-setup-configuration-guide_9.png)

* 安装 code 命令行快速启动。运行 VS Code，打开命令面板（`command + shift + p`）输入 `Shell` 找到「Shell 命令: 在 PATH 中安装 code 命令」

* 安装插件

### Typora

![Xnip2024-11-21_23-39-14](https://cdn.liaoguoyin.com/images/new-mac-setup-configuration-guide_10.png)

* Markdown 编辑器。所见即所得。

### Raycast

![image-20250329142107898](https://cdn.liaoguoyin.com/images/new-mac-setup-configuration-guide_11.png)

替换 Spotlight 的瑞士军刀，一个软件能平替好几个软件。年度值得订阅的软件。

* 记录剪切板历史并在设备间同步，替换 Paste、PasteNow

* 文字 OCR，替换微信 OCR

* 整段翻译，替换欧陆词典、DeepL

* 窗口管理，替换 Magnet

* OpenAI Chat 能力

* 简单计算器，汇率实时转换

### HeyNote

![image-20250329133624445](https://cdn.liaoguoyin.com/images/new-mac-setup-configuration-guide_12.png)

* 文本暂存。临时存放一些代码片段、待办事项

### Windows App

![image-20250329141007877](https://cdn.liaoguoyin.com/images/new-mac-setup-configuration-guide_13.png)

* 远程桌面连接客户端，支持 RDP VNC 协议，微软为果子倾情打造

### Adobe

![image-20250329142542463](https://cdn.liaoguoyin.com/images/new-mac-setup-configuration-guide_14.png)

* 视频剪辑：After Effect，Premiere Pro

* 图片处理：PhotoShop，Lightroom

### Figma

![image-20250329140437622](https://cdn.liaoguoyin.com/images/new-mac-setup-configuration-guide_15.png)

* 原型设计工具。轻量 P 图

### TeamViewer

![image-20250329143354474](https://cdn.liaoguoyin.com/images/new-mac-setup-configuration-guide_16.png)

* 远程协助。帮朋友修修电脑软件文件
  * 可能会有被判断为商用然后被断开链接的问题，但通过远程组网不走 TeamViewer 服务器来解决
  * 通过走组网连接，TeamViewer 体验非常好
  * 已切换为 RustDesk + 自建中转节点

### LocalSend

![image-20250329140258702](https://cdn.liaoguoyin.com/images/new-mac-setup-configuration-guide_17.png)

* 跨平台文件传输工具。可以在局域网中多个设备传文件：比如 Ubuntu 传 Mac，Android 传 iPhone

### Spotify

![image-20250329140735278](https://cdn.liaoguoyin.com/images/new-mac-setup-configuration-guide_18.png)

* 听歌的。

  * 跨平台体验好，能用手机控制同账号下的其他设备端播放器

  * 开放能力好，还能通过 API 进行一些插件的开发（比如获取正在听的歌，切歌等操作）

  * 曲库还算完整。~比如能听某些404的歌~

### 1Password

![image-20250329141605255](https://cdn.liaoguoyin.com/images/new-mac-setup-configuration-guide_19.png)

* 密码管理工具。用了这个软件之后就几乎没记过密码，也不用担心被撞库了。个人觉得最值得花钱的软件，~GitHub Education EDU 还能白嫖~

## 数据迁移

### 微信

> 2025年9月16日更新，微信4.0和3.\*大版本变更，这两个版本中用户聊天文件夹结构发生了变化，以下迁移方法失效。但可以曲线迁移：先装 [3.8.10版本的微信](https://support.qq.com/products/292433/faqs-more?id=115035https://dldir1v6.qq.com/weixin/mac/WeChatMac_10_15.dmg)，按照以下目录迁移数据，再更新到4.0，官方4.0微信在初始化时会运行内部迁移数据的逻辑，[具体操作参考官方文档。](https://support.qq.com/products/292433/faqs-more?id=115035)

小而美的数据还是太多了，手机容量不够电脑来凑，消息同步到电脑上是个不错的选择。

**备份：**[Mac 微信文档存储在](https://blog.waynecommand.com/post/wechat-mac-backup) 以下目录，退出微信，压缩打包存档。`~/Library/Containers/com.tencent.xinWeChat/Data/Library/Application Support/com.tencent.xinWeChat/2.0b4.0.9`

**恢复：**重装 macOS 和微信之后，先运行一次微信并退出，初始化创建相关文件夹后，替换当前目录 `2.0b4.0.9/`

### Chrome 浏览器

* 插件配置

  * 油猴插件：屏蔽内容农场，自定义一些本地脚本优化网页

  * 沉浸式翻译：按需无感翻译

  * CookieCloud：多端 Cookie 同步

  * Wappalyzer：网站技术栈查看

  * Memos：快速发送笔记到 self-memos

* Chrome 多用户登录

  * 工作马甲

  * 生活日常马甲

### Mail

![](https://static.gridea.dev/98cd32d9-2e67-4904-bba1-f2457817463a/3UupwpWwt.png)邮件客户端用来用去还是自带的 Mail.app 最好用，唯一缺点就是每次换设备需要手动登录。

### SSH Config

备份恢复 SSH Config: ~/.ssh/config，并恢复公私钥：

```markup
Host xxx
    User root
    HostName x.x.x.x
    Port 22
    TCPKeepAlive yes
    ServerAliveInterval 30
    IdentityFile ~/.ssh/id_rsa

```

## 总结

对于系统配置、开发工具、应用软件，每个人的偏好和需求肯定不尽相同，按需调整即可。

啰嗦一句，保持良好的备份习惯尤其重要，配置什么的都是随便把玩的，但数据才是核心的。

不想捣鼓这些怎么办，Time Machine，你值得拥有。
