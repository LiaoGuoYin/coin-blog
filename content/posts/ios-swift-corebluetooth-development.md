---
title: iOS Swift CoreBluetooth 蓝牙开发入门
date: '2020-10-15T11:33:36+00:00'
published: true
feature: 'https://cdn.liaoguoyin.com/images/ios-swift-corebluetooth-development_0.jpg'
---

基于 iOS CoreBluetooth 框架的蓝牙开发实践，从 BLE 基础到实际开发经验分享。

<!-- more -->

因为一点机缘巧合，看了一下 iOS [CoreBluetooth 文档](https://developer.apple.com/bluetooth/)，做了一个和 [蓝牙交互传数据的 App](https://github.com/LiaoGuoYin/Bluetooth-iOS)

网上关于 iOS Swift 蓝牙开发的资料很少，遇到问题一度非常苦恼，好在最后把一点东西最基本的啃过来了，这里结合自己的一丁点儿开发经验方便以后查阅，也希望能给看到这里的朋友一点帮助。

## CoreBlueTooth 蓝牙基础

低功耗蓝牙 Bluetooth Low Energy (BLE) 指蓝牙 4.0，特色是 **小数据、低功耗**，而在蓝牙4.0 以前是经典蓝牙，[iOS Core Bluetooth 基于 Bluetooth 4.0 协议 ](https://developer.apple.com/library/archive/documentation/NetworkingInternetWeb/Conceptual/CoreBluetooth_concepts/AboutCoreBluetooth/Introduction.html#//apple_ref/doc/uid/TP40013257)，兼容 iPhone 4S+ 的机器。

一些 iOS 蓝牙开发基本概念：

- Central: 中心设备，可以理解为对外扫描蓝牙的设备，一般指本机
- Peripheral: 外围设备，可以理解为蓝牙外部硬件设备
- Services: 服务，可以理解为蓝牙低功耗硬件设备所提供的 **多个功能集合**
- Chracteristics: 特征，一个特征对应了 **一个功能**

Charateristics 的功能一般由以下三种能力组合而成：

1. Read: 读，表示设备为这个特征设置，可以被其他设备读取
2. Write: 写，表示设备可以被写入数据
3. Notify: 订阅/通知，该特诊对应的值可以被其他设备订阅，一旦本机对该值进行修改，就会把修改结果通知给订阅端

一图胜千言，用 `Bluetility` 这个工具能很好的帮助理解蓝牙的基本概念。

![Bluetility-macOS App](https://cdn.liaoguoyin.com/images/ios-swift-corebluetooth-development_1.jpg)

## CoreBlueTooth 蓝牙连接流程

中心设备 C: Central, 外围设备 P: Peripheral

蓝牙连接的主要代码逻辑如下：

1. 创建并开启中心设备 C
2. 开始 **扫描** 广播，寻找外围设备 P
3. 中心设备 C 扫描到外围设备 P 发出的广播后。回调用中心设备 C 的代理方法，来连接外围设备 P
4. **连接** 到外围设备 P 后。回调中心设备 C 的代理方法，来搜寻此外围设备 P 提供的服务
5. 通过 UUID 的比对找到合适的服务后。回调中心设备 C 的代理方法，来搜寻该服务下所有的特征
6. 找到合适的特征后。回调中心设备 C。的代理方法，通过 UUID、特征属性等筛选找到目标特征
7. 找到合适的写、读特征后。**手动调用中心设备 C 的方法对对应的特征进行订阅、写、读**，实现和外部设备 P 的数据收发读功能

## Demo Practice

2019 WWDC 上放出了一个经典蓝牙开发的 [Demo](https://developer.apple.com/documentation/corebluetooth/using_core_bluetooth_classic)，对着代码学习就完事了

1. 新建工程
2. 添加 Info.plist 确保用户能授权蓝牙权限

   iOS 12:  [`NSBluetoothPeripheralUsageDescription`](https://developer.apple.com/documentation/bundleresources/information_property_list/nsbluetoothperipheralusagedescription)

   iOS 13+: [`NSBluetoothAlwaysUsageDescription`](https://developer.apple.com/documentation/bundleresources/information_property_list/nsbluetoothalwaysusagedescription)

   ![Apple Develop BLE](https://cdn.liaoguoyin.com/images/ios-swift-corebluetooth-development_2.png)
3. 编写代理方法：实现 `CBCentralManagerDelegate`、`CBPeripheralDelegate ` 方法

## 可能遇到的问题

个人在写项目过程中遇到过三个问题：**数据分包收发问题、编码解码问题、显示数据换行符的问题**

### 编码解码问题

在本项目中，App 和蓝牙交互的是文本字符串。可以确定的是，我们收发的文本数据发送之前都会被序列化（也可理解为编码）为二进制字节流，真正传输的数据都是字节流。而把一段文本序列化编码为怎样的二进制的字节流就有讲究了。

从 '字符串' 到 二进制，前人已经给出了多种编码方式：从最开始的 ASCII，到 GBK，再到后来的 Unicode，都是编码解码的解决方案，每一种编码都对应了一定的规则，可能是变长编码、可能编码码元不一致等。所以，需要注意的是，什么编码就用什么解码。否则就会出现字符集不一致导致的乱码问题。

当然，所以出于验证的角度，万物皆可 ASCII 解码（后来的编码都兼容 ASCII，其中的英文和字母一定可以被正常地解码，作为验证方案，已经很足够了）

在本项目中，硬件部分用 U 盘存储了 GBK 编码字符的 CSV 文件（其实主要是为了能在默认编码为 GBK 的垃圾串口调试程序 XCOM 上能看到正确的字符串），因此在 iOS App 这边就需要用 GBK 来解码来反序列化解码，而 iOS 这边本身没有直接提供 GBK 编码，最后通过 GB18030(GBK 的父集) 来解决了 GBK 解码的问题。

```swift
let GBK_ENC_RAWVALUE = CFStringConvertEncodingToNSStringEncoding(CFStringEncoding(CFStringEncodings.GB_18030_2000.rawValue))
let UTF8_ENC_RAWVALUE = String.Encoding.utf8.rawValue
let USING_ENC = GBK_ENC_RAWVALUE

if let tmpString = String(data: actualData, encoding: String.Encoding(rawValue: USING_ENC)) {
  print("This is str encoded with GBK \(tmpString)")
}
```

### 分包问题

因为蓝牙的低功耗的特色，蓝牙收发数据是有长度限制的。大数据需要被拆分为小数据，才能保证数据能被正常完整地接受。其实下面的解决思路有点处理 TCP 上层应用层的拆包、粘包问题的那味道了。

假设 C 是中心设备，P 是外部硬件蓝牙设备

1. C 发数据：发送数据超过了 Maxmium Transmission Unit (MTU) 是一定涉及到分包的，否则数据就收不到完整的数据，甚至直接被丢掉。一定要注意的是：

   - 数据分包要基于 min(MTU, sendData)
   - 发送间隔要足够: Interval Min >= 20ms
2. P 收数据：假设 C 这边发出的数据是直接分包发送的，那么到达的数据顺序可能会不一致，简单的拼接操作得不到准确的数据。解决思路：

   - 运用蓝牙协议栈中的头部，解析蓝牙数据的头部 [Data](https://inst.eecs.berkeley.edu/~ee290c/sp18/lec/Lecture7A.pdf) [iOS蓝牙开发如何更好地收发数据](https://www.jianshu.com/p/1f41e6fe06bf)
   - A 按序将分包后的数据间隔 0.n 毫秒发送，异步操作发送数据。同时，在分包数据里面加上标志位，如 START\END，方便接收方知道消息的开始和结束，明确数据边界。

### 数据换行符问题

在 Windows，Classic macOS，Unix 及其衍生系统中，换行符是有差别的:

|        OS        | Terminator | Terminator ASCII Number(Hexdecimal) |      意义      |
| :--------------: | :--------: | :---------------------------------: | :-------------: |
| Unix/macOS(新版) |     \n     |                0x0A                |    Line Feed    |
|  Classic macOS  |     \r     |                0x0D                | Carriage return |
|   Windows/DOS   |    \r\n    |              0x0D 0x0A              |      CRLF      |

注: 在 [Swift String](https://developer.apple.com/documentation/swift/1541053-print) 中，默认的换行符是 newline(\n)。而要想在 Windows 的串口程序（XCOM for Windows）控制栏上显示正确地换行，需要在发送数据中每一行结尾处手动加上 `\r`

在 ASCII 中，回车和换行是不同的字符。0x0A 是回车，即光标移动到本行的最左面；0x0D 是换行，即光标移动到下一行。

关于换行和回车，有三种不错的解释：

> 回车 \r ：本义是光标重新回到本行开头，r 的英文 return，控制字符可以写成 CR，即 Carriage Return
> 换行 \n ：本义是光标往下一行（不一定到下一行行首），n 的英文 newline，控制字符可以写成 LF，即 Line Feed

> 回车，横向操作 carriage return CR，这个名字可能是指打印头像运作起来像奔跑的马车
> 换行，纵向操作 line feed LF, 被吃掉一行

> 回车中的 "车" 指的是纸车，带着纸一起左右移动的模块; 当开始打第一个字之前，要把纸车拉到最右边，上紧弹簧，随着打字，弹簧把纸车拉回去; 每当打完一行后，纸车就完全收回去了，所以叫回车。
> 换行的概念就是：打字机左边有个 "把手", 往下 扳动一下，纸会上移一行

## Related

以下文章或工具对理解蓝牙的基本知识和 **模拟蓝牙调试** 非常有用

工具：

1. macOS：[Bluetility](https://github.com/jnross/Bluetility)
2. iOS: [LightBlue](https://apps.apple.com/us/app/lightblue/id557428110)

BLE：

1. [BLE技术揭秘](http://doc.iotxx.com/BLE技术揭秘)
2. [Swift 连接 BLE 蓝牙打印机](https://www.kikt.top/posts/ios/swift/swift-connect-ble-printer/)
3. [Apple-BLE-Demo](https://developer.apple.com/documentation/corebluetooth/using_core_bluetooth_classic)

换行符：

1. [CRLF](https://www.jianshu.com/p/8d33019d1c69)
2. [调试查看](https://learnku.com/articles/22249)
3. [回车和换行](https://www.ruanyifeng.com/blog/2006/04/post_213.html)
4. [跨平台换行符](https://developer.apple.com/library/archive/documentation/OpenSource/Conceptual/ShellScripting/PortingScriptstoMacOSX/PortingScriptstoMacOSX.html)
5. [为什么 &#34;回车键&#34; 要被称作 &#34;回车键&#34;](https://zhuanlan.zhihu.com/p/69176819)
