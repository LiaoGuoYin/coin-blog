---
title: 初窥代码规范
date: '2019-02-16T19:54:24+00:00'
published: true
feature: './assets/clean-code-standards-introduction_0.jpg'
---

在 [@czp](https://www.hiczp.com) 脆猪皮老哥 issues 的字里行间，我突然意识到编码规范的重要性。

> 适当的规范和标准绝不是消灭代码内容的创造性、优雅性，而是限制过度个性化，以一种普遍认可的统一方式一起做事，提升协作效率，降低沟通成本。

读了 Clean Code 和文末一些相关文章后，摘成这篇，后续慢慢补充..

## 命名格式

- 匈牙利命名法（Hungarian）：变量类型缩写 + 英文名称 `char cMyName`
- 下划线命名法（UnderScoreCase）：`student_id`
- 驼峰命名法（CamelCase \ PascalCase）：
  - 小驼峰命名法：除了第一个单词，其他字母都大写 `myStuentId`
  - 大驼峰命名法（帕斯卡命名）: 所有单词首字母大写 `MyStudentId`

## 命名风格

命名规则尽量与所采用的操作系统或开发工具风格保持一致：

- Windows 应用程序的标识符通常采用「大小写」混排，如 AddChild
- Unix 应用程序的标识符通常采用「小写加下划线」，如 add_child。别把这两类风格混在一起用

## 命名原则

- 代码命名不能以下划线开头或美元符结尾
- 代码命名避免纯拼音命名，严禁使用英文和中文拼音混合命名，更严禁直接中文命名
- 类名使用大驼峰命名法 TodayPromotion
- 方法名、变量名、参数使用小驼峰命名法 todayPromotion
- 常量命名全部大写，用下划线分隔，不用担心名字长
- 抽象类命名以 Abstract 或 Base 开头，异常类以 Exception 结尾，测试类以 Test 结尾，枚举类以 Enum 结尾
- 常量定义：long 或 Long 赋值时，用大写 L 结尾避免歧义，即格式为 `2L`
- 尽量让 IDE 自动命名，例如输入 `Scanner s` 再回车。好处是变量名本身就表示了变量类型，适用于这个变量没有其他含义、全局只有它、用完即丢的场景

## 代码格式

- 大括号的使用：如果大括号为空，则简洁地写为 `{}`，不需要换行；如果非空：
  - 左大括号前不换行
  - 左大括号后换行
  - 右大括号前换行
  - 右大括号后还有 else 等代码则不换行；表示终止的右大括号后必须换行
- 左小括号与字符之间不加空格，右小括号与字符之间不加空格。反例：`if( a == b )`
- if/for/while/switch/do 等保留字和括号之间必须加空格：`if (i == 0)`
- 任何二目、三目运算符左右两边必须加空格：`i = 5;`
- 注释的双斜线和注释内容之间有且只有一个空格，注释写在类名和方法前：`// 注释 1`
- `+ - * / %` 等运算符左右各要有一个空格
- 方法参数在定义和传入时，参数和逗号之后都有一个空格：`Method(arg1, arg2, arg3);`
- 不同逻辑、不同语义、不同业务的代码之间空一行，提高可读性

# Apple 模仿规范

iOS 开发不规范时，很容易满脑子雾水。苹果 SDK 里很多命名规范值得借鉴，Class、var、let、function 命名都可以参考 Camel Case：每个单词大写开头，第一个单词例外，类名首字母大写。

## 命名名称

- 自定义类别继承自父类时，类别名称以父类名称结尾：customViewController
- UI 元件的变量名和类有关：questLabel
- Array 对象名用复数：`var categories: [String]`
- Controller 的视图生命周期调度中，会有设置画面内容的函数，自定义 function 可以用 update 开头：`updateUI(){}`
- CustomTableViewControllerCell 中，[categories] 存储各种 UI 控件
- TableViewController 中，把文字渲染到 cell 内容的 function，可固定 func configure(cell: UITableViewCell, forItemAt indexPath: IndexPath) { }

## 静态化规范

- App 里有些负责特定功能的对象会在多个页面使用。可以把它声明成只会建立一次的类型常量，取名 shared 或 default，省去每次使用时重新生成的麻烦，也方便在各处访问，比如 URLSession.shared、UserDefaults.standard。
- 开发 iOS App 时，总有一些东西必须以字符串输入，比如 segue ID、cell ID、storyboard ID。只要一不小心打错，轻则功能失效，重则 App 闪退。解决办法是在 controller 里用 struct 定义 PropertyKeys，声明属性来存 segue ID 和 cell ID。

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

- 有信心的类型转换用：`tableView.dequeueReusableCell(withIdentifier: PropertyKeys.loverCell, for: indexPath) as! CustomTableViewCell`
- 其他情况用 optional binding 搭配 guard 语句转换：`guard let ...(省略) as? CustomTableViewCell else { }`

其他:

- 利用 `??(nil-coalescing operator)` 设定资料的预设值
- model controller 负责实现 model 的相关功能。比如做一个笔记 App，要处理 Note 的新增、删除、修改，可以单独定义 NoteController 实现相关功能，而不是把大量代码写在 view controller 或 note 里。

## ref

[模仿 Apple 教學範例，寫出一手好 Swift](https://www.appcoda.com.tw/write-better-swift/)

[Google 开源项目风格指南 (中文版)](https://zh-google-styleguide.readthedocs.io/en/latest/)

[Alibaba Java 开发手册](https://github.com/chjw8016/alibaba-java-style-guide)
