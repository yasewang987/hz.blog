# Go-RPC介绍

使用go语言内置的`net/rpc`实现

## 简单示例

新建一个文件夹gotest，然后创建`server/math_server.go`

```go
package server

type MathService struct {
}

type Args struct {
	A, B int
}

func (m *MathService) Add(args Args, reply *int) error {
	*reply = args.A + args.B
	return nil
}
```

在根目录下创建服务端`server_main.go`

```go
package main

import (
	"log"
	"net"
	"net/rpc"
	"rpctest/server"
)

func main() {
	rpc.RegisterName("MathService", new(server.MathService))
	l, err := net.Listen("tcp", ":8088") //注意 “：” 不要忘了写
	if err != nil {
		log.Fatal("listen error", err)
	}
	rpc.Accept(l)
}
```

上面代码中：

* 通过 RegisterName 函数注册了一个服务对象，该函数有两个参数：
    * 服务名称，客户端调用时所使用（MathService）
    * 服务对象，也就是 MathService 这个结构体

* 通过 net.Listen 函数建立一个 TCP 链接，在 8088 端口进行监听 ；
* 最后通过 rpc.Accept 函数在该 TCP 链接上提供 MathService 这个 RPC 服务。如此，客户端便可看到 MathService 这个服务以及它的 Add 方法了。

`net/rpc` 提供的RPC 框架，要想把一个对象注册为 RPC 服务，可以让客户端远程访问，那么该对象（类型）的方法必须满足如下条件：

```go
func (t *T) MethodName(argType T1, replyType *T2) error
```

* 方法的类型是可导出的（公开的）；
* 方法本身也是可导出的；
* 方法必须有 2 个参数，并且参数类型是可导出或者内建的(此处 T1、T2都是可以被 `encoding/gob` 序列化的,第一个参数 argType 是调用者（客户端）提供的,第二个参数 replyType是返回给调用者结果，必须是指针类型。)；
* 方法必须返回一个 error 类型。

在根目录下创建客户端`client_main.go`

```go
package main

import (
	"fmt"
	"log"
	"net/rpc"
	"rpctest/server"
)

func main() {
	client, err := rpc.Dial("tcp", "localhost:8088")
	if err != nil {
		log.Fatal("dialing")
	}
	args := server.Args{A: 1, B: 2}
	var reply int
	err = client.Call("MathService.Add", args, &reply)
	if err != nil {
		log.Fatal("MathService.Add error", err)
	}
	fmt.Printf("MathService.Add: %d+%d=%d", args.A, args.B, reply)
}
```

上面代码中：

* 通过 rpc.Dial 函数建立 TCP 链接，注意的是这里的 IP、端口要和RPC 服务提供的一致；
* 准备远程方法需要的参数，此处为示例中的 args 和 reply；
* 通过 Call 方法调用远程的 RPC 服务；
* Call 方法有 3 个参数，它们的作用：

    * 调用的远程方法的名字，此处为 MathService.Add，点前面的部分是注册的服务的名称，点后面的部分是该服务的方法；
    * 客户端为了调用远程方法提供的参数，示例中是 args；
    * 为了接收远程方法返回的结果，必须是一个指针，此处为 示例中的 &replay 。

分别运行服务端和客户端：

```bash
go run server_main.go

go run client_main.go
# 结果
MathService.Add: 1+2=3
```

## 基于HTTP的RPC

修改`server_main.go`

```go
func main() {
   rpc.RegisterName("MathService", new(server.MathService))
   rpc.HandleHTTP()//新增的
   l, err := net.Listen("tcp", ":8088")
   if err != nil {
      log.Fatal("listen error:", err)
   }
   http.Serve(l, nil)//换成http的服务
}
```

修改`client_main.go`

```go
func main()  {
   client, err := rpc.DialHTTP("tcp",  "localhost:8088")
   //此处省略其他没有修改的代码
}
```

然后继续用上面的方式运行即可得到相同的结果。

## 调试的URL

`net/rpc` 包提供的 HTTP 协议的 RPC 还有一个调试的 URL，运行服务端代码后，在浏览器中访问 `http://localhost:8088/debug/rpc` 回车，即可看到服务端注册的RPC 服务，以及每个服务的方法

## TCP的JSON-RPC

使用 `net/rpc/jsonrpc` 包便可实现一个 JSON RPC 服务.

`server_main.go`

```go
func main() {
	rpc.RegisterName("MathService", new(server.MathService))
	l, err := net.Listen("tcp", ":8088")
	if err != nil {
		log.Fatal("listen error:", err)
	}
	for {
		conn, err := l.Accept()
		if err != nil {
			log.Println("jsonrpc.Serve: accept:", err.Error())
			return
		}
		//json rpc
		go jsonrpc.ServeConn(conn)
	}
}
```

上面的代码中，对比 gob 编码的RPC 服务，JSON 的 RPC 服务是把链接交给了 `jsonrpc.ServeConn` 这个函数处理，达到了基于 JSON 进行 RPC 调用的目的。

`client_main.go`

```go
func main()  {
   client, err := jsonrpc.Dial("tcp",  "localhost:8088")
   //省略了其他没有修改的代码
}
```

## HTTP的JSON-RPC

Go 语言内置的jsonrpc 并没有实现基于 HTTP的传输，这里参考 gob 编码的HTTP RPC 实现方式，来实现基于 HTTP的JSON RPC 服务。

`server_main.go`

```go
func main() {
   rpc.RegisterName("MathService", new(server.MathService))
   //注册一个path，用于提供基于http的json rpc服务
   http.HandleFunc(rpc.DefaultRPCPath, func(rw http.ResponseWriter, r *http.Request) {
      conn, _, err := rw.(http.Hijacker).Hijack()
      if err != nil {
         log.Print("rpc hijacking ", r.RemoteAddr, ": ", err.Error())
         return
      }
      var connected = "200 Connected to JSON RPC"
      io.WriteString(conn, "HTTP/1.0 "+connected+"\n\n")
      jsonrpc.ServeConn(conn)
   })
   l, err := net.Listen("tcp", ":8088")
   if err != nil {
      log.Fatal("listen error:", err)
   }
   http.Serve(l, nil)//换成http的服务
}
```

> 上面代码实现基于 HTTP 协议的核心，使用 http.HandleFunc 注册了一个 path，对外提供基于 HTTP 的 JSON RPC 服务。在这个 HTTP 服务的实现中，通过 Hijack 方法劫持链接，然后转交给 jsonrpc 处理，这样就实现了基于 HTTP 协议的 JSON RPC 服务。

`client_main.go`

```go
func main()  {
     client, err := DialHTTP("tcp",  "localhost:8088")
     if err != nil {
        log.Fatal("dialing:", err)
     }
     args := server.Args{A:1,B:2}
     var reply int
     err = client.Call("MathService.Add", args, &reply)
     if err != nil {
        log.Fatal("MathService.Add error:", err)
     }
     fmt.Printf("MathService.Add: %d+%d=%d", args.A, args.B, reply)
  }
  // DialHTTP connects to an HTTP RPC server at the specified network address
  // listening on the default HTTP RPC path.
  func DialHTTP(network, address string) (*rpc.Client, error) {
     return DialHTTPPath(network, address, rpc.DefaultRPCPath)
  }
  // DialHTTPPath connects to an HTTP RPC server
  // at the specified network address and path.
  func DialHTTPPath(network, address, path string) (*rpc.Client, error) {
     var err error
     conn, err := net.Dial(network, address)
     if err != nil {
        return nil, err
     }
     io.WriteString(conn, "GET "+path+" HTTP/1.0\n\n")
     // Require successful HTTP response
     // before switching to RPC protocol.
     resp, err := http.ReadResponse(bufio.NewReader(conn), &http.Request{Method: "GET"})
     connected := "200 Connected to JSON RPC"
     if err == nil && resp.Status == connected {
        return jsonrpc.NewClient(conn), nil
     }
     if err == nil {
        err = errors.New("unexpected HTTP response: " + resp.Status)
     }
     conn.Close()
     return nil, &net.OpError{
        Op:   "dial-http",
        Net:  network + " " + address,
        Addr: nil,
        Err:  err,
     }
  }
```