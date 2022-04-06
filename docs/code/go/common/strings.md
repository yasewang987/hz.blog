# Go字符串操作

## strconv

优先使用 strconv 而不是 fmt
## 获取字字符串

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