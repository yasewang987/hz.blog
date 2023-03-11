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

	//cmd := exec.Command("bash", "echo $NAME && echo $AGE")
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

## 结合协程调用，可控制中断调用

```go
package main

import (
    "context"
    "fmt"
    "os/exec"
    "time"
)

type result struct {
    output []byte
    err    error
}
// 执行一个cmd，让他在一个协程里面执行2s，
// 1s的时候  杀死cmd
func main() {
    var (
        ctx        context.Context
        cancelFunc context.CancelFunc
        cmd        *exec.Cmd
        resultChan chan *result
        res        *result
    )

    // 创建一个结果队列
    resultChan = make(chan *result, 1)
    /*
        1. WithCancel()函数接受一个 Context 并返回其子Context和取消函数cancel
        2. 新创建协程中传入子Context做参数，且需监控子Context的Done通道，若收到消息，则退出
        3. 需要新协程结束时，在外面调用 cancel 函数，即会往子Context的Done通道发送消息
        4. 注意：当 父Context的 Done() 关闭的时候，子 ctx 的 Done() 也会被关闭
    */
    ctx, cancelFunc = context.WithCancel(context.TODO())
    // 起一个协程
    go func() {
        var (
            output []byte
            err    error
        )
        // 生成命令
        cmd = exec.CommandContext(ctx, "bash", "-c", "sleep 3;echo hello;")
        // 执行命令cmd.CombinedOutput(),且捕获输出
        output, err = cmd.CombinedOutput()
        // 用chan跟主携程通信,把任务输出结果传给main协程
        resultChan <- &result{
            err:    err,
            output: output,
        }
    }()
    // Sleep 1s
    time.Sleep(time.Second * 1)
    // 取消上下文,取消子进程,子进程就会被干掉
    cancelFunc()
    // 从子协程中取出数据
    res = <-resultChan
    // 打印子协程中取出数据
    fmt.Println(res.err)
    fmt.Println(string(res.output))
}
```

## cobra

cobra遵循 `commands, arguments & flags`结构。

```bash
#appname command  arguments
docker pull alpine:latest

#appname command flag
docker ps -a

#appname command flag argument
git commit -m "msg"
```

* 轻松创建基于子命令的 CLI：如 app server、 app fetch等。
* 自动添加 -h, --help等帮助性Flag
* 自动生成命令和Flag的帮助信息
* 创建完全符合 POSIX 的Flag(标志)（包括长、短版本）
* 支持嵌套子命令
* 支持全局、本地和级联Flag
* 智能建议（ app srver... did you mean app server?）
* 为应用程序自动生成 shell 自动完成功能（bash、zsh、fish、powershell）
* 为应用程序自动生成man page
* 命令别名，可以在不破坏原有名称的情况下进行更改
* 支持灵活自定义help、usege等。
* 无缝集成viper构建12-factor应用

初始化：

```bash
# 安装cli，快速创建出一个cobra基础代码结构
go install github.com/spf13/cobra-cli@latest

mkdir myapp && cd myapp
# 初始化之后会自动引入cobra
go mod init myapp
# 添加wget子命令
cobra-cli add wget
```

示例代码

```go
////// main.go
package main

import "myapp/cmd"

func main() {
	cmd.Execute()
}

////// cmd/root.go
package cmd

import (
	"os"

	"github.com/spf13/cobra"
)

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "myapp",
	// 简介
	Short: "这是myapp的demo",
	// 详细介绍
	Long: `这是myapp的详细介绍，使用示例如下：
	myapp ping
	myapp wget`,
	// Uncomment the following line if your bare application
	// has an action associated with it:
	// Run: func(cmd *cobra.Command, args []string) { },
}

func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

func init() {
	rootCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}

////// cmd/wget.go
package cmd

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/spf13/cobra"
)

var output string

// wgetCmd represents the wget command
var wgetCmd = &cobra.Command{
	Use:     "wget",
	Example: "myapp wget www.baidu.com",
	Short:   "wget用于下载使用",
	Long:    `wget可以从互联网下载任意可下载的资源`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("wget start")
		out, err := os.Create(output)
		if err != nil {
			log.Fatalln(err)
		}
		defer out.Close()

		res, err := http.Get(args[0])
		if err != nil {
			log.Fatalln(err)
		}
		defer res.Body.Close()

		_, err = io.Copy(out, res.Body)
		if err != nil {
			log.Fatalln(err)
		}
		fmt.Println("wget end")
	},
}

func init() {
	rootCmd.AddCommand(wgetCmd)

	// args:cobra内置的参数验证也是比较多，NoArgs、OnlyValidArgs、MinimumNArgs、MaximumNArgs
	// flags:flag包含局部和全局两种，全局flag在父命令定义后子命令也会生效，而局部flag则在哪定义就在哪生效。
	// StringVarp、 BoolVarP 用于flag数据类型限制
	wgetCmd.Flags().StringVarP(&output, "output", "o", "", "output file")
	// 约束flag的参数必须输入
	wgetCmd.MarkFlagRequired("output")
}
```

在go中很流行的包`viper`用于解析配置文件，比如kubectl 的yml，以及各种json

```go
var author string
var u string
var pw string
func init () {
	rootCmd.PersistentFlags().StringVar(&author,"author","YOUR NAME","Author name for copyright attribution")
	viper.BindPFlag("author",rootCmd.PersistentFlags().Lookup("author"))

	// flag还可以做依赖，比如下面username和password必须同时接收到参数
	rootCmd.Flags().StringVarP(&u,"username","u","","Username (required if password is set)")
	rootCmd.Flags().StringVarP(&pw,"password","p","","Password (required if username is set)")
	rootCmd.MarkFlagsRequiredTogether("username","password")
}
```