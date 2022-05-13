# Go-泛型

相对于使用 `interface{}`，泛型类型参数的巨大优势在于，`T` 的最终类型在编译时就会被推导出来。为 `T` 定义一个类型约束，完全消除了运行时检查。如果用作 `T` 的类型不满足类型约束，代码就不会编译通过。

## 泛型使用场景

1. 使用内置的容器类型，如 `slices`、`maps` 和 `channels`
1. 实现通用的数据结构，如 `linked list` 或 `tree`
1. 编写一个函数，其实现对许多类型来说都是一样的，比如一个排序函数

当不同的类型有不同的实现时，泛型就不是一个好的选择。另外，不要把 `Read(r io.Reader)` 这样的接口函数签名改为 `Read[T io.Reader](r T)` 这样的通用签名。

## 简单介绍

* 没有泛型前的示例：

```go
type Node struct {
    value interface{}
}

// 限制 value 可能持有的类型，例如整数和浮点数，只能在运行时检查这个限制
func (n Node) IsValid() bool {
    switch n.value.(type) {
        case int, float32, float64:
            return true
        default:
            return false
    }
}
```

* 简单泛型示例：

```go
type Node[T] struct {
    value T
}

func (n Node[T]) Value() T {
    return n.value
}

func main() {
    n := Node[int]{
        value: 5,
    }
}

double := n.Value() * 2

// 返回一个 map 中所有键的 slice
func MapKeys[Key comparable, Val any](m map[Key]Val) []Key {
    s := make([]Key, 0, len(m))
    for k := range m {
        s = append(s, k)
    }
    return s
}
```

## 类型约束

```go
// 任何类型
type Node[T any] struct {
    value T
}

// comparable
type Node[T comparable] struct {
    value T
}

// 1.18之后的interface
type Numeric interface {
    int | float32 | float64
}
type Node[T Numeric] struct {
    value T
}
```

## 性能

要了解泛型的性能及其在 Go 中的实现，首先需要了解一般情况下实现泛型的两种最常见方式。

### 虚拟方法表

在编译器中实现泛型的一种方法是使用 `Virtual Method Table`。泛型函数被修改成只接受`指针`作为参数的方式。然后，这些值被分配到堆上，这些值的指针被传递给泛型函数。这样做是因为指针看起来总是一样的，不管它指向的是什么类型。

如果这些值是对象，而泛型函数需要调用这些对象的方法，它就不能再这样做了。该函数`只有一个指向对象的指针`，不知道它们的方法在哪里。因此，它需要一个可以查询方法的内存地址的表格：`Virtual Method Table`。这种所谓的动态调度已经被 Go 和 Java 等语言中的接口所使用。

`Virtual Method Table` 不仅可以用来实现泛型，还可以用来实现其他类型的多态性。然而，推导这些指针和调用虚拟函数要比直接调用函数慢，而且使用 `Virtual Method Table` 会阻止编译器进行优化。

### 单态化

一个更简单的方法是单态化`Monomorphization`，编译器为每个被调用的数据类型生成一个泛型函数的副本。

```go
func max[T Numeric](a, b T) T {
    // ...
}

larger := max(3, 5)
```

由于上面显示的`max`函数是用两个整数调用的，编译器在对代码进行单态化时将为 `int` 生成一个 `max` 的副本。

```go
func maxInt(a, b int) int {
    // ...
}

larger := maxInt(3, 5)
```

最大的优势是，`Monomorphization` 带来的运行时性能明显好于使用 `Virtual Method Table`。直接方法调用不仅`更有效率`，而且还能适用整个编译器的优化链。不过，这样做的代价是`编译时长`，为所有相关类型生成泛型函数的副本是非常`耗时`的。

### Go的实现

快速编译很重要，但运行时性能也很重要。为了满足这些要求，Go在实现泛型时混合两种方法。

Go 使用 `Monomorphization`，但试图减少需要生成的函数副本的数量。它不是为每个类型创建一个副本，而是为内存中的每个布局生成一个副本：`int、float64、Node` 和其他所谓的 "值类型" 在内存中看起来都不一样，因此泛型函数将为所有这些类型复制副本。

与值类型相反，指针和接口在内存中总是有相同的布局。编译器将为指针和接口的调用生成一个泛型函数的副本。就像 `Virtual Method Table` 一样，泛型函数接收指针，因此需要一个表来动态地查找方法地址。在 Go 实现中的字典与虚拟方法表的性能特点相同。



