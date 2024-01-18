# IO库

## io.Reader

`io.Reader` 表示一个读取器，它将数据从某个资源读取到传输缓冲区。在缓冲区中，数据可以被流式传输和使用。

接口定义了一个 `Read(p []byte)(n int, err error)` 方法，主要作用是将源数据读取到 `p` 中。并返回读取的字节数 `n`。

```go
///// []byte 转 io.Reader
///// []byte -> NewReader -> Reader
func main() {
  data := []byte("Hello World")

  // 转换成Reader
  reader := bytes.NewReader(data)

  // 从Reader中将数据读取出来
  buf := make([]byte, len(data))
  if _, err := reader.Read(buf); err != nil {
    log.Fatal(err)
  }
  // 会输出 Hello World
  fmt.Println(buf)
}

///// io.Reader 转 []byte
///// Reader -> Buffer -> []byte
func main() {
  // 数据准备
  strReader := strings.NewReader("Hello World")

  // 将数据从 Reader 中读取到 Buffer
  buf := &bytes.Buffer{}
  buf.ReadFrom(strReader)

  // 从Buffer中读取数据到 []byte
  data := buf.Bytes()
  // 输出 World
  fmt.Println(string(data[6:]))
}

///// 分段读取示例
///// 每次读 4 个字节，然后打印输出，直到结尾
func main() {
  reader := strings.NewReader("Clear is better than clever")
  p := make([]byte, 4)

  for {
    n, err := reader.Read(p)
    if err != nil {
      if err == io.EOF {
        //EOF: 0
        fmt.Println("EOF:", n)
      }
      fmt.Println(err)
      os.Exit(1)
    }
    // 输出正常读取的字符
    // 4 Clea
    //4 r is
    //4  bet
    //4 ter
    //4 than
    //4  cle
    //3 ver
    fmt.Println(n, string(p[:n]))
  }
}
```

## io.Writer

`io.Writer` 表示一个编写器，它从缓冲区读取数据，并将数据写入目标资源。

定义了一个方法 `Write(p []byte) (n int, err error)`, 将 `p` 中的对象写入到对象数据（buffer，文件等）中，返回写入的字节数 `n`。

```go
func main() {
  // 数据准备
  data := []byte("Hello World, ")

  // 准备缓存Buffer
  var buf bytes.Buffer
  buf.Write(data)
  // 字符串拼接到 Buffer 里
  fmt.Fprintf(&buf, " welcome to golang!")

  // Buffer 的内容输出到标准输出设备
  buf.WriteTo(os.Stdout)

  // hello world ,  welcome to golang !
}

// 检查服务状态
func (s *ServiceInfo) checkServiceStatus(port string) error {
	cmdStr := "curl http://localhost:" + port + "/check"
	cmd := exec.Command("sh", "-c", cmdStr)
	var outInfo bytes.Buffer
	cmd.Stdout = &outInfo
	err := cmd.Run()
	if err != nil {
		return err
	}
	ns := make(map[string]interface{})
	if err = json.Unmarshal(outInfo.Bytes(), &ns); err != nil {
		return err
	}
	s.ServiceVersion = ns["serviceVersion"].(string)
	s.ServiceHealth = ns["serviceStatus"].(float64) <= 0
	return nil
}
```

## bufio

`bufio` 顾名思义，就是在缓冲区读写数据，比直接读写文件或网络中的数据，性能更好些。

它的数据类型主要有 `bufio.Reader`、`bufio.Writer`、`bufio.ReadWriter` 和 `bufio.Scanner`。

`bufio.Reader` 的数据结构：

```go
type Reader struct {
 // 缓冲区
 buf          []byte
 // 缓冲区的数据源
 rd           io.Reader
 // 缓冲区读写索引位置
 r, w         int
 err          error
 // 未读字节的上一个字节
 lastByte     int
 // 未读字符的上一个字符的大小
 lastRuneSize int
}
```

使用 `bufio.Reader` 时，需要先初始化，`bufio` 包提供了两个初始化的函数，分别是 `NewReaderSize` 和 `NewReader`。

```go
// 两个函数的返回值都是 *bufio.Reader 类型。
func NewReaderSize(rd io.Reader, size int) *Reader {
 // Is it already a Reader?
 b, ok := rd.(*Reader)
 if ok && len(b.buf) >= size {
  return b
 }
 if size < minReadBufferSize {
  size = minReadBufferSize
 }
 r := new(Reader)
 r.reset(make([]byte, size), rd)
 return r
}

func NewReader(rd io.Reader) *Reader {
 // 默认值 4096
 return NewReaderSize(rd, defaultBufSize)
}
```

`bufio.Reader` 提供了 15 个方法，我们介绍两个比较常用的方法，分别是 `Read` 和 `ReadBytes`。

```go
// 将缓冲区中的数据，读取到 p 中，并返回读取的字节大小和错误。
func (b *Reader) Read(p []byte) (n int, err error) {
 // 省略代码 ...
 if b.r == b.w {
  if b.err != nil {
   return 0, b.readErr()
  }
  if len(p) >= len(b.buf) {
   // Large read, empty buffer.
   // Read directly into p to avoid copy.
   n, b.err = b.rd.Read(p)
   if n < 0 {
    panic(errNegativeRead)
   }
   if n > 0 {
    b.lastByte = int(p[n-1])
    b.lastRuneSize = -1
   }
   return n, b.readErr()
  }
  // 省略代码 ...
  b.w += n
 }

 // copy as much as we can
 // Note: if the slice panics here, it is probably because
 // the underlying reader returned a bad count. See issue 49795.
 n = copy(p, b.buf[b.r:b.w])
 b.r += n
 b.lastByte = int(b.buf[b.r-1])
 b.lastRuneSize = -1
 return n, nil
}


// 读取缓冲区中的数据截止到分隔符 delim 的位置，并返回数据和错误。
func (b *Reader) ReadBytes(delim byte) ([]byte, error) {
 full, frag, n, err := b.collectFragments(delim)
 // Allocate new buffer to hold the full pieces and the fragment.
 buf := make([]byte, n)
 n = 0
 // Copy full pieces and fragment in.
 for i := range full {
  n += copy(buf[n:], full[i])
 }
 copy(buf[n:], frag)
 return buf, err
}
```

`Read、ReadBytes` 方法使用示例:

```go
// p 字节切片的长度，一个中文字符是 3 个字节，一个英文字符是 1 个字节。
func main() {
 f, _ := os.Open("/Users/frank/GolandProjects/go-package/lesson14/file.txt")
 defer f.Close()
 r := bufio.NewReader(f)
 p := make([]byte, 12)
 index, _ := r.Read(p)
 fmt.Println(index)
 fmt.Println(string(p[:index]))
}

// 分隔符参数是 byte 类型，使用单引号。
func main() {
 f, _ := os.Open("/Users/frank/GolandProjects/go-package/lesson14/file.txt")
 defer f.Close()
 r := bufio.NewReader(f)
  bs, _ := r.ReadBytes('\n')
 fmt.Println(string(bs))
}
```

## 实现 `io.Closer` 接口的自定义服务平滑关闭

```go
package main

import (
    "fmt"
    "os"
    "os/signal"
    "sync"
    "time"
)

type MyService struct {
    mu sync.Mutex
    // 其他服务相关的字段
}

func (s *MyService) Close() error {
    s.mu.Lock()
    defer s.mu.Unlock()

    // 执行关闭服务的操作
    fmt.Println("Closing MyService...")
    return nil
}

func main() {
    service := &MyService{}

    // 等待中断信号来优雅地关闭服务
    stop := make(chan os.Signal, 1)
    signal.Notify(stop, os.Interrupt)

    <-stop // 等待中断信号
    fmt.Println("Shutting down...")

    // 调用Close方法进行平滑关闭
    if closer, ok := service.(interface{ Close() error }); ok {
        if err := closer.Close(); err != nil {
            fmt.Println("Error closing service:", err)
        }
    }
    fmt.Println("Shutdown complete")
}

```

