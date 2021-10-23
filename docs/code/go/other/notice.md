# Go注意事项

## defer

* 不要在`for`循环中使用`defer`，因为`defer`只有在函数最后去执行。

```go
// bad
for _, filename := range filenames {
    f, err := os.Open(filename)
    if err != nil {
        return err
    }
    defer f.Close()
}

// good
for _, filename := range filenames {
    if err := doFile(filename); err != nil {
        return err
    }
}
func doFile(filename string) error {
    f, err := os.Open(filename)
    if err != nil {
        return err
    }
    defer f.Close()
}
```

* `defer` 表达式的函数如果在 `panic` 后面，则这个函数无法被执行。

```go
// defer 逻辑不执行
func main() {
    panic("a")
    defer func() {
        fmt.Println("b")
    }()
}

// 执行defer逻辑
func main() {
	defer func() {
		fmt.Println("b")
	}()
	panic("a")
}

// goroutine 外部函数，也就是 G() 函数是没办法捕获的，程序直接崩溃退出。
func G() {
	defer func() {
		// goroutine 外进行 recover
		if err := recover(); err != nil {
			fmt.Println("捕获异常:", err)
		}
		fmt.Println("c")
	}()

	// 创建 goroutine 调用 F 函数
	go F()
	time.Sleep(time.Second)
}

func F() {
	defer func() {
		fmt.Println("b")
	}()
	// goroutine 内部抛出panic
	panic("a")
}

func main() {
	G()
}
///// 输出
b
panic: a

goroutine 6 [running]:
main.F()
	xxx.go:96 +0x5b
created by main.G
	xxx.go:87 +0x57
exit status 2
```