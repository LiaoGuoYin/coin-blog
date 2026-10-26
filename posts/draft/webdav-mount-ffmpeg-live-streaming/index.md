---
title: webdav 网盘挂载+ffmpeg 推流 live 直播间
date: '2023-07-05T15:59:22+00:00'
published: false
feature: ''
---

## 需求概述

作为一个 live 演唱会拥趸，我听歌一直更偏爱现场版。最近尤其喜欢下载一整场 live 演唱会挂着，一边听歌一边干活。

TODO live 感想

有时候一场听完，活也差不多干完了。某天突然冒出来一个念头：应该也有不少和我一样的 live 爱好者，喜欢把现场版当工作背景音。那能不能做一个直播间，让想听的人点进来就能挂着听？

于是需求雏形就出来了：通过直播平台（比如 bilibili）推送演唱会音视频流，让其他粉丝进直播间就能直接听。

为了把这条链路跑通并尽量自动化，我想把手里的 2004 年活出生命演唱会推到直播间里，让普通 bilibili 用户点进来就能看到。

要完成音视频推流，大概需要这些步骤：

- 提前下载演唱会资源
- 打开 [直播间管理界面](https://link.bilibili.com/p/center/index#/my-room/start-live)，获取 RTMP 服务地址
- 用程序把视频解码、切片、封装成 RTMP 格式并发送给 bilibili 服务器
- 交给 bilibili CDN 处理观众侧拉流

## 资源方案

BT

PT

## 存储方案

资源存在本地当然最简单。但是资源一多，本地硬盘容量就开始变成问题。

> 其实不太建议用本地机器推流，除非你能保证家里网络足够稳定。本地其他机器一下载大文件，把带宽吃满，推流基本就开始抖。
>
> 更常见的做法是买台云服务器，10Mbps 带宽通常就够用。
>
> 但服务器又涉及硬盘，云服务器硬盘一般都不便宜。

既然本地盘和云服务器硬盘都不太舒服，那就自然会想到云上存储。

常见方案大概两类：**对象存储** 和 **云盘存储**。

### 对象存储 R2

Cloudflare R2 可以配合 Worker 做一层封装。

[Public buckets · Cloudflare R2 docs](https://developers.cloudflare.com/r2/buckets/public-buckets/)

[rclone: persist break the support of the existing configuration · Issue #2919 · ScoopInstaller/Main (github.com)](https://github.com/ScoopInstaller/Main/issues/2919)

### WebDAV 云盘

云盘方案的好处：

- 通用资源秒传，资源管理方便很多
- 可以利用在线资源本身的存储能力，少买很多硬盘
- 配合 WebDAV / rclone，可以把远端资源伪装成本地文件路径

#### 115 云盘 WebDAV

rclone 改版 WebDAV：[gaoyb7/rclone-release: rclone 改版，兼容支持 115 网盘 (github.com)](https://github.com/gaoyb7/rclone-release)

> 115 云盘多端登录限制很严格，但可以通过导出 cookie 的办法共用。
>
> 由于 115 网页端上传大文件有限制，而官方 cookie editor 又可能因为 Chrome 内核版本异常装不上，所以可以试试旧版 cookie editor：[Release v1.10.1 · Moustachauve/cookie-editor (github.com)](https://github.com/Moustachauve/cookie-editor/releases/tag/v1.10.1)

rclone WebDAV 挂载依赖 FUSE：

- Linux 需要安装 fuse 依赖
  - Debian / Ubuntu：`apt-get install -y fuse3`
  - RedHat / CentOS：`yum install -y fuse3`
- Windows 需要安装 WinFsp：[https://winfsp.dev/](https://winfsp.dev/)
- macOS 需要安装 macFUSE：[https://osxfuse.github.io/](https://osxfuse.github.io/)

[rclone mount 文档](https://rclone.org/commands/rclone_mount/)

```bash
# Ubuntu
rclone mount -v \
  --allow-other \
  --read-only \
  --vfs-read-chunk-size=4M \
  --buffer-size=32M \
  115: /mnt/115 \
  --daemon

# Windows
.\rclone.exe mount -v --read-only --vfs-read-chunk-size=4M --buffer-size=32M --network-mode 115: X:
```

macOS 上我当时实测暂时没跑通：

```text
CoinMAC:/Users/leocoin % rclone2 mount
Error: unknown command "mount" for "rclone"
Run 'rclone --help' for usage.
You could use 'rclone selfupdate' to get latest features.

2023/07/06 00:57:02 Fatal error: unknown command "mount" for "rclone"
```

#### 阿里云盘 WebDAV

TODO

## 推流方案

简单调研下来，在线视频推流 / 切片大概有几种路线：kplayer-go、ffmpeg、直播姬（bilibili 官方直播程序）。

### 直播姬

TODO

### kplayer-go

优点：开源，方案相对开箱即用，有插件市场，可以自己魔改，也有一些 API 方便开发者 DIY。甚至有人基于 API 做了网页管理面板，不过我不建议购买，没必要。

缺点：我测试了一段时间，经常遇到莫名其妙断流，直播直接中断。

#### 基本用法

修改 `config.json`，然后运行：

```bash
kplayer start play --daemon
```

配置示例：

```json
{
  "version": "2.0.0",
  "resource": {
    "lists": [
      "/mnt/d/张学友 91 演唱会.mkv"
    ]
  },
  "play": {
    "play_model": "loop"
  },
  "output": {
    "lists": [
      {
        "path": ""
      }
    ]
  }
}
```

### ffmpeg

ffmpeg 足够灵活、强大、稳定，资料也多，**还可以用显卡做硬件加速**。

它最大的优点和缺点都是过于灵活：能做的事情太多，参数也多，第一次用很容易把握不住（doge）。

#### 基本用法

```bash
ffmpeg -re -i ${video} -preset ultrafast -vcodec libx264 -g 25 -b:v ${video_rate} -c:a aac -b:a ${audio_rate} -strict -2 -f flv ${rtmp}
```

#### 硬件加速

```bash
ffmpeg -hwaccel cuvid -c:v h264_cuvid -i input.mp4 -c:v h264_nvenc -b:v 2048k -s 1920x1080 output.mp4
```

参数大概是：

- `-hwaccel cuvid`：使用 cuvid 做硬件加速
- `-c:v h264_cuvid`：使用 h264_cuvid 解码
- `-c:v h264_nvenc`：使用 h264_nvenc 编码
- `-b:v 2000k`：视频码率，值越大越清晰，压力也越大
- `-s 1920x1080`：输出分辨率
- `-bufsize 6000K`：缓冲区大小
- `-maxrate 5000K`：最大码率
- `-preset slow`：编码预设
- `-pix_fmt p010le`：10bit 输出像素格式，新一点的硬件才支持

## 服务器无人值守

Ubuntu 示例：

```bash
live_directory="/mnt/115/Coin/livesbot/jacky"
rtmp="rtmp://live-push.bilivideo.com/live-bvc/?streamname=你的直播流名称&key=你的推流密钥&schedule=rtmp&pflag=1"
video_rate="3000k"
audio_rate="192k"

while true
do
    cd "${live_directory}" || exit 1
    for video in $(find ./ -type f | shuf)
    do
        ffmpeg -re -i "${video}" -preset ultrafast -vcodec libx264 -g 25 -b:v "${video_rate}" -c:a aac -b:a "${audio_rate}" -strict -2 -f flv "${rtmp}"
    done
done
```

Windows 示例：

```powershell
$live_directory = "X:\Coin\livesbot\jacky"
$rtmp = "rtmp://live-push.bilivideo.com/live-bvc/?streamname=你的直播流名称&key=你的推流密钥&schedule=rtmp&pflag=1"
$video_rate = "3000k"
$audio_rate = "192k"

while ($true) {
    Set-Location -Path ${live_directory}
    $videos = Get-ChildItem -Path .\ -File | Sort-Object

    foreach ($video in $videos) {
        ffmpeg -re -i ${video} -preset ultrafast -vcodec libx264 -g 25 -b:v ${video_rate} -c:a aac -b:a ${audio_rate} -strict -2 -f flv ${rtmp}
    }
}
```

### 优化

https://www.bilibili.com/read/cv9687198/

### streamlink

https://streamlink.github.io/plugins.html

## DIY 方案

- [ ] 加字幕（ffmpeg 叠字幕图片）

```bash
ffmpeg -re -i ${video} -i ${image} -filter_complex overlay=W-w-5:5 -preset ultrafast -g 25 -b:v ${video_rate} -c:a aac -b:a ${audio_rate} -strict -2 -f flv ${rtmp}
```

- [ ] 插件改变 ffmpeg 数据流，实现快进快退
- [ ] 展示时间、歌曲名
- [ ] 同步原码率直播（格式要求严格）

```bash
ffmpeg -re -i input.mp4 -c:v copy -c:a copy -f flv rtmp://xxx.com/密钥
```

`input.mp4` 可以是本地路径，也可以是 WebDAV 挂载出来的路径。

## 可能遇到的问题 & Tips

### 运行一段时间后直播断流

可能是本地切片程序出了 bug，不继续往外推流；也可能是中间网络卡顿，导致 bilibili 平台长时间收不到数据流，以为直播结束，于是关掉 RTMP 连接。

### bilibili 直播间实时人数不直接展示

可以通过 API 查看，替换最后的 `room_id`：

```text
https://api.live.bilibili.com/room/v1/Room/get_info?room_id=8208210
```

### 非实时流有时突然加速、变音或卡顿

TODO

可以先尝试调整视频码率，3K 左右一般就能满足基础分辨率推流。

## 版权声明

TODO

## 参考

- [视频和视频帧：ffmpeg 的 RTMP 推流 - 知乎](https://zhuanlan.zhihu.com/p/73984438)
- [FFMPEG 使用显卡加速转码 - 知乎](https://zhuanlan.zhihu.com/p/631378581)
- [audio_video_streaming/article/047-ffplay 工具命令使用技巧.md at main · 0voice/audio_video_streaming · GitHub](https://github.com/0voice/audio_video_streaming/blob/main/article/047-ffplay%E5%B7%A5%E5%85%B7%E5%91%BD%E4%BB%A4%E4%BD%BF%E7%94%A8%E6%8A%80%E5%B7%A7.md)
