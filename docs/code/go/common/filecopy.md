# 文件拷贝

```go
package main

import (
	"fmt"
	"io"
	"os"
)

func main() {
	CopyFile("./target.txt", "./source.txt")
	fmt.Println("Copy Done!")
}

func CopyFile(src, dest string) (written int64, err error) {
	srcFile, err := os.Open(src)
	if err != nil {
		return
	}

	defer srcFile.Close()

	destFile, err := os.Create(dest)
	if err != nil {
		return
	}
	defer destFile.Close()

	return io.Copy(destFile, srcFile)
}

```