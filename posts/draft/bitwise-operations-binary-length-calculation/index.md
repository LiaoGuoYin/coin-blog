---
title: 位运算和二进制长度计算
date: '2023-06-28T15:51:48+00:00'
published: false
feature: ''
---

LC 里位运算和进制转换常常一起考。做了一段时间题后有个体会：2 进制和 10 进制没有本质区别，都是数的表示方法。很多时候不需要真的转来转去，直接用十进制数做位运算，就能很优雅地解决问题。

做 LC（[1680. 连接连续二进制数字 题解](https://leetcode.cn/problems/concatenation-of-consecutive-binary-numbers/solution/golang-jian-ji-xie-fa-by-endlesscheng-2cg5/)）的时候，遇到一个很棒的解题思路，主要和位运算、进制转换有关。

```golang
func concatenatedBinary(n int) (ans int) {
    for i := 1; i <= n; i++ {
        ans = (ans << bits.Len(uint(i)) | i) % (1e9 +7)
    }
    return
}

func concatenatedBinary(n int) (ans int) {
    for i := 1; i <= n; i++ {
        ans = (ans<<bits.Len(uint(i)) | i) % (1e9 + 7)
    }
    return
}


作者：endlesscheng
链接：https://leetcode.cn/problems/concatenation-of-consecutive-binary-numbers/solution/golang-jian-ji-xie-fa-by-endlesscheng-2cg5/
来源：力扣（LeetCode）
著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。

```

位运算的核心大概就三样：位逻辑运算（AND / OR / XOR / NOT）、位移操作（`>>` / `<<`），以及位长度计算。

这里刚好三件套都用到了。需要额外注意的是，通常情况下，加法并不等同于位或 OR 运算，因为加法有进位。比如 `1 + 1` 会进位，二进制结果是 `10`；但 `1 | 1` 的结果还是 `01`。这个题里之所以能这么写，是因为「左移后空出来的位置全为 0，加法运算也可以写成或运算」。没有进位，才能原封不动保留 `1` 的情况，于是就有了加的效果。

另外值得一提的是 `bits.Len(uint(i))`。这个函数用于返回一个无符号数的二进制长度。看了一下 [Golang math.bits.Len() 的源码](https://cs.opensource.google/go/go/+/refs/tags/go1.20.5:src/math/bits/bits.go;l=302)，发现实现也很巧妙，一句话概括就是位运算 + 打表：

```

Len64 returns the minimum number of bits required to represent x; the result is 0 for x == 0.
func Len64(x uint64) (n int) {
	// 首先判断输入数字 n 和 2^32 的大小，如果比这个数大，那这个数值长度够 32 位了，x >>= 32 砍去最后 32 位（相当于将 x 除以 2^32，且舍弃余数）
	if x >= 1<<32 {
		x >>= 32
		n = 32
	}
	// 同理，判断处理完之的数 n 和 2^16 的大小，如果比 2^16 大那说明长度足够 16 位，依次进行上述操作
	if x >= 1<<16 {
		x >>= 16
		n += 16
	}
	if x >= 1<<8 {
		x >>= 8
		n += 8
	}

	//由于一共有 64 位，经过上面处理后，一共还剩 8 位，最后这个 len8tab[] 数组就是所有二进制表示的长度在 8 位以内的数的位长度，（原来打表不是刷算法专用，正常标准库也会用空间换时间 hh）
	return n + int(len8tab[x])
}

```

除了上面的位运算三件套，另一个 LC 常考察的点是进制转换，比如二进制、十进制、十六进制之间的相互转换。

十进制转二进制的核心思路：不断除以 2，填充每一个二进制位的 0/1 状态。

二进制转十进制的核心思路：按照 2 进制每一位的权重不断累加。

```golang
func concatenatedBinary(n int) int {
    ans, bLen := 0, 0
    for i := 1; i <= n; i++ {
        if (i & (i-1) ) == 0{
            bLen++
        }
        ans = ans << bLen | i
        if ans > 1000000007 {
            ans %= 1000000007
        }
    }
    return ans
}

//计算 n 的二进制位数
// func countBits(n int) int {
//     count := 0;
//     for n > 0{
//         n >>= 1
//         count++;
//     }
//     return count;
// }

```

有时候其实不需要真的做进制转换也能解决问题。还是那句话，进制只是同一个数的不同表达。就拿上面这个题来说，把 10 进制数直接拿来做 2 进制位操作，只要理解好左移、位长度和 OR 的关系，就能很巧妙地解决问题。

位运算之所以快，是因为处理器逻辑就是 0/1。所有数据追到最细粒度，都是 0/1 的相互运算。标准库把这些东西一封装，0/1 好像就离我们比较远了。但不管知不知道，0/1 它就在那里。

---

后面有空可以继续补三块：

1. 加法和位或在什么情况下可以等价，什么情况下不行。
2. 十进制、二进制、十六进制互转的代码模板。
3. `bits.Len64` 的打表实现再拆细一点。
