# Go-Select

## 基础

GoLang select 语句类似于 switch 语句，用于多通道操作。在提供的任何case条件准备好之前，此语句会阻塞。

* 要求 `case` 语句后面必须为 `channel` 的收发操作
* 当有多个 `case` 语句同时返回时，`select` 将会随机选择一个 `case` 进行处理
* 如果 `select` 语句的最后包含 `default` 语句，该 `select` 语句将会变为非阻塞型，即当其他所有的 `case` 语句都被阻塞无法返回时，`select` 语句将直接执行 `default` 语句返回结果


```go
select {
case val := <- ch1: // 从 ch1 读取数据
	fmt.Printf("get value %d from ch1\n", val)
case ch2 <- 2 : // 使用 ch2 发送消息
	fmt.Println("send value by ch2")
case <-time.After(2 * time.Second): // 超时设置
	fmt.Println("Time out")
	return
}
```