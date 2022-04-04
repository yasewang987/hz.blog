# Go语言基础

## 变量定义

```go
// 定义单个
var a int = 1
// 定义多个
var (
  a int = 1
  b string = ""
)
// 定义并赋值，类型自动推断
var a = 1
// 简写
a := 1
```

## 基本数据类型

### 整形

```go
// 有符号
//int16=short,int64=long
// int自动匹配平台(32,64)
int8,int16,int32,int64,int
// 无符号 
// uint8=byte
uint8,uint16,uint32,uint64,uint
```

### 浮点型

* 优先使用`float64`，因为`float32`的累计计算误差容易扩散，并且`float32`能表示的正整数不大
* 当整数大于`23bit`能表达的范围时，`float32`的表示将出现误差
* 很小或很大的数最好用科学计数法书写，通过`e`或`E`来指定指数部分

```go
// 首位表示符号,8位用来指数,后23位表示尾数
// 4个字节 * 8 = 32位
float32

// 首位表示符号,11位用来指数,后52位表示尾数
// 8个字节 * 8 = 64位
float64
```

### 布尔型

```go
var a bool = true
var b bool = false
```

### 字符串

* 不可改变的字节序列，类型为原生数据类型
* 每个中文占用 3 个字节
* `byte, uint8 `=`ASCII` 码的一个字符, `rune`=一个`UTF-8`字符

```go
// -------常用方法----------
// 表示字符串的 ASCII 字符的个数或字节长度
len(str)
// 统计 Uncode 字符数量
RuneCountInString()
// 获取子字符串
str[i:j]
// 获取指定字符在字符串中的位置
strings.Index(s, ".")
strings.LastIndex(s,".")
// 拼接字符串
str1 + str2
StringBuilder
fmt.Sprintf("%s", str1)
// 字符串比较 == > <
str1 == str2
strings.Compare()
// 多行字符串
`row1,
row2,
row3`

// ----------遍历字符串-----------
// 遍历ascii使用for循环
for i:=0; i < len(str); i++ {}
// 遍历unicode字符串
for _, s := range str {}

// -------转义符-------------
// 回车 \r，换行 \n，制表符 \t，单引号 \'，双引号 \"，反斜杆 \\
```

### 枚举

```go
// 定义一个枚举使用的类型
type Sex int
const (
  MAN Sex = iota
  WOMEN
)
```

### 指针

```go
// v 表示被取地址的变量,取到的地址用变量 p 进行接收,p 的类型为 "*T",称为 T 的指针类型
// & 表示取地址
p := &v
// *p 表示取值
fmt.printf(*p)

// 通过new创建对象指针
type Obj struct{
  a int
  b string
}
// 这里的t就是 *Obj 类型
t := new(Obj)
```

### 数组

```go
var aa [10]string
// 初始化
var strs = [2]string{"hz", "god"}
var strs = [...]string{"hz","god"}

// 遍历数组
for index,v := range strs {}
```

### 切片Slice

* 切片是一块动态分配大小的连续空间，切片会自动进行扩容操作，扩容一般发生在 `append()` 函数调用时

```go
// 定义，并初始化
// size ： 表示为这个类型分配多少个元素；
// cap : 预分配的元素数量，该值设定后不影响 size, 表示提前分配的空间，设置它主要用于降低动态扩容时，造成的性能问题。
var name []T = make( []T, size, cap )
// 空切片
var numListEmpty = []int{}
// 直接初始化
arr := []string {"a","b","c","d","e"}
// 从数组或切片生成新的切片
arr2 := arr[1:3]

// 切片添加元素
strList = append(strList, a, b, c)
// 从切片中删除元素
arr = append(arr[:index], arr[index+1:]...)

// 重置切片
arr[0:0]
// 复制切片到另一个切片(目标切片必须有足够的空间来装载源切片的元素个数。)
copy(destSlice, srcSlice)
```

### 通道channel

* 遵循消息先进先出的顺序，同时保证同一时刻只能有一个 `goroutine` 发送或者接收消息

```go
// 双向 channel
var name chan T =  make(chan T, 100)
name <- "foo"
test := <-name
// 只能发送消息的 channel
var name chan <- T
// 只能接收消息的 channel
var name T <- chan
```

### 字典map

* 使用散列表（hash）实现

```go
// 定义
var m2 map[int]string
m := make(map[string]int)
m := map[int](string){1:"a",2:"b"}

// 遍历
for key, value := range m {}

// 删除字典 map 中键值对
delete(map, key)

// 在并发环境下使用的字典 sync.Map
var m sync.Map
// 赋值
m.Store(1, "www")
// 取值
m.Load(2)
// 删除
m.Delete(1)
// 遍历
m.Range(func(key, value interface{}) bool {}
```

### 列表List

```go
// 初始化
list.New()
var a = list.List
// 添加元素
a.PushFront()
a.PushBack()
a.InsertAfter(v interface{}, mark *Element)
a.InsertBefore(v interface{}, mark *Element)
// 添加 other 列表
PushFrontList(other *List) 
PushBackList(other *List)

// 删除
l.Remove(element)

// 遍历
for i := l.Front(); i != nil; i = i.Next() {}
```

## 流程控制

```go
// if else
if err := Connect(); err != nil {}

// for ，结束条件（break 、goto 、return 、panic）
for i=0; i <10; i++ {}
// 或者
i := 0
for i <= 10 { i++ }
// 无限循环
for {}
// for range
for index,value := range str {}

// switch case
switch i {
  case 1:
    fmt.println("1")
    // 继续执行下一个case
    fallthrough
  case 2,3:
    fmt.println("2,3")
}

// goto(通过标签实现代码间的跳转)
onExit: fmt.Println(err) 
goto onExit
```

## 函数

```go
// 定义
func foo(a , b int) int {}
func initValue() (a int, b int) {
	a = 1
	b = 2
	return
}
// 变量定义成函数
var f func()

// 匿名函数定义调用
func(name string) {
	fmt.Printf("hello, %s", name)
}("123")

// 闭包
// 定义一个玩家生成器，它的返回类型为 func() (string, int)，输入名称，返回新的玩家数据
func genPlayer(name string) func() (string, int)  {
	// 定义玩家血量
	hp := 1000
	// 返回闭包
	return func() (string, int) {
		// 引用了外部的 hp 变量, 形成了闭包
		return name, hp
	}
}
```

## 对象

```go
type Student struct { // 首字母大写可包外访问

	StudentID int64 // 首字母大写可对外访问
	Name string
	birth string //不可对外访问
}
```

## defer

* `defer` 延迟执行的函数会在 `return` 返回前执行，所以一般用来进行资源释放等清理工作
* 多个被 `defer` 的函数会按照先进后出的顺序被调用

## context

* 当需要在多个 `goroutine` 中传递上下文信息时，可以使用 `Context` 实现
* `Context` 除了用来传递上下文信息，还可以用于传递终结执行子任务的相关信号，中止多个执行子任务的 `goroutine`