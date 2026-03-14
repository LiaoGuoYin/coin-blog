---
title: 通过值传递、引用传递理解C++函数花里胡哨的写法
date: '2022-06-14T06:29:48+00:00'
published: true
feature: ''
---
最近在 [CPlusPlus Tutorial](https://cplusplus.com/doc/tutorial/) 上发现一篇很棒的文章，很大程度上帮助我理解了 C++ 函数一堆标识符写法的用意：

```c++
inline string concatenate(const string& a, const string& b)
{
  return a+b;
}
```

C++ 函数参数是值传递还是引用传递？函数声明中给参数加上 & 是什么操作？参数带 const 又是什么意思？inline 关键字又是干嘛的？

本来想提炼一下，发现还是摘抄 [原文](https://cplusplus.com/doc/tutorial/functions/) 然后对段翻译，才能尽可能地原汁原味。（部分意译，水平有限，读不通可以看该段下方的原文。）

## 参数的值传递和引用传递

> Arguments passed by value and by reference

在前面（节选）函数中已经看到，参数总是通过值传递（译者注：数组除外，数组作为参数传递的是数组首地址指针，默认为引用传递）。这意味着，在调用函数时，传递的是调用瞬间各参数的值，这些参数的值被拷贝到函数参数变量中。例如：

> In the functions seen earlier, arguments have always been passed by value. This means that, when calling a function, what is passed to the function are the values of these arguments on the moment of the call, which are copied into the variables represented by the function parameters. For example, take:

```c++
nt x=5, y=3, z;
z = addition(x, y);
```

在这个例子中，函数 addition() 传入了 5 和 3，也就是 x 和 y 值的拷贝。这些值（5 和 3）被用于初始化在函数中定义过的变量。在函数中修改这些变量并不会对函数外部的 x 和 y 变量产生影响，因为 x 和 y 本身并不被传递到函数中，那函数调用那一刻，传递的只是它们值的拷贝。

> In this case, function addition is passed 5 and 3, which are copies of the values of x and y, respectively. These values (5 and 3) are used to initialize the variables set as parameters in the function's definition, but any modification of these variables within the function has no effect on the values of the variables x and y outside it, because x and y were themselves not passed to the function on the call, but only copies of their values at that moment.

然而，在某些情况下，需要从函数内部访问外部变量。为达成此目的，参数应该通过引用传递而不是值传递。例如，此代码中 duplicate() 函数拷贝了其三个参数的值，导致用作参数的变量实际上在调用中被修改：

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

为了能存取参数，函数参数应该声明为引用。在 C++ 中，通过在参数类型后紧跟 ampersand(&) 符号来表示引用，如上例中 duplicate() 函数的参数。

> To gain access to its arguments, the function declares its parameters as references. In C++, references are indicated with an ampersand (&) following the parameter type, as in the parameters taken by duplicate in the example above.

当变量被作为引用传递时，传递的就不再是拷贝，而是变量本身。在函数参数中标识的变量，以某种形式和传递给函数的参数相关联，对其在函数中相应局部变量的任何修改都会反映到调用时传递的变量中。

> When a variable is passed by reference, what is passed is no longer a copy, but the variable itself, the variable identified by the function parameter, becomes somehow associated with the argument passed to the function, and any modification on their corresponding local variables within the function are reflected in the variables passed as arguments in the call.

事实上，a, b, 和 c 在函数调用 (x, y, and z) 时，成为了参数的别名，在函数中对变量 a 的任何修改，都将改变其对应的外部变量 x 上，任何对 b 的修改都会影响 y，对 c 的修改都会影响 z。这也是为什么在上面的例子中，函数 duplicate() 修改了 a, b, 和 c 的值后，x, y, 和 z 也被影响了。

> In fact, a, b, and c become aliases of the arguments passed on the function call (x, y, and z) and any change on a within the function is actually modifying variable x outside the function. Any change on b modifies y, and any change on c modifies z. That is why when, in the example, function duplicate modifies the values of variables a, b, and c, the values of x, y, and z are affected.

如果没有把 duplciate() 定义为：

> If instead of defining duplicate as:

```c++
void duplicate(int& a, int& b, int& c) 
```

而将其定义为没有 ampersand 引用符(&)的（函数）：

> Was it to be defined without the ampersand signs as:

```c++
void duplicate(int a, int b, int c)
```

变量也就不会是引用传递了，而将会创建对应的值拷贝。在这个例子中，程序的输出是没有被修改过的 x, y 和 z(i.e., 1, 3, 7)

> The variables would not be passed by reference, but by value, creating instead copies of their values. In this case, the output of the program would have been the values of x, y, and z without being modified (i.e., 1, 3, and 7).

## 效率考量和常量引用

> Efficiency considerations and const references

调用有参函数会进行值拷贝。对基本数据类型如 int 来说，操作开销是尚且低廉（可接受）的，但若参数是较大的复合类型，将无疑会导致一些开销。例如，看一下这个函数：

> Calling a function with parameters taken by value causes copies of the values to be made. This is a relatively inexpensive operation for fundamental types such as int, but if the parameter is of a large compound type, it may result on certain overhead. For example, consider the following function:

```c++
string concatenate(string a, string b)
{
  return a+b;
}
```

函数持有两个 string 型参数（按值），并返回连接字符串的结果。当函数被调用时，参数值拷贝，a 和 b 参数都被值拷贝。如果是两个很长的字符串，会在调用时拷贝大量数据。但是，可以通过传递引用来避免拷贝（开销）。

> This function takes two strings as parameters (by value), and returns the result of concatenating them. By passing the arguments by value, the function forces a and b to be copies of the arguments passed to the function when it is called. And if these are long strings, it may mean copying large quantities of data just for the function call. But this copy can be avoided altogether if both parameters are made references:

```c++
string concatenate(string& a, string& b)
{
  return a+b;
}
```

传递引用参数不需要拷贝。函数直接在传入的字符串别名上进行操作，就像把指针传递给函数一样。这样一来，因为没有字符串拷贝开销，拼接字符串引用的版本比拼接字符串值的版本将更有效率。

> Arguments by reference do not require a copy. The function operates directly on (aliases of) the strings passed as arguments, and, at most, it might mean the transfer of certain pointers to the function. In this regard, the version of concatenate taking references is more efficient than the version taking values, since it does not need to copy expensive-to-copy strings.

反过来说，带引用参数的函数通常会对传入的参数进行修改，这是引用参数的设计初衷。

> On the flip side, functions with reference parameters are generally perceived as functions that modify the arguments passed, because that is why reference parameters are actually for.

解决的办法是让函数保证引用参数不会被本函数修改，这可以通过将参数限定为常量来实现：

> The solution is for the function to guarantee that its reference parameters are not going to be modified by this function. This can be done by qualifying the parameters as constant:

```c++
string concatenate(const string& a, const string& b)
{
  return a+b;
}
```

通过将参数限定为常量，函数将无法修改 a 或 b 的值，但实际上可以作为引用（参数的别名）直接访问它们的值，而不必实际拷贝字符串的值。

> By qualifying them as const, the function is forbidden to modify the values of neither a nor b, but can actually access their values as references (aliases of the arguments), without having to make actual copies of the strings.

因此，常量引用提供了类似于按值传参的功能，对大型参数来说效率更高。这也是 C++ 中复合类型参数流行的原因。但是请注意，对大多数基本数据类型来说，效率没有明显提升，在有的情况下，常量引用甚至可能导致效率更低。

> Therefore, const references provide functionality similar to passing arguments by value, but with an increased efficiency for parameters of large types. That is why they are extremely popular in C++ for arguments of compound types. Note though, that for most fundamental types, there is no noticeable difference in efficiency, and in some cases, const references may even be less efficient!

## 内联函数

> Inline functions

调用函数通常会导致一定开销（栈参数，jump，等等）。因此，如果函数很短，将代码简单地插入到函数调用的地方，相比于正常调用函数可能更有效率。

> Calling a function generally causes a certain overhead (stacking arguments, jumps, etc...), and thus for very short functions, it may be more efficient to simply insert the code of the function where it is called, instead of performing the process of formally calling a function.

在函数声明前加上一个 inline 标识符告知编译器：对这个函数，应该（倾向于）使用内联展开而不是通常的函数调用。这样做并不会改变函数功能，而是建议编译器：将函数体生成的代码插入到函数的各调用点上，而不是常规地进行函数调用。举个例子：上述 concatenate() 函数可以被内联声明为：

> Preceding a function declaration with the inline specifier informs the compiler that inline expansion is preferred over the usual function call mechanism for a specific function. This does not change at all the behavior of a function, but is merely used to suggest the compiler that the code generated by the function body shall be inserted at each point the function is called, instead of being invoked with a regular function call. For example, the concatenate function above may be declared inline as:

```c++
inline string concatenate(const string& a, const string& b)
{
  return a+b;
}
```

这将告知编译器，当 concatenate() 被调用时，程序倾向将该函数内联展开，而不是采用常规的函数调用。内联只在函数声明时指定，而不在调用时。

> This informs the compiler that when concatenate is called, the program prefers the function to be expanded inline, instead of performing a regular call. inline is only specified in the function declaration, not when it is called.

注意，大多数编译器会对代码进行优化：尽管没有显示地标记 inline 标识符，当编译器看到提升效率的机会时，也会使用内联优化。因此，这个标识符只是表明编译器对此函数倾向于内联，真正内不内联还得看编译器。在 C++ 中，优化是委托给编译器的任务，编译器可以自由地生成任何代码，只要表现结果符合预期。

> Note that most compilers already optimize code to generate inline functions when they see an opportunity to improve efficiency, even if not explicitly marked with the inline specifier. Therefore, this specifier merely indicates the compiler that inline is preferred for this function, although the compiler is free to not inline it, and optimize otherwise. In C++, optimization is a task delegated to the compiler, which is free to generate any code for as long as the resulting behavior is the one specified by the code.

## recap

个人觉得这篇文章的层层递进娓娓道来的感觉非常妙，很多语言层面更新出来的特性并不是凭白无故的，如果能抽离一些主要适用场景来阐述，摸清它的设计目的，理解起来就会非常舒服，记忆和使用自然也就不是特别难的事。

回到最开始的问题：

C++ 函数参数是值传递还是引用传递？函数声明中给参数加上 & 是什么操作？参数带 const 又是什么意思？inline 关键字又是干嘛的？

1. C++ 没有限定的普通函数和标识符的形式参数的情况下，默认是**值传递**（数组除外）。也就是在函数调用传入参数时会进行值拷贝，在函数内部对参数的一些操作并不会影响到函数外，因为函数调用结束，拷贝的参数也就从帧栈上释放。
2. 通过在函数声明处对函数进行 & 标识符进行限定，对传入的变量转为**引用传递**，拷贝的仅仅只是参数的单个指针，**避免值拷贝造成的内存开销**，也能很方便地传入复合数据类型指针。
3. 形式参数带上 const，是因为直接通过 & 标识符传入的参数极有可能在函数体内部被修改，**我们想要利用 & 来只传递引用，又不想传入的参数被修改，导致函数对外有副作用，所以给参数加上一个 const，确保函数不能修改传入的参数**。
4. 那为什么又来个 inline 关键字呢，这是为了给编译器提供一种编译倾向，**使得编译器能针对一些短小的函数进行内联展开的编译优化，避免常规函数调用时的帧栈和函数跳转开销**。

最后，最佳实践也就相当容易理解了：

```c++
inline string concatenate(const string& a, const string& b)
{
  return a+b;
}
```

理解可能还不够深刻，如果描述有误，请留言拍砖。

最后再次初学 C++ 的朋友隆重推荐 CPlusPlus Tutorial.

## ref

- [CPlusPlus Tutorial](https://cplusplus.com/doc/tutorial/)
- [Functions](https://cplusplus.com/doc/tutorial/functions/)
