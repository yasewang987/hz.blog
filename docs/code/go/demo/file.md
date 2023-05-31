# Go文件相关操作

```go
package main

import (
	"bufio"
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"io"
	"io/fs"
	"log"
	"os"
	"path"
	"path/filepath"
	"runtime"
	"sync"
)

var homePath string

func main() {
	homePath, _ = os.UserHomeDir()
	demo8()
}

// 拼接两个目录路径
func demo1() {
	files, _ := os.ReadDir(homePath)
	for _, f := range files {
		if f.IsDir() {
			tmpDir := path.Join(homePath, f.Name())
			fmt.Println(tmpDir)
		}
	}
}

// 获取当前目录下的所有文件及文件夹
func demo2() {
	files, _ := filepath.Glob(path.Join(homePath, "*"))
	// 只是返回文件/文件夹名
	fmt.Println(files)
}

// Walk函数会遍历指定的目录下的文件树，对每一个该文件树中的目录和文件都会调用walkFn，包括根目录。
// 所有访问文件/目录时遇到的错误都会传递给walkFn过滤。
// Walk函数不会遍历文件树中的符号链接（快捷方式）文件包含的路径。
func demo3() {
	filepath.Walk(homePath, func(path string, info fs.FileInfo, err error) error {
		fmt.Println("路径：", path)
		fmt.Println("是否文件夹：", info.IsDir())
		fmt.Println("文件名：", info.Name())
		fmt.Println("大小：", info.Size())
		fmt.Println("权限：", info.Mode())
		fmt.Println("修改时间", info.ModTime())
		fmt.Println()
		return err
	})
}

// 获取文件MD5
func demo4() {
	file, _ := os.Open(path.Join(homePath, "1.txt"))
	hash := md5.New()
	io.Copy(hash, file)
	value := hex.EncodeToString(hash.Sum(nil))
	fmt.Println(value)
}

// 判断文件/文件夹是否存在
func demo5() {
	file, err := os.Stat(homePath)
	fmt.Println("存在：", err == nil)

	// 文件/文件夹
	fmt.Println("文件夹：", file.IsDir())
	fmt.Println("文件：", !file.IsDir())
}

// 获取文件夹名
func demo6() {
	// 文件夹名称
	base := filepath.Base(homePath)
	fmt.Println(base)

	// 父目录
	father := filepath.Dir(homePath)
	fmt.Println(father)
}

// 使用缓冲写文件
func demo7() {
	var lines = []string{
		"Go",
		"is",
		"the",
		"best",
		"programming",
		"language",
		"in",
		"the",
		"world",
	}

	file, err := os.Create("tmp.txt")
	if err != nil {
		log.Fatalln(err)
	}
	defer file.Close()

	// 创建缓冲
	buffer := bufio.NewWriter(file)

	// 写入数据
	for _, line := range lines {
		_, err := buffer.WriteString(line + "\n")
		if err != nil {
			log.Fatalln(err)
		}
	}

	// 刷入数据
	if err = buffer.Flush(); err != nil {
		log.Fatalln(err)
	}
}

// 并发写文件
func demo8() {
	file, err := os.OpenFile("tmp22.txt", os.O_CREATE|os.O_RDWR|os.O_TRUNC, 0777)
	if err != nil {
		log.Fatalln(err)
		return
	}
	defer file.Close()

	// 创建缓冲
	bufferWriter := bufio.NewWriter(file)

	// 并发控制
	var wg sync.WaitGroup
	var mux sync.Mutex
	limit := make(chan struct{}, runtime.GOMAXPROCS(runtime.NumCPU()))

	for i := 0; i < 10000; i++ {
		limit <- struct{}{}
		wg.Add(1)

		go func(j int) {
			// 处理错误
			defer func() {
				if e := recover(); e != nil {
					log.Fatalln(e)
				}
				wg.Done()
				<-limit
			}()

			// 业务处理
			strId := fmt.Sprintf("%v", j)
			strName := fmt.Sprintf("user_%v", j)
			// 加锁写入数据
			mux.Lock()
			_, err := bufferWriter.WriteString(strId + strName + "\n")
			if err != nil {
				log.Fatalln(err)
				return
			}
			mux.Unlock()
		}(i)
	}
	wg.Wait()
	// 刷入磁盘
	bufferWriter.Flush()
	bufferWriter.Flush()
}
```