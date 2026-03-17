---
title: 初窥代码规范
date: '2019-02-16T19:54:24+00:00'
published: true
feature: 'https://cdn.liaoguoyin.com/images/clean-code-standards-introduction_0.jpg'
---

在 [@czp](https://www.hiczp.com) 脆猪皮老哥 issues 的字里行间，恍然认识到编码规范的重要性

> 适当的规范和标准绝不是消灭代码内容的创造性、优雅性，而是限制过度个性化，以一种普遍认可的统一方式一起做事，提升协作效率，降低沟通成本。

读了 Clean Code 和文章尾部的一些相关文章，摘成此篇，后续会不断补充..

## 命名格式

- 匈牙利命名法(Hungarian): 变量类型缩写 + 名称英文 `char cMyName`
- 下划线命名法(UnderScoreCase): `student_id`
- 驼峰命名法(CamelCase \ PascalCase):
  - 小驼峰命名法：除了第一个单词，其他字母都大写 `myStuentId`
  - 大驼峰命名法（帕斯卡命名）: 所有单词首字母大写 `MyStudentId`

## 命名风格

命名规则尽量与所采用的操作系统或开发工具的风格保持一致:

- Windows 应用程序的标识符通常采用 “大小写” 混排的方式，如 AddChild
- Unix 应用程序的标识符通常采用 “小写加下划线” 的方式，如 add_child  别把这两类风格混在一起用

## 命名原则

- 代码命名不能以 下划线开头 或 美元符结尾.
- 代码命名避免纯拼音命名，严禁使用英文和中文拼音混合命名，更严禁直接中文命名
- 类名使用大驼峰命名法 TodayPromotion
- 方法名、变量名、参数使用小驼峰命名法 todayPromotion
- 常量命名全部大写，下划线分隔开，不用担心名字长.
- 抽象类命名以 Abstract 或 Base 开头，异常类以 Exception 结尾，测试类以 Test 结尾，枚举类以 Enumm 结尾
- 常量定义: long 或 Long 定义赋值时，用大写的 L 结尾避免歧义，即格式为: 2L
- 尽量 IDE 自动命名，例如输入 Scanner s , 再回车，好处是：变量名本身就表示了变量类型，它适用于这个变量没有其他含义，且全局只有它、用完即丢的变量，不需要为他起名.

## 代码格式

- 大括号的使用：如果大括号为空，则简介的写为 {}，不需要换行；如果非空:
  - 左大括号前不换行
  - 左大括号后换行
  - 右大括号前换行
  - 右大括号后还有 else 等代码则不换行；表示终止的右大括号后必须换行
- 左小括号与字符没有空格，右小括号与字符没有空格，反例: if(空格 a == b 空格)
- if/for/while/switch/do 等保留字和括号之间必须加空格: if(i == 0)
- 任何二目、三目运算符的左右俩边必须加空格: i = 5;
- 注释的双斜线和注释之间有且只有一个空格，注释写在类名和方法前. // 注释 1
- `+ - * / %` 等运算符号左右各要有一个空格.
- 方法参数在定义和传入时，在参数和逗号之后都有一个空格: Method(arg1, arg2, arg3);
- 不同逻辑、不同语义、不同业务的代码之间一行空格来提高可读性.

# Apple 模仿规范

iOS 开发不规范，满脑子雾水，苹果 SDK 中很多规范值得借鉴，规范就能解决这个问题，Class，var，let，function 命名: Camel case 命名：每个单词大写开头，第一个单词例外。（类首字母大写)

## 命名名称

- 自定义的类别继承自父类时，类别名称以父类名称结尾: customViewController
- UI 元件，变量名和类有关: questLabel
- Array 对象名加复数: var categories: [String]
- Controller 的视图生命周期调度中，会有设定画面内容的函数，自定义 function 可以 update 开头: updateUI(){}
- CustomTableViewControllerCell 中，[categories] 存储各种 UI 控件
- TableViewController 中，把文字渲染到 cell 内容的 function，可固定 func configure(cell: UITableViewCell, forItemAt indexPath: IndexPath) { }

## 静态化规范

- App 里有些负责特定功能的物件会在多个页面使用。可将它宣告成只会建立一次的型别常数 取名 shared 或 default，省去每次使用时重新生成的麻烦，并享有任何地方皆可方便存取的好处，就像以下例子的 URLSession.shared，UserDefaults.standard
- 开发 iOS App 时，总有某些东西是我们无法避免，必须以字串输入的，比方 segue ID，cell ID，storyboard ID 等。然而只要你一不小心打错，将产生非常可怕的后果，轻则功能失效，重则让 App 闪退，地球毁灭 ！解决：在 controller 里以 struct 定义型别 PropertyKeys，宣告属性储存 segue ID 和 cell ID

example

```
struct PropertyKeys {
    static let athleteCell = "AthleteCell"
    static let addAthleteSegue = "AddAthlete"
    static let editAthlete = "EditAthlete"
}
struct SegueID {
    static let topPicker = "TopicPickerController"
    static let mainShowDetail = "ShowDetail"
    static let mainAddNew = "AddNew"
}
```

## 可选类型处理

- 有信心的类型转换用: tableView.dequeueReusableCell(withIdentifier: PropertyKeys.loverCell, for: indexPath) as! CustomTableViewCell
- 其他的用 optional binding 搭配 guard 语句转换: guard let ...(省略) as? CustomTableViewCell else { }

其他:

- 利用 `??(nil-coalescing operator)` 设定资料的预设值
- model controller – 负责实现 model 的相关功能。比方你在做一个笔记 App，要处理 Note 的新增，删除，修改等，你可以另外定义 NoteController 实现相关功能，而不用把大量的程式写在 view controller 或 note 里。

## ref

[模仿 Apple 教學範例，寫出一手好 Swift](https://www.appcoda.com.tw/write-better-swift/)

[Google 开源项目风格指南 (中文版)](https://zh-google-styleguide.readthedocs.io/en/latest/)

[Alibaba Java 开发手册](https://github.com/chjw8016/alibaba-java-style-guide)
