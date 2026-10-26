---
title: 通过值传递、引用传递理解C++函数花里胡哨的写法
date: '2022-06-14T06:29:48+00:00'
published: true
feature: ''
---
最近在 [CPlusPlus Tutorial](https://cplusplus.com/doc/tutorial/) 上看到一篇很不错的文章，帮我理解了 C++ 函数里一堆标识符写法到底是为了什么：

```c++
inline string concatenate(const string& a, const string& b)
{
  return a+b;
}
```

C++ 函数参数到底是值传递还是引用传递？函数声明里给参数加 `&` 是什么操作？参数带 `const` 又是什么意思？`inline` 关键字又是干嘛的？

本来想自己提炼一下，后来发现还是摘抄 [原文](https://cplusplus.com/doc/tutorial/functions/) 再逐段翻译更靠谱。部分地方是意译，水平有限，读不通可以直接看每段下面的原文。

## 参数的值传递和引用传递

> Arguments passed by value and by reference

在前面的函数例子里，参数一直是通过值传递的。这里先排除数组，数组作为参数传递时，本质上会退化成首地址指针。这意味着调用函数时，传进去的是那一刻各个参数的值，这些值会被拷贝到函数参数变量里。比如：

> In the functions seen earlier, arguments have always been passed by value. This means that, when calling a function, what is passed to the function are the values of these arguments on the moment of the call, which are copied into the variables represented by the function parameters. For example, take:

```c++
nt x=5, y=3, z;
z = addition(x, y);
```

在这个例子中，`addition()` 拿到的是 5 和 3，也就是 `x` 和 `y` 的值拷贝。这两个值会用来初始化函数参数。在函数内部修改这些参数，不会影响外面的 `x` 和 `y`，因为真正传进去的不是变量本身，而是函数调用那一刻的值拷贝。

> In this case, function addition is passed 5 and 3, which are copies of the values of x and y, respectively. These values (5 and 3) are used to initialize the variables set as parameters in the function's definition, but any modification of these variables within the function has no effect on the values of the variables x and y outside it, because x and y were themselves not passed to the function on the call, but only copies of their values at that moment.

但有些情况下，函数内部确实需要访问并修改外部变量。这时候就要用引用传递，而不是值传递。下面这个例子里，`duplicate()` 会把三个参数翻倍，调用时传进去的变量也会真的被改掉：

> In certain cases, though, it may be useful to access an external variable from within a function. To do that, arguments can be passed by reference, instead of by value. For example, the function duplicate in this code duplicates the value of its three arguments, causing the variables used as arguments to actually be modified by the call:

```c++
// passing parameters by reference
#include <iostream>
using namespace std;

void duplicate(int& a, int& b, int& c)
{
  a*=2;
  b*=2;
  c*=2;
}

int main()
{
  int x=1, y=3, z=7;
  duplicate (x, y, z);
  cout << "x=" << x << ", y=" << y << ", z=" << z;
  // output: x=2, y=6, z=14
  return 0;
}
```

为了做到这一点，函数参数要声明为引用。在 C++ 里，引用通过参数类型后面的 `&` 表示，就像上面 `duplicate()` 的参数一样。

> To gain access to its arguments, the function declares its parameters as references. In C++, references are indicated with an ampersand (&) following the parameter type, as in the parameters taken by duplicate in the example above.

变量按引用传递时，传进去的就不是拷贝，而是变量本身。函数参数会和调用时传入的变量关联起来，函数内部对参数的修改，会反映到外部变量上。

> When a variable is passed by reference, what is passed is no longer a copy, but the variable itself, the variable identified by the function parameter, becomes somehow associated with the argument passed to the function, and any modification on their corresponding local variables within the function are reflected in the variables passed as arguments in the call.

实际上，`a`、`b`、`c` 在函数调用时变成了 `x`、`y`、`z` 的别名。函数里修改 `a`，外面的 `x` 就会变；修改 `b`，外面的 `y` 就会变；修改 `c`，外面的 `z` 也会变。所以 `duplicate()` 改完 `a`、`b`、`c` 后，`x`、`y`、`z` 的值也变了。

> In fact, a, b, and c become aliases of the arguments passed on the function call (x, y, and z) and any change on a within the function is actually modifying variable x outside the function. Any change on b modifies y, and any change on c modifies z. That is why when, in the example, function duplicate modifies the values of variables a, b, and c, the values of x, y, and z are affected.

如果不是这样定义 `duplicate()`：

> If instead of defining duplicate as:

```c++
void duplicate(int& a, int& b, int& c) 
```

而是去掉 `&`，定义成普通值传递：

> Was it to be defined without the ampersand signs as:

```c++
void duplicate(int a, int b, int c)
```

变量就不会按引用传递，而是会创建对应的值拷贝。这个例子里，程序输出的还是没有被修改过的 `x`、`y`、`z`，也就是 1、3、7。

> The variables would not be passed by reference, but by value, creating instead copies of their values. In this case, the output of the program would have been the values of x, y, and z without being modified (i.e., 1, 3, and 7).

## 效率考量和常量引用

> Efficiency considerations and const references

带参数调用函数时，如果是值传递，就会发生拷贝。对 `int` 这种基本类型来说，拷贝开销很小；但如果参数是比较大的复合类型，就可能带来明显开销。比如这个函数：

> Calling a function with parameters taken by value causes copies of the values to be made. This is a relatively inexpensive operation for fundamental types such as int, but if the parameter is of a large compound type, it may result on certain overhead. For example, consider the following function:

```c++
string concatenate(string a, string b)
{
  return a+b;
}
```

这个函数接收两个 `string` 参数，并返回拼接结果。因为是按值传递，所以调用函数时，`a` 和 `b` 都会各自拷贝一份。如果两个字符串很长，调用时就会拷贝大量数据。改成引用传递，可以直接避开这部分拷贝。

> This function takes two strings as parameters (by value), and returns the result of concatenating them. By passing the arguments by value, the function forces a and b to be copies of the arguments passed to the function when it is called. And if these are long strings, it may mean copying large quantities of data just for the function call. But this copy can be avoided altogether if both parameters are made references:

```c++
string concatenate(string& a, string& b)
{
  return a+b;
}
```

引用参数不需要拷贝。函数直接在传入字符串的别名上操作，大概可以理解成把指针传给函数。这样一来，没有字符串拷贝开销，引用版本自然比值传递版本更高效。

> Arguments by reference do not require a copy. The function operates directly on (aliases of) the strings passed as arguments, and, at most, it might mean the transfer of certain pointers to the function. In this regard, the version of concatenate taking references is more efficient than the version taking values, since it does not need to copy expensive-to-copy strings.

但反过来说，引用参数通常也会给人一种暗示：这个函数可能会修改传入参数。引用本来就是为这件事准备的。

> On the flip side, functions with reference parameters are generally perceived as functions that modify the arguments passed, because that is why reference parameters are actually for.

解决办法是让函数明确保证自己不会修改引用参数，这可以通过 `const` 做到：

> The solution is for the function to guarantee that its reference parameters are not going to be modified by this function. This can be done by qualifying the parameters as constant:

```c++
string concatenate(const string& a, const string& b)
{
  return a+b;
}
```

把参数限定为常量后，函数就不能修改 `a` 或 `b` 的值，但仍然可以通过引用直接访问它们，不需要实际拷贝字符串。

> By qualifying them as const, the function is forbidden to modify the values of neither a nor b, but can actually access their values as references (aliases of the arguments), without having to make actual copies of the strings.

所以，常量引用提供了类似按值传参的使用体验，但对大型参数更高效。这也是 C++ 里复合类型参数经常写成 `const T&` 的原因。不过对大多数基本类型来说，效率提升并不明显，有些情况下常量引用反而可能更慢。

> Therefore, const references provide functionality similar to passing arguments by value, but with an increased efficiency for parameters of large types. That is why they are extremely popular in C++ for arguments of compound types. Note though, that for most fundamental types, there is no noticeable difference in efficiency, and in some cases, const references may even be less efficient!

## 内联函数

> Inline functions

函数调用通常会有一些开销，比如压栈、跳转之类的操作。如果函数很短，把函数体直接展开到调用处，可能比正常函数调用更高效。

> Calling a function generally causes a certain overhead (stacking arguments, jumps, etc...), and thus for very short functions, it may be more efficient to simply insert the code of the function where it is called, instead of performing the process of formally calling a function.

在函数声明前加上 `inline`，就是告诉编译器：这个函数倾向于使用内联展开，而不是普通函数调用。它不会改变函数功能，只是给编译器一个建议：可以把函数体生成的代码插入到各个调用点。比如上面的 `concatenate()` 可以这么写：

> Preceding a function declaration with the inline specifier informs the compiler that inline expansion is preferred over the usual function call mechanism for a specific function. This does not change at all the behavior of a function, but is merely used to suggest the compiler that the code generated by the function body shall be inserted at each point the function is called, instead of being invoked with a regular function call. For example, the concatenate function above may be declared inline as:

```c++
inline string concatenate(const string& a, const string& b)
{
  return a+b;
}
```

这会告诉编译器，当 `concatenate()` 被调用时，程序更希望它被内联展开，而不是走普通函数调用。`inline` 只在函数声明时写，不在调用时写。

> This informs the compiler that when concatenate is called, the program prefers the function to be expanded inline, instead of performing a regular call. inline is only specified in the function declaration, not when it is called.

注意，大多数编译器本来就会做优化。即使没有显式标记 `inline`，编译器看到合适机会时也可能自动内联。所以这个关键字更多是表达一种倾向，最后内不内联还得看编译器。C++ 里优化这件事交给编译器，只要最终行为符合代码语义，编译器可以自由生成它认为合适的代码。

> Note that most compilers already optimize code to generate inline functions when they see an opportunity to improve efficiency, even if not explicitly marked with the inline specifier. Therefore, this specifier merely indicates the compiler that inline is preferred for this function, although the compiler is free to not inline it, and optimize otherwise. In C++, optimization is a task delegated to the compiler, which is free to generate any code for as long as the resulting behavior is the one specified by the code.

## recap

个人觉得这篇文章层层递进的感觉很妙。很多语言特性不是凭空冒出来的，如果能抽出主要使用场景，摸清它的设计目的，理解起来就舒服很多，记忆和使用也没那么难。

回到最开始的问题：

C++ 函数参数到底是值传递还是引用传递？函数声明里给参数加 `&` 是什么操作？参数带 `const` 又是什么意思？`inline` 关键字又是干嘛的？

1. 普通函数参数默认是**值传递**，数组除外。函数调用传参时会做值拷贝，函数内部对参数的修改不会影响外部变量。函数调用结束后，拷贝出来的参数也会从栈帧里释放。
2. 在函数参数类型后加 `&`，就是把传入变量改成**引用传递**。它避免了值拷贝造成的内存开销，也能更方便地传入复合数据类型。
3. 形式参数带上 `const`，是因为单纯通过 `&` 传入的参数可能会在函数体内部被修改。我们想用引用避免拷贝，又不想让函数修改传入参数，所以加 `const` 约束住它。
4. `inline` 是给编译器一个编译倾向，让编译器可以针对短小函数做内联展开，减少普通函数调用时的栈帧和跳转开销。

最后，最佳实践也就相当容易理解了：

```c++
inline string concatenate(const string& a, const string& b)
{
  return a+b;
}
```

理解可能还不够深，如果描述有误，请留言拍砖。

最后再次给初学 C++ 的朋友隆重推荐 CPlusPlus Tutorial。

## ref

- [CPlusPlus Tutorial](https://cplusplus.com/doc/tutorial/)
- [Functions](https://cplusplus.com/doc/tutorial/functions/)
