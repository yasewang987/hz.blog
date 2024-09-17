# Go字符串操作

## strconv

优先使用 strconv 而不是 fmt

## 获取子字符串

```go
////// 获取子字符串
func subStr() {
  s := "aaa:::bbb cc dd"
  portPrefix := ":::"
  portEndfix := " "
  startIndex := strings.Index(s, portPrefix)
  if startIndex < 0 {
    continue
  }
  endIndex := strings.LastIndex(s, portEndfix)
  byteSubStr := []byte(s)[startIndex+len(portPrefix):endIndex]
  subStr := string(byteSubStr)
  // 输出 "bbb cc"
  fmt.Println(subStr)
}
```

## bytes

bytes包提供了一系列用于操作[]byte类型的函数，这非常有用，特别是当你需要处理大量的字符串和切片时。通过使用`bytes.Buffer`，你可以高效地构建和修改字符串，而不必担心频繁的内存分配和字符串拼接导致的性能问题。

```go
//// 实现了io.Reader和io.Writer接口的可变大小的字节缓冲区
package main
import (
    "bytes"
    "fmt"
)
func main() {
    // 初始化一个Buffer
    var b bytes.Buffer
    // 写入字符串
    b.Write([]byte("Hello "))
    // 使用Fprintf直接写入Buffer
    fmt.Fprintf(&b, "World!")
    // 读取Buffer中的所有数据
    fmt.Println(b.String())
}


//// 写入和读取：
// Write: 写入字节数组
// WriteByte: 写入单个字节
b.WriteByte(byte('A'))
// WriteString: 写入字符串
// Read: 读取数据到字节数组
// ReadByte: 读取单个字节
firstByte, _ := b.ReadByte()
// ReadString: 读取字符串


//// 控制能力
// Bytes: 返回未读部分的切片
content := b.Bytes()
// Len: 返回未读部分的长度
length := b.Len()
// Cap: 返回缓冲区的容量
capacity := b.Cap()

//// 重置Buffer
// Reset: 清空Buffer的内容，可以被再次使用
b.Reset()
// 验证Buffer是否为空
if b.Len() == 0 {
    fmt.Println("Buffer is empty now.")
}

//// 读取字符串直到分隔符
// ReadString: 读取数据直到遇到指定的分隔符为止
b.WriteString("Hello,World!Goodbye,World!")
substring, _ := b.ReadString(',')
fmt.Printf("Substring: %s\n", substring)

//// 示例
var buffer bytes.Buffer
for i := 0; i < 10; i++ {
    buffer.WriteString(fmt.Sprintf("Item %d, ", i))
}
// 去除尾部的", "
result := buffer.String()
result = result[:buffer.Len()-2]
fmt.Println(result)
```