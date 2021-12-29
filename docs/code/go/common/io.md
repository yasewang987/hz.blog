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
```