# Go Http请求

## 客户端
### GET请求

```go
func main(){
    resp, err := http.Get("http://httpbin.org/get?name=zhaofan&age=23")
    if err != nil {
        fmt.Println(err)
        return
    }
    defer resp.Body.Close()
    body, _ := ioutil.ReadAll(resp.Body)
    fmt.Println(string(body))
    // 反序列化
    res := make(map[string]interface{})
    _ = json.Unmarshal(body,&res)
}

// 把一些参数做成变量而不是直接放到url中

func main(){
    // 组合到querystring上
    params := url.Values{}
    Url, err := url.Parse("http://httpbin.org/get")
    if err != nil {
        return
    }
    params.Set("name","zhaofan")
    params.Set("age","23")
    //如果参数中有中文参数,这个方法会进行URLEncode
    Url.RawQuery = params.Encode()
    urlPath := Url.String()
    fmt.Println(urlPath) // https://httpbin.org/get?age=23&name=zhaofan
    resp,err := http.Get(urlPath)
    defer resp.Body.Close()
    body, _ := ioutil.ReadAll(resp.Body)
    fmt.Println(string(body))
}

// GET请求添加请求头
func main() {
    client := &http.Client{
        Timeout: 5 * time.Second, //超时时间
    }
    req,_ := http.NewRequest("GET","http://httpbin.org/get",nil)
    req.Header.Add("name","zhaofan")
    req.Header.Add("age","3")
    resp,_ := client.Do(req)
    defer resp.Body.Close()
    body, _ := ioutil.ReadAll(resp.Body)
    fmt.Printf(string(body))
}
```
### POST使用

```go
// 发送JSON数据的post请求
func main() {
    client := &http.Client{}
    data := make(map[string]interface{})
    data["name"] = "zhaofan"
    data["age"] = "23"
    bytesData, _ := json.Marshal(data)
    req, _ := http.NewRequest("POST","http://httpbin.org/post",bytes.NewReader(bytesData))
    resp, _ := client.Do(req)
    body, _ := ioutil.ReadAll(resp.Body)
    defer resp.Body.Close()
    fmt.Println(string(body))
}
```

### Context设置超时时间

```go
package main

import (
    "context"
    "fmt"
    "net/http"
    "time"
)

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    req, err := http.NewRequestWithContext(ctx, "GET", "https://jsonplaceholder.typicode.com/posts/1", nil)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    client := http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    defer resp.Body.Close()

    if resp.StatusCode == http.StatusOK {
        fmt.Println("Request successful")
    } else {
        fmt.Println("Request failed with status:", resp.Status)
    }
}
```

## Http服务端

```go
func main() {
	// 加载配置
	conf.GlobalConfig = &conf.Config{}
	conf.GlobalConfig.InitConfig("./config.yaml")

	// 启动http-listen
    // get
	http.HandleFunc("/", func(rw http.ResponseWriter, r *http.Request) {
		rw.Write([]byte("hello"))
	})
    // post
	http.HandleFunc("/validateToken", ValidateToken)
	http.ListenAndServe(":9999", nil)
}

type tokenRes struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// 验证token
func ValidateToken(w http.ResponseWriter, r *http.Request) {
	b, err := ioutil.ReadAll(r.Body)
	if err != nil {
		panic(err)
	}
	token := string(b)

	// 验证token
	resToken := auth.VilidateToken(token, "123456")

	res := tokenRes{
		Code:    0,
		Message: "认证通过",
	}
	if !resToken {
		res.Code = 1
		res.Message = "token错误，请重新输入!"
	}

	// 返回
	err = json.NewEncoder(w).Encode(res)
	if err != nil {
		log.Fatal(err)
	}
}
```

### server优雅关闭

`kill`向进程发送了`SIGTERM`信号，只需要捕获这个信号并进行处理即可。

```go
// 服务注册
func registerService(ctx context.Context) {
 tc := time.NewTicker(5 * time.Second)
 for {
  select {
  case <-tc.C:
   // 上报状态
   log.Println("status update success")
  case <-ctx.Done():
   tc.Stop()
   log.Println("stop update success")
   return
  }
 }
}

// 服务销毁
func destroyService() {
 log.Println("destroy success")
}

// 优雅关闭
func gracefulShutdown() {
 mainCtx, mainCancel := context.WithCancel(context.Background())
 // 用ctx初始化资源，mysql，redis等
 // ...

 // 释放资源
 defer func() {
  mainCancel()
  // 主动注销服务
  destroyService()

  // 清理资源，mysql，redis等
  // ...
 }()

 mx := http.NewServeMux()
 mx.HandleFunc("/foo", func(w http.ResponseWriter, r *http.Request) {
  time.Sleep(time.Duration(rand.Intn(10)) * time.Second)
  w.Write([]byte("Receive path foo\n"))
 })

 srv := http.Server{
  Addr:    ":8009",
  Handler: mx,
 }

 // ListenAndServe也会阻塞，需要把它放到一个goroutine中
 go func() {
  // 当Shutdown被调用时ListenAndServe会立刻返回http.ErrServerClosed的错误，抛出了panic
  // 因而也导致main goroutine被退出，并没有达到运行Shutdown()预期，需要忽略http.ErrServerClosed错误
  if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
   panic(err)
  }
 }()

 // 需要在服务启动后才在注册中心注册
 go registerService(mainCtx)
 
 // 定义channel阻塞进程
 signalCh := make(chan os.Signal, 1)
 // 设置我们要监听的信号，一旦有程序设定的信号发生时，信号会被写入channel中
 signal.Notify(signalCh, syscall.SIGINT, syscall.SIGTERM)

 // 等待信号
 sig := <-signalCh
 log.Printf("Received signal: %v\n", sig)

 // 设定一个关闭的上限时间
 ctxTimeout, cancelTimeout := context.WithTimeout(context.Background(), 5*time.Second)
 defer cancelTimeout()

 if err := srv.Shutdown(ctxTimeout); err != nil {
  select {
  case <-ctxTimeout.Done():
   // 由于达到超时时间服务器关闭，未完成优雅关闭
   log.Println("timeout of 5 seconds.")
  default:
   // 其他原因导致的服务关闭异常，未完成优雅关闭
   log.Fatalf("Server shutdown failed: %v\n", err)
  }
  return
 }

 // 正确执行优雅关闭服务器
 log.Println("Server shutdown gracefully")
}
```