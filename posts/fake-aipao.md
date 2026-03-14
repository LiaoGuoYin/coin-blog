---
title: 阳光体育长跑 APP 模拟技术探究
date: '2019-05-10T11:49:19+00:00'
published: true
feature: 'https://cdn.liaoguoyin.com/images/fake-aipao_0.jpg'
---

探究阳光体育长跑 APP 的模拟技术实现，包括 GPS 位置模拟和运动数据伪造的各种方法。

<!-- more -->

上次写下 [玩转 Android 刷机 Root](https://liaoguoyin.com/post/fake-xxt/) 收益颇多。其中最最重要的是认识了 哲 ♂ 学导师 czp，同时，给自己挖了坑 `阳光体育长跑`

关于这个阳光体育长跑，除了骑自行车、滑轮滑、踩滑板，应该还有几个打开（偷懒）姿势

# 模拟运动

一般来说，长跑 App 都调用本机 `GPS定位` 来实现运动记录（还有种是传感器定位，但较少 本文不讨论）。那么我们只要让手机 `GPS信号` 模拟动起来，问题就解决了。

关于模拟运动，介绍俩款 App：`Daniu`、`Fake Location`

这应该是现在市面上最广泛的所谓一块钱垃圾代跑的解决思路，唯一的麻烦的是 Root 后才能奔放:@(不出所料)

模拟定位和运动的操作简单，摸摸 App 就会，只是个思路，就贴不所谓的教程了。

关于 Root 刷机，可以参考这篇：[扒开 Android 刷机 Root 的衣服](https://liaoguoyin.typlog.io/2019/android-root)

## App 虚拟定位

### Daniu

[Daniu1.1.8.apk][3] 之前的版本免费。虽然免费版在这里共享出来了，还是建议支持作者吧，不贵。

![Daniu root 之后，开启新世界](https://cdn.liaoguoyin.com/images/fake-aipao_1.png) ![Fake Location 付费版](https://cdn.liaoguoyin.com/images/fake-aipao_2.png)

### Fake Location

[Fake Location.apk][5] 比于 Daniu **有步频模拟**。更重要的是，不用 Root 就能模拟运动（但是对某些 App 模拟不上，应该是权限问题， Root 就能完美解决），没有白嫖版，请支持作者。

（XJU西交体育是创高的产品，亲测 Daniu 模拟定位失败。但 Fake Location 不 Root 模式模拟定位，过阳光体育

### 安卓模拟器

Apple boy 苦于没有 Root 的安卓机。想过 Root 安卓模拟器，按网上的办法弄 n 次都失败，就丢坑。

不过，用安卓模拟器刷长步，也不是没有办法。

夜神模拟器有个自带的模拟位置，没有模拟扫街。那么我们就小范围地 连续切换 **模拟位置** 点，GPS 同样变化。

只要位置变化不太大，就有了运动的效果，同时在这里结合模拟器的摇一摇，甚至能模拟出步频出来。

这个操作效率不高，但是非常有意思，同时操作的时候需要把握点之间合适的距离，就能模拟运动和抖动。@自救默示录 [给出了比较硬核的推导（其实就是地球上经纬度算直线距离，只是我地理和数学都要丢了反三角都看不懂了，那就硬核把。）](https://www.cnblogs.com/delicious-hys/p/10611401.html)

## My Android Tools Hook 本地数据库

本方法需要 Root。[My Android Tools.apk][7] 又称写轮眼，它能管理 Android 的四大基本组件。说句人话，能实时修改 App 里各项本地数据数据库。

大致原理是：这个写轮眼，能修改你跑了多少 km，跑了多少 s。修改完之后再打开阳光体育，App 能自动检测到变化后的数据，然后触发上传，直接上传了修改后的记录。

坦白说这个也是楼上的 @自救默示录 的思路，[这里有个比较详细的操作教程](https://www.bilibili.com/video/av47968737)

# 其他问题

## 步频问题

通用的记步原理和手机传感器的加速度有关，你会发现你要是骑车刷长跑的话，步数会为 0。

要想在上传成绩中，拥有步数。有软办法和物理办法：

- 软办法：
  - 在安卓模拟器中，可以用摇一摇摇出步数来
  - 在付费版 Fake Location（Root模式） 中模拟步频
- 物理办法：
  - 当然是一直甩手一直摇摇摇
  - 摇步器

![Shaking](https://cdn.liaoguoyin.com/images/fake-aipao_3.png) ![Shaking2](https://cdn.liaoguoyin.com/images/fake-aipao_4.png)

## 多开问题

[多开分身.apk][9] 一台手机上能登陆多个微信，就不用每天换着登陆微信再验证阳光体育

> 这里啰嗦一句，我之前手机配置低，多开直接卡死。每天要登陆 n 个微信号切换阳光体育，解决方案是：`按键精灵`，录制每个号的微信的密码账号输入脚本

多开之后，全局模拟运动，就能一口气同时跑 n 个，缺点显而易见：手机配置吃不消

针对此解决办法是：电脑开安卓模拟器（推荐夜神模拟器，自带模拟位置） 或 手机云（金手指、腾讯WeTest）

# AiPao 脚本

接下来就是解放双手的压轴货了

你只需要会安装配置 JRE 环境，就能一拳一个阳光体育

## 打开姿势

1. [官网下载 JRE](https://www.oracle.com/technetwork/java/javase/downloads/jre8-downloads-2133155.html)
2. 配置 JRE 环境变量
3. 下载 [Aipao_v1.2.4 脚本](https://github.com/LiaoGuoYin/aipao/releases/) 并解压，双击 start.bat (macOS Terminals下: bash start.bat)

看到输入提示后，输入 IMEICode 就好了：

> 那么获取 IMEICode：
>
> 1. 安装抓包软件。Android: [Packet Capture.apk][12]
> 2. 先打开抓包软件（并安装 SSL），再打开阳光体育
> 3. 微信登陆
> 4. 去抓包的软件中筛选 client4.aipao.me 的请求，在响应体中找到 IMEICode（若多次抓不到: 来回切换几次飞行模式, 再打开阳光体育

**回车看到下图：那，你已经精通一拳一个阳光体育了**

![Result](https://cdn.liaoguoyin.com/images/fake-aipao_5.png)

> 只要不登陆 阳光体育App，IMEICode 就长期有效，每天鼠标一点就跑完了

更新了 GUI 版 + 批量跑，稍微友好一点，请到 GitHub 自取

## About

[Aipao 本项目开源](https://github.com/LiaoGuoYin/aipao) Author: LiaoGuoYin

核心 API 出自 [zyc199847](https://github.com/zyc199847/Sunny-Running) 逆向成果，我只是搬个砖写了个半吊子脚本

如果对原理和拓展有兴趣可以大概看看项目的 issues（其实就是构造并 POST 上传成绩的 HTTP 请求，只是过程不止一步，还有加密

## More

实际上我写的非常菜b，在同性交友 gayhub 上，甚至已经有人写出一套 web。在网页上批量添加管理多人 IMEICode，每天服务器自动 crontab，失效就邮箱或微信喵酱推送提醒。

思路很巧妙很骚。但是封装成一套在淘宝接单恰烂钱就有点..（酸

除了 crontab，还给出一个定时任务的思路，Serverless Cloud Function。你甚至都不需要服务器成本，就能让每天按时运行+提醒。想想就很很幸福噢。好了，不说太多了，没我了

## Tail

代跑在全国已经烂大街了，本文只是为了记录，分享个人解决问题的办法，希望和小伙伴交流一二，自行模拟产生的结果概不负责。

拒绝提供技术支持，如果非要问出 bug 怎么办（百香果请记得加冰，奶绿记得加椰果

如果有帮助到你，可以考虑赏一杯 [卡布奇诺](https://liaoguoyin.com/donation)

  [3]: https://liaoguoyin.com/usr/uploads/2019/05/2205838584.apk
  [5]: https://liaoguoyin.com/usr/uploads/2019/05/2521244422.apk
  [7]: https://liaoguoyin.com/usr/uploads/2019/05/900624283.apk
  [9]: https://liaoguoyin.com/usr/uploads/2019/05/2760109578.apk
  [12]: https://liaoguoyin.com/usr/uploads/2019/05/3703074831.apk
