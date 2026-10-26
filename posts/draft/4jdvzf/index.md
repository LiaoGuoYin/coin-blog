---
title: null
date: '2025-07-27T12:45:00+00:00'
published: false
feature: ''
---
## 小型家电无法正常充电

*   冰箱除味剂
    
*   泵水器
    
*   USB-B 口的化妆镜
    
*   随身 WiFi
    

## 一开始怀疑的原因

一开始怀疑是充电头功率不够，或者 C 口线不是全功能线。

## 真正原因：协议细节区别

CC 数据线期望通过 CC 口协商充电上下游关系，但这些小电器的母座不支持，协商失败后，上游就不会对外放电。

USB-A 转 USB-C 数据线没有这套协商过程，直接对外放电，反而能用。

## 解决方法

*   换成 USB-A 转 USB-C 线
    
*   使用转换头、功率表强制协调
    
*   替换端子：[https://sspai.com/post/73056](https://sspai.com/post/73056)
    

## 清理非全功能数据线

TODO

### 识别方法

TODO

### 备用策略

TODO

## Ref

*   [https://www.chongdiantou.com/archives/161306.html](https://www.chongdiantou.com/archives/161306.html)
    
*   [https://www.ti.com.cn/cn/lit/eb/zhcy216/zhcy216.pdf?HQS=app-ipp-pwr-denusbc-bhp-ebook-null-cn](https://www.ti.com.cn/cn/lit/eb/zhcy216/zhcy216.pdf?HQS=app-ipp-pwr-denusbc-bhp-ebook-null-cn)
    
*   [https://www.xiaohongshu.com/explore/66dfb40f0000000012013ebc?xsec\_token=ABGz9aG8jfPhKnCf2576wsNHigciNSJlu74a5yMMtRmNw=&xsec\_source=pc\_user](https://www.xiaohongshu.com/explore/66dfb40f0000000012013ebc?xsec_token=ABGz9aG8jfPhKnCf2576wsNHigciNSJlu74a5yMMtRmNw=&xsec_source=pc_user)
    
*   [https://www.xiaohongshu.com/explore/642fa83c00000000110131ba?xsec\_token=ABuAY9hEmgBtFQ-GYdav3C6T3wIUoH5VwAobSpp4sWxn0=&xsec\_source=pc\_search&source=web\_search\_result\_notes](https://www.xiaohongshu.com/explore/642fa83c00000000110131ba?xsec_token=ABuAY9hEmgBtFQ-GYdav3C6T3wIUoH5VwAobSpp4sWxn0=&xsec_source=pc_search&source=web_search_result_notes)
