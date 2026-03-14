---
title: 使用 Clang-format 统一团队 C++ 代码风格
date: '2025-04-11T18:47:48+00:00'
published: true
feature: ''
---

使用 Clang-format 工具在团队中统一 C++ 代码风格，提高代码可读性和维护性。


在团队中，统一代码风格可以有效提高内部项目可维护性，避免低级编码错误。

为实现这一目标，三板斧如下：

1. 确定格式化规范
2. 选择格式化工具，编写调试配置文件
3. 将规范集成到开发的各个流程中（编码开发，代码管理，编译打包），并跟进反馈修正

## 1. 确定格式化规范

代码格式化规范已经非常标准化。常规标准有 LLVM，Google，Webkit 等。

笔者组内已有 C++ 编码规范：

![组内 C++ 编码规范](https://cdn.liaoguoyin.com/images/clang-format-team-cpp-code-style_1.png)

常见的格式化规范要求涉及如下部分：

1. 命名规范

- 类、结构体、枚举、联合体、类型定义、作用域名
- 函数名(包括全局函数、作用域函数、成员函数)
- 全局变量(包括全局和命名空间域下的变量，类静态变量)，局部变量，函数参数，类、结构体和联合体中的成员变量名
- 宏、全局常量、枚举值、goto标签

2. 格式规范

- 括号位置
- 空格位置及使用情况
- 行宽
- 缩进

3. 注释规范
4. 语言级高级特性使用建议

## 2. 选择格式化工具

确定上述规范后，并不能指望团队成员能很好地应用规范。因此，需要选择格式化工具，通过介入开发的各个阶段，潜移默化地辅以开发者遵守规范。

CPP 常见的格式化工具有 [cpplint](https://github.com/cpplint/cpplint)，[clang-format](https://clang.llvm.org/docs/ClangFormat.html)，[clang-tidy](https://clang.llvm.org/extra/clang-tidy/index.html) 等：

- cpplint 是格式化工具，主要围绕 Google 规范展开，现已不再维护公开仓库
- clang-tidy 是静态代码分析工具，可以实现[变量名风格纠正替换](https://clang.llvm.org/extra/clang-tidy/checks/list.html)
- clang-format 是格式化工具，调整空格换行符等格式规范

经过初步调研后，发现 [clang-format 基本能满足所有需求（格式规范和注释规范），命名规范方面则可以结合 clang-tidy 可为补充](https://stackoverflow.com/questions/73788989/how-to-configure-naming-conventions-with-clang-format)：

> Clang-format is all about local changes to the code in a way that is irrelevant to the compiler. Like changing whitespace. Renaming variables, on the other hand, is a completely different thing, since its impact is potentially very global (think about exported symbols consumed by other libraries, or just multiple files).

下文是笔者集成 Clang-format 的一点实践经验。

## 3. 编写 .clang-format

引入 Clang-format 需要编写 .clang-format 配置文件，通过配置文件的形式调用的好处很多：无论是在命令行脚本中或是 IDE 中或是 CICD 流程，都能很方便地集成同一套规范。

[Clang-format 支持的配置参数很多](https://clang.llvm.org/docs/ClangFormatStyleOptions.html)，为提高编写配置文件效率，[可以使用在线 .clang-format 配置预览网站](https://clang-format-configurator.site/)，修改后实时预览格式:
![image-20250412223702866](https://cdn.liaoguoyin.com/images/clang-format-team-cpp-code-style_2.png)

经过 GPT 辅助+文档查询+网站在线调试后，初版格式化配置文件如下：

```YAML
# .clang-format 配置文件, 根据指定的编码规则生成

# 基础样式，基于 LLVM 并进行覆盖
BasedOnStyle: LLVM
SortIncludes: false

# 缩进设置
IndentWidth: 4                   # 规则4.3.1 使用4个空格缩进
UseTab: Never                    # 规则4.3.1 禁止使用制表符
TabWidth: 4
AccessModifierOffset: -4         # public:, protected:, private:，缩进与class对齐

# 大括号风格：Allman 风格（新行开始）
BreakBeforeBraces: Custom         # 规则4.4.1 Allman 风格的大括号
BreakBeforeBinaryOperators: None
BraceWrapping:
  AfterClass: true               # 类定义后大括号另起一行
  AfterControlStatement: true    # if, else, for, while 等控制语句后大括号另起一行
  AfterEnum: true                # 枚举定义后大括号另起一行
  AfterFunction: true            # 函数定义后大括号另起一行
  AfterNamespace: false          # 将命名空间的左大括号放在行末
  AfterExternBlock: false        # 将 extern "C" 的左大括号放在行末
  BeforeCatch: true              # catch 前大括号另起一行
  BeforeElse: true               # else 前大括号另起一行
  IndentBraces: false            # 大括号不额外缩进

# 控制语句设置
AlwaysBreakAfterReturnType: None              # 确保返回类型和函数名不在返回类型之后强制换行，保持在同一行
AlwaysBreakAfterDefinitionReturnType: None    # 专门针对函数定义，确保返回类型和函数名不在返回类型之后强制换行
AllowShortIfStatementsOnASingleLine: false    # 规则4.7.2 禁止单行 if 语句
AllowShortLoopsOnASingleLine: false           # 禁止单行 for/while 循环

# 函数声明和调用格式化
AllowAllParametersOfDeclarationOnNextLine: false     # 规则4.5.1 函数声明参数不全部放到下一行
BinPackParameters: false                             # 禁止在函数声明和定义中将多个参数打包在一行，确保每个参数在必要时单独换行
BinPackArguments: false                              # 禁止在函数调用中将多个参数打包在一行，确保在行宽不足时参数能够合理换行并对齐

# 参数对齐
AlignAfterOpenBracket: Align                        # 当参数换行时，后续行的参数与第一个参数对齐
ContinuationIndentWidth: 4                          # 规则4.3.1 连续行缩进4个空格，设置续行的缩进为4个空格，确保参数列表换行后的对齐缩进

# 控制括号前的空格
SpaceBeforeParens: ControlStatements                # 控制语句前加空格
SpaceAfterCStyleCast: false                         # C 风格强制转换后不加空格

# Switch 语句格式化
IndentCaseLabels: true                              # 规则4.9.1 case/default 缩进一层

# 指针对齐
PointerAlignment: Right                              # 指针靠左对齐，如 int* ptr;

# 等号操作符对齐
AlignOperands: true
AlignConsecutiveAssignments: true

# 预处理指令格式化
IndentPPDirectives: None                            # 规则4.14.1 预处理指令不缩进

# 最大空行数
MaxEmptyLinesToKeep: 2

# 禁止单行函数定义
AllowShortFunctionsOnASingleLine: None

# 命名约定（无法通过 Clang-Format 强制执行，需要使用 Clang-Tidy 或其他工具）
# 规则2.1.1 标识符命名使用驼峰风格

# 类成员访问控制格式化
# 规则4.16.1 公共、受保护、私有部分排列顺序，并与 class 对齐
# 注意：Clang-Format 并不直接支持访问控制排序，需要手动排列或使用其他工具

# 宏定义格式化（如果需要）
# 根据需要进行自定义，例如对齐等

# 规则4.2.1 行宽设置（按需调整）
ColumnLimit: 200
```

在确定了规范和工具后，可以在命令行中快速格式化单个 cpp 代码：
`clang-format -style=file -i src/path/to/*.cpp`

> clang-format -style=file 应用配置文件时会遵循就近原则，在执行目录最近的父级目录中找寻 .clang-format 配置。找不到则使用默认的规则格式化兜底
> [When using -style=file, clang-format for each input file will try to find the .clang-format file located in the closest parent directory of the input file. When the standard input is used, the search is started from the current directory.](https://clang.llvm.org/docs/ClangFormatStyleOptions.html)

批量格式化也十分简单。将多个 cpp 文件传入给 clang-format 即可，这个过程需要借助 Shell 中的 **通配符** 或 **find 指令+管道**，以脚本的形式运行：

- `find . -name '*.cpp' -o -name '*.h' | xargs clang-format -i`
- `clang-format -i **/*.{cpp,h,hpp}`

## 4. 集成策略

有了规则和工具，接下来考虑的是如何把规范应用到小组内部项目中，实现长期规范。

如下图，在开发的各个流程中（编码开发，代码管理，编译打包），都可以集成格式化。

- Coding（vscode，qt creator format on saving）
- Before git push（Git Hook： ~/.git/hooks）
- After git push（CI Pipeline）

![代码格式化阶段](https://cdn.liaoguoyin.com/images/clang-format-team-cpp-code-style_3.png)

具体在哪个阶段引入，可以从侵入性、可复用性、能否提供反馈纠正等方面进行考虑。

- Coding 阶段引入需要引导开发者为 IDE 配置额外的工具，前期有一定侵入性，但配置独立于项目，每次格式化会给予开发者正反馈学习；
- 本地 Git 阶段引入也有侵入性，需要编写脚本配置项目粒度的 ~/.git/hooks，相比于第一阶段可复用性更差。每个项目都要配脚本、新增 git hooks 操作；
- CICD pipeline 阶段对开发者是无感、或者说是被动的，可迁移性也更好，开发和格式化完全分离。这里重点描述 CI 阶段。CI 有两种策略：
  1. 一种是推送后执行 format，直接让 CI 将 format 之后的代码推送到仓库，这种策略对开发者感知很弱，几乎不会让开发者对代码规范引起重视，且对代码及具侵略性，缺乏人工 review 的过程可能导致危险；
  2. 另一种是在 CI 中执行 format 后，检查 git diff，如果 git 存在差异，则拒绝代码推送及 PR合并，让用户修改后再推送再合并。

好的工具应该是无感的，是辅助、加成而不是给开发者以限制。

因此，一个不错的引入原则是 **多阶段结合，相互补充，逐步平滑引入**：

在 Coding 阶段引入，并不断修正配置文件；等到配置成熟后，然后在 CI/CD 流水线中引入，增量检查变更代码，并按照策略2进行自自动化审查（没有格式化的代码无法被合并）。

至于第二个阶段，hooks 无法被同步到 Git 仓库，要求开发者需要在开发环境进行额外的配置，且可迁移性较差，暂时不予忽略，在后续有需要时再考虑引入。

### 4.1 集成到开发阶段

在开发时介入，这部分主要是在统一在开发者处安装 IDE 插件，实现保存文件时自动调用 Clang-format，这个后续会再写水一篇文章。

值得一提的是，[Clang-format 程序版本应该保持一致性](https://askubuntu.com/questions/1409031/how-to-use-a-more-recent-clang-format-or-clang-tidy-version-on-ubuntu-18-04)。

笔者在实践时发现，组内有同事配置了 Clang-format 但依旧格式化不通过标准化结果。

最后发现是开发环境的锅，如 Ubuntu 22 和 Ubuntu 24 通过 apt 安装的 Clang-format 版本并不相同，不同的 Clang-format 版本之间加入了新的格式化规则，版本之间默认的配置参数并不完全兼容。

**因此需要开发团队安装同一个版本的 Clang-format，可以选择编译安装，也可以使用 Python pip 安装。**

### 4.2 集成到 CI 流程

在开发者推送代码到代码仓库后，可以在编译前进行格式化。这条链路的核心是：在 PR 合并代码阶段，利用 [git diff](https://git-scm.com/docs/git-diffyesterday) 对比格式化前后的代码，接受或拒绝更新。

```
#!/bin/bash

# 脚本名称: format_code.sh
# 功能：格式化指定目录下的 C/C++ 文件（.cpp, .hpp, .c, .h）
# 支持本地和 GitLab CI 环境调用

# 设置要格式化的文件类型
FILE_TYPES=(
    "*.cpp"
    "*.hpp"
    "*.c"
    "*.h"
)
# 设置要搜索的目录列表（支持换行）

SEARCH_DIRS=(
    "src/"
    # 可以根据需要添加更多目录
)

# 检查 clang-format 是否安装
if ! command -v clang-format &> /dev/null; then
    echo "错误: clang-format 未安装。请先安装。"
    exit 1
fi

# 遍历目录列表并格式化文件
for search_dir in "${SEARCH_DIRS[@]}"; do
    if [ ! -d "$search_dir" ]; then
        echo "警告：目录 $search_dir 不存在，跳过。"
        continue
    fi

    for file_type in "${FILE_TYPES[@]}"; do
        find "$search_dir" -type f -name "$file_type" | while read -r file; do
            echo "格式化文件: $file"
            clang-format -i "$file"
        done
    done
done

echo "格式化完成。"

```

CI 配置引入:

```

test-clang-format:
  stage: test
  script:
    - clang-format --version # clang-format >= 19.1.7
    - bash scripts/format/format_code.sh
    # - shopt -s globstar # enable globstar, avaible from bash 4.0
    # - clang-format -i ./src/**/*.cpp ./src/**/*.h
    - git diff > format.diff
    - echo "格式化差异前十行如下，如果有结果则失败，需格式化之后再推送（您也可以下载 CI 过程中右侧的 Job artifacts 查看完整差异）"
    - head format.diff
    - git diff --exit-code # exit if have diffs
  artifacts:
    when: always
    paths:
      - format.diff
  allow_failure: false

```

## 5. 总结

以上就是笔者在 cpp 项目中集成 Clang-format 的一点经验。

本文介绍了 Clang-format，.clang-format 配置文件编写的过程，以及将其集成到开发过程中哪个阶段的思考：

- 目前个人的答案是将它集成到代码开头（开发阶段）和代码结束（代码 CI 编译前）
- 现在，借助 GPT 编写这类工具的配置文件是件简单得不能再简单的事情，如何更无感地把它集成到团队中，尽可能不影响开发体验和习惯才是更值得琢磨的

此外，规则内容本身没有好坏之分。举例来说，细抠犹豫 CPP 指针符应该放在变量和类型的左边、右边还是中间，真没多少意义。

毕竟，保持一致性才是做这件事的核心。

## 6. Ref

- https://bayareanotes.com/clang-tidy/
- https://github.com/johnmcfarlane/unformat
- https://coderfan.net/en/how-to-unify-code-stytle-in-c-or-c-plus-plus-html.html#google_vignette
