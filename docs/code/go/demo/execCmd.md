# Go调用系统命令

## 系统自带exec库

```go
package main

import (
	"bytes"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
)

func main() {
	//demo1()
	//demo2()
	http.HandleFunc("/cal", demo3)
	http.HandleFunc("/cal2", demo5)
	//http.ListenAndServe(":8080", nil)
	//demo4()
	//demo6()
	demo7()
}

// 输出到命令行
func demo1() {
	cmd := exec.Command("cal")
	// 将exec.Cmd对象的Stdout和Stderr这两个字段都设置为os.Stdout，那么输出内容都将显示到标准输出
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		log.Fatalf("cmd.run() faild: %v\n", err)
	}
}

// 输出到文件
func demo2() {
	// os.OpenFile打开一个文件，指定os.O_CREATE标志让操作系统在文件不存在时自动创建一个，返回该文件对象*os.File。*os.File实现了io.Writer接口
	f, err := os.OpenFile("out.txt", os.O_CREATE|os.O_WRONLY, os.ModePerm)
	if err != nil {
		log.Fatalf("openfile error: %v\n", err)
	}

	cmd := exec.Command("cal")
	cmd.Stdout = f
	cmd.Stderr = f
	if err = cmd.Run(); err != nil {
		log.Fatalf("cmd exec err: %v\n", err)
	}
}

// 发送到网络
// 调用示例：curl 'localhost:8080/cal?year=2021&month=2'
func demo3(w http.ResponseWriter, r *http.Request) {
	year := r.URL.Query().Get("year")
	month := r.URL.Query().Get("month")

	cmd := exec.Command("cal", month, year)
	cmd.Stdout = w
	cmd.Stderr = w
	if err := cmd.Run(); err != nil {
		log.Fatalf("cmd exec err:%v\n", err)
	}
}

// 保存到内存
func demo4() {
	cmd := exec.Command("cal")

	// 手动使用buf实现
	var buf bytes.Buffer
	cmd.Stdout = &buf
	cmd.Stderr = &buf
	if err := cmd.Run(); err != nil {
		log.Fatalf("cmd exec error:%v\n", err)
	}
	log.Println(buf.String())

	// 使用cmd的CombinedOutput代替上面的方法
	b, err := cmd.CombinedOutput()
	if err != nil {
		log.Fatalf("cmd exec error:%v\n", err)
	}
	log.Println(string(b))
}

// 使用io.MultiWriter整合输出到多个对象中
func demo5(w http.ResponseWriter, r *http.Request) {
	year := r.URL.Query().Get("year")
	month := r.URL.Query().Get("month")

	buf := bytes.NewBuffer(nil)
	f, _ := os.OpenFile("out.txt", os.O_WRONLY|os.O_CREATE, os.ModePerm)
	// 整合多个输出对象
	mw := io.MultiWriter(w, buf, f)
	cmd := exec.Command("cal", month, year)
	cmd.Stderr = mw
	cmd.Stdout = mw
	if err := cmd.Run(); err != nil {
		log.Fatalf("cmd exec err: %v\n", err)
	}
	log.Println(buf.String())
}

// 设置环境变量
func demo6() {
	nameEnv := "NAME=hz"
	ageEnv := "AGE=18"
	myEnvs := append(os.Environ(), nameEnv, ageEnv)

	cmd := exec.Command("sh", "-c", "echo $NAME && echo $AGE")
	cmd.Env = myEnvs
	out, err := cmd.CombinedOutput()
	if err != nil {
		log.Fatalf("cmd exec err:%v\n", err)
	}
	log.Println(string(out))
}

// LookPath检查命令是否存在
func demo7() {
	path, err := exec.LookPath("ls")
	if err != nil {
		log.Fatalf("cmd is not exists: %v", err)
	} else {
		log.Println("the cmd path: ", path)
	}
	path, err = exec.LookPath("hzcmd")
	if err != nil {
		log.Fatalf("cmd is not exists: %v", err)
	} else {
		log.Println("the cmd path: ", path)
	}
}
```

## cobra

```go
```
