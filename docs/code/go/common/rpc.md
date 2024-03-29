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

## GRPC示例

gRPC的通信模式分为`unary`和`streaming`两种模式

### 准备

```bash
# 创建目录
mkdir -p gotest/mygrpc && cd gotest
# 初始化
go mod init github.com/yasewang987/gotest
# grpc
go get -u google.golang.org/grpc
# 协议插件
go get -u google.golang.org/golang/protobuf
go get -u google.golang.org/golang/protobuf/protoc-gen-go

# 下载protoc，如果是mac m1 下载 x86版本即可
curl -OL https://github.com/protocolbuffers/protobuf/releases/download/v3.19.3/protoc-3.19.3-osx-x86_64.zip
# 解压之后，移动到 $GOPATH/bin 目录下
unzip protoc-3.19.3-osx-x86_64.zip
mv protoc-3.19.3-osx-x86_64/bin/protoc $GOPATH/bin

# ubuntu安装protoc
apt install -y protobuf-compiler
```

### 生成proto的go文件

准备 `mygrpc/test.proto` 文件，内容如下

```go
syntax = "proto3";

// 引入其他pb
import "google/protobuf/wrappers.proto";

// 包名
package  test;

// 指定输出 go 语言的源码到哪个目录以及文件名称
// 最终在 test.proto 目录生成 test.pb.go
// 也可以只填写 "./"
option go_package = "./;test";

// 如果要输出其它语言的话
// option csharp_package="MyTest";

service Tester{
  rpc MyTest(Request) returns (Response);
}

// 函数参数
message  Request{
  string  jsonStr = 1;
}

// 函数返回值
message  Response{
  string  backJson = 1;
}

// 数组
message SearchResponse {
  repeated Result results = 1;
}

message Result {
  string url = 1;
  string title = 2;
  repeated string snippets = 3;
}

// 枚举
message SearchRequest {
  string query = 1;
  int32 page_number = 2;
  int32 result_per_page = 3;
  enum Corpus {
    UNIVERSAL = 0;
    WEB = 1;
    IMAGES = 2;
    LOCAL = 3;
    NEWS = 4;
    PRODUCTS = 5;
    VIDEO = 6;
  }
  Corpus corpus = 4;
}
```

生成 `go` 文件, 会在 `mygrpc` 文件夹生成 `test.pb.go` 文件

```bash
# 生成1：
protoc --go_out=plugins=grpc:mygrpc mygrpc/*.proto

# 生成2：
protoc -I ./pb \
--go_out ./test --go_opt paths=source_relative \
--go-grpc_out ./test --go-grpc_opt paths=source_relative \
./pb/test.proto
# 生成2的目录
test
├── test.pb.go
└── test_grpc.pb.go
pb
└── test.proto
```

主要关注生成的两个 `Tester` 接口

```go
// 服务端
type TesterServer interface {
	MyTest(context.Context, *Request) (*Response, error)
}

// 客户端
type TesterClient interface {
	MyTest(ctx context.Context, in *Request, opts ...grpc.CallOption) (*Response, error)
}
```

### Simple服务端实现

需要先实现 `TesterServer` 接口

在 `mygrpc` 文件夹中新增 `testServer.go`, 内容如下：

```go
package test

import (
	context "context"
	"fmt"
)

// 用于实现 TesterServer 服务
type MyGrpcServer struct{}

func (s MyGrpcServer) MyTest(context context.Context, request *Request) (*Response, error) {
	fmt.Println("收到一个 grpc 请求，请求参数：", request)
	response := Response{BackJson: `{"Code":666}`}
	return &response, nil
}
```

创建 `gRPC` 服务, `main.go`

```go
package main

import (
	"net"

	"github.com/yasewang987/gotest/cmd"
	test "github.com/yasewang987/gotest/mygrpc"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

func main() {
   // 创建 Tcp 连接
	listener, _ := net.Listen("tcp", ":8028")
   // 创建gRPC服务
	grpcServer := grpc.NewServer()
   // Tester 注册服务实现者
	// 此函数在 test.pb.go 中，自动生成
	test.RegisterTesterServer(grpcServer, &test.MyGrpcServer{})
   // 在 gRPC 服务上注册反射服务(这个可以不要)
	// func Register(s *grpc.Server)
	reflection.Register(grpcServer)

	grpcServer.Serve(listener)
}
```

启动服务端 `go run main.go`

### Simple客户端实现

创建 `main_cli.go` 文件，内容如下

```go
package main

import (
	"bufio"
	"context"
	"log"
	"os"

	test "github.com/yasewang987/gotest/mygrpc"
	"google.golang.org/grpc"
)

func main() {
	conn, _ := grpc.Dial("127.0.0.1:8028", grpc.WithInsecure())
	defer conn.Close()
   // 创建 gRPC 客户端
	grpcClient := test.NewTesterClient(conn)
	request := test.Request{
		JsonStr: `{"Code":666}`,
	}
	reader := bufio.NewReader(os.Stdin)
	for {
      // 发送请求，调用 MyTest 接口
		response, err := grpcClient.MyTest(context.Background(), &request)
		if err != nil {
			log.Fatal("发送请求失败，原因是:", err)
		}
		log.Println(response)
		reader.ReadLine()
	}
}
```

启动客户端 `go run main_cli.go`，每次按回车都会在服务端和客户端出现一行请求记录。

### Server-Streaming RPC 服务器端流式 RPC

服务器端流式 RPC，显然是单向流，并代指 Server 为 Stream 而 Client 为普通 RPC 请求

简单来讲就是客户端发起一次普通的 RPC 请求，服务端通过流式响应多次发送数据集，客户端 Recv 接收数据集。

* `pb` 定义
```go
syntax = "proto3";

package ecommerce;

option go_package = "ecommerce/";

import "google/protobuf/wrappers.proto";

message Order {
  string id = 1;
  repeated string items = 2;
  string description = 3;
  float price = 4;
  string destination = 5;
}

service OrderManagement {
  rpc searchOrders(google.protobuf.StringValue) returns (stream Order);
}
```

* `server`实现

注意与Simple RPC的区别：因为我们的服务端是流式响应的，因此对于服务端来说函数入参多了一个`stream OrderManagement_SearchOrdersServer`参数用来写入多个响应，可以把它看作是客户端的对象

可以通过调用这个流对象的`Send(...)`，来往客户端写入数据

通过返回`nil`或者`error`来表示全部数据写完了

```go
func (s *server) SearchOrders(query *wrapperspb.StringValue,
                              stream pb.OrderManagement_SearchOrdersServer) error {
 for _, order := range orders {
  for _, str := range order.Items {
   if strings.Contains(str, query.Value) {
    err := stream.Send(&order)
    if err != nil {
     return fmt.Errorf("error send: %v", err)
    }
   }
  }
 }

 return nil
}
```

* `client` 实现

注意与Simple RPC的区别：因为我们的服务端是流式响应的，因此 RPC 函数返回值`stream`是一个流，可以把它看作是服务端的对象

使用`stream`的`Recv`函数来不断从服务端接收数据

当`Recv`返回`io.EOF`代表流已经结束

```go
c := pb.NewOrderManagementClient(conn)
ctx, cancelFn := context.WithCancel(context.Background())
defer cancelFn()

stream, err := c.SearchOrders(ctx, &wrapperspb.StringValue{Value: "Google"})
if err != nil{
  panic(err)
}

for{
  order, err := stream.Recv()
  if err == io.EOF{
    break
  }

  log.Println("Search Result: ", order)
}
```

### Client-Streaming RPC 客户端流式 RPC

客户端流式 RPC，显然也是单向流，客户端通过流式发起多次 RPC 请求给服务端，服务端发起一次响应给客户端。

服务端没有必要等到客户端发送完所有请求再响应，可以在收到部分请求之后就响应

* `pb`定义

```go
syntax = "proto3";

package ecommerce;

option go_package = "ecommerce/";

import "google/protobuf/wrappers.proto";

message Order {
  string id = 1;
  repeated string items = 2;
  string description = 3;
  float price = 4;
  string destination = 5;
}

service OrderManagement {
  rpc updateOrders(stream Order) returns (google.protobuf.StringValue);
}
```

* `server` 实现

注意与Simple RPC的区别：因为我们的客户端是流式请求的，因此请求参数`stream OrderManagement_UpdateOrdersServer`就是流对象

可以从`stream OrderManagement_UpdateOrdersServer`的`Recv`函数读取消息

当`Recv`返回`io.EOF`代表流已经结束

使用`stream OrderManagement_UpdateOrdersServer`的`SendAndClose`函数关闭并发送响应

```go
// 在这段程序中，我们对每一个 Recv 都进行了处理
// 当发现 io.EOF (流关闭) 后，需要将最终的响应结果发送给客户端，同时关闭正在另外一侧等待的 Recv
func (s *server) UpdateOrders(stream pb.OrderManagement_UpdateOrdersServer) error {
 ordersStr := "Updated Order IDs : "
 for {
  order, err := stream.Recv()
  if err == io.EOF {
   // Finished reading the order stream.
   return stream.SendAndClose(
    &wrapperspb.StringValue{Value: "Orders processed " + ordersStr})
  }
  // Update order
  orders[order.Id] = *order

  log.Println("Order ID ", order.Id, ": Updated")
  ordersStr += order.Id + ", "
 }
}
```

* `Client` 实现

 注意与Simple RPC的区别：因为我们的客户端是流式响应的，因此 RPC 函数返回值`stream`是一个流

 可以通过调用这个流对象的`Send(...)`，来往这个对象写入数据

 使用`stream`的`CloseAndRecv`函数关闭并发送响应

```go
c := pb.NewOrderManagementClient(conn)
ctx, cancelFn := context.WithCancel(context.Background())
defer cancelFn()

stream, err := c.UpdateOrders(ctx)
if err != nil {
  panic(err)
}

if err := stream.Send(&pb.Order{
  Id:          "00",
  Items:       []string{"A", "B"},
  Description: "A with B",
  Price:       0.11,
  Destination: "ABC",
}); err != nil {
  panic(err)
}

if err := stream.Send(&pb.Order{
  Id:          "01",
  Items:       []string{"C", "D"},
  Description: "C with D",
  Price:       1.11,
  Destination: "ABCDEFG",
}); err != nil {
  panic(err)
}

res, err := stream.CloseAndRecv()
if err != nil {
  panic(err)
}

log.Printf("Update Orders Res : %s", res)
```

### Bidirectional-Streaming RPC 双向流式 RPC

双向流相对还是比较复杂的，大部分场景都是使用事件机制进行异步交互。

双向流式 RPC，顾名思义是双向流。由客户端以流式的方式发起请求，服务端同样以流式的方式响应请求。

首个请求一定是 `Client` 发起，但具体交互方式（谁先谁后、一次发多少、响应多少、什么时候关闭）根据程序编写的方式来确定（可以结合协程）

假设该双向流是按顺序发送的话

* `pb` 定义

```go
syntax = "proto3";

package ecommerce;

option go_package = "ecommerce/";

import "google/protobuf/wrappers.proto";

message Order {
  string id = 1;
  repeated string items = 2;
  string description = 3;
  float price = 4;
  string destination = 5;
}

message CombinedShipment {
  string id = 1;
  string status = 2;
  repeated Order orderList = 3;
}

service OrderManagement {
  rpc processOrders(stream google.protobuf.StringValue)
      returns (stream CombinedShipment);
}
```

* `server` 实现

函数入参`OrderManagement_ProcessOrdersServer`是用来写入多个响应和读取多个消息的对象引用

可以通过调用这个流对象的`Send(...)`，来往这个对象写入响应

以通过调用这个流对象的`Recv(...)`函数读取消息，当`Recv`返回`io.EOF`代表流已经结束

通过返回`nil`或者`error`表示全部数据写完了

```go
func (s *server) ProcessOrders(stream pb.OrderManagement_ProcessOrdersServer) error {

 batchMarker := 1
 var combinedShipmentMap = make(map[string]pb.CombinedShipment)
 for {
  orderId, err := stream.Recv()
  log.Printf("Reading Proc order : %s", orderId)
  if err == io.EOF {
   log.Printf("EOF : %s", orderId)
   for _, shipment := range combinedShipmentMap {
    if err := stream.Send(&shipment); err != nil {
     return err
    }
   }
   return nil
  }
  if err != nil {
   log.Println(err)
   return err
  }

  destination := orders[orderId.GetValue()].Destination
  shipment, found := combinedShipmentMap[destination]

  if found {
   ord := orders[orderId.GetValue()]
   shipment.OrderList = append(shipment.OrderList, &ord)
   combinedShipmentMap[destination] = shipment
  } else {
   comShip := pb.CombinedShipment{Id: "cmb - " + (orders[orderId.GetValue()].Destination), Status: "Processed!"}
   ord := orders[orderId.GetValue()]
   comShip.OrderList = append(shipment.OrderList, &ord)
   combinedShipmentMap[destination] = comShip
   log.Print(len(comShip.OrderList), comShip.GetId())
  }

  if batchMarker == orderBatchSize {
   for _, comb := range combinedShipmentMap {
    log.Printf("Shipping : %v -> %v", comb.Id, len(comb.OrderList))
    if err := stream.Send(&comb); err != nil {
     return err
    }
   }
   batchMarker = 0
   combinedShipmentMap = make(map[string]pb.CombinedShipment)
  } else {
   batchMarker++
  }
 }
}
```

* `Client` 实现

函数返回值`OrderManagement_ProcessOrdersClient`是用来获取多个响应和写入多个消息的对象引用

可以通过调用这个流对象的`Send(...)`，来往这个对象写入响应

可以通过调用这个流对象的`Recv(...)`函数读取消息，当`Recv`返回`io.EOF`代表流已经结束

```go
c := pb.NewOrderManagementClient(conn)
ctx, cancelFn := context.WithCancel(context.Background())
defer cancelFn()

stream, err := c.ProcessOrders(ctx)
if err != nil {
  panic(err)
}

go func() {
  if err := stream.Send(&wrapperspb.StringValue{Value: "101"}); err != nil {
    panic(err)
  }

  if err := stream.Send(&wrapperspb.StringValue{Value: "102"}); err != nil {
    panic(err)
  }

  if err := stream.CloseSend(); err != nil {
    panic(err)
  }
}()

for {
  combinedShipment, err := stream.Recv()
  if err == io.EOF {
    break
  }
  log.Println("Combined shipment : ", combinedShipment.OrderList)
}
```
### 服务端拦截器

服务端的拦截器从请求开始按顺序执行拦截器，在执行完对应RPC的逻辑之后，再按反向的顺序执行拦截器中对响应的处理逻辑

服务器只能配置一个 `unary interceptor`和 `stream interceptor`，否则会报错，客户端也是，虽然不会报错，但是只有最后一个才起作用。

想配置多个，可以使用拦截器链或者自己实现一个

```go
// 服务端拦截器
s := grpc.NewServer(
  grpc.ChainUnaryInterceptor(
    orderUnaryServerInterceptor1,
    orderUnaryServerInterceptor2,
  ),
  grpc.ChainStreamInterceptor(
    orderServerStreamInterceptor1,
    orderServerStreamInterceptor2,
  ),
)

// 客户端拦截器
conn, err := grpc.Dial("127.0.0.1:8009",
  grpc.WithInsecure(),
  grpc.WithChainUnaryInterceptor(
   orderUnaryClientInterceptor1,
      orderUnaryClientInterceptor2,
  ),
  grpc.WithChainStreamInterceptor(
   orderStreamClientInterceptor1,
      orderStreamClientInterceptor2,
  ),
)
```

**`unary interceptors`:**

需实现`UnaryServerInterceptor`接口即可

```go
// ctx context.Context：单个请求的上下文
// req interface{}：RPC服务的请求结构体
// info *UnaryServerInfo：RPC的服务信息
// handler UnaryHandler：它包装了服务实现，通过调用它我们可以完成RPC并获取到响应
func(ctx context.Context, req interface{}, 
     info *UnaryServerInfo, handler UnaryHandler) (resp interface{}, err error)
```

假设我们的客户端请求了`GetOrder`，根据示例再重新看下拦截器接口的每一个参数

* `req interface{}`: RPC服务的请求结构体，对于`GetOrder`来说就是`orderId *wrapperspb.StringValue`
* `info *UnaryServerInfo`包含两个字段：
    * `FullMethod`是请求的method名字（例如`/ecommerce.OrderManagement/getOrder`）；
    * `Server`就是服务实现（就是示例`RegisterOrderManagementServe`r中的`&OrderManagementImpl{}`）
* `handler`包装了服务实现：所以在调用它之前我们可以进行改写`req`或`ctx`、记录逻辑开始时间等操作，调用完`handler`即完成了RPC并获取到响应，我们不仅可以记录响应还可以改写响应。

示例：

```go
// 实现 unary interceptors
func orderUnaryServerInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
 // Pre-processing logic*
 s := time.Now()

 // Invoking the handler to complete the normal execution of a unary RPC.
 m, err := handler(ctx, req)

 // Post processing logic
 log.Printf("Method: %s, req: %s, resp: %s, latency: %s\n",
  info.FullMethod, req, m, time.Now().Sub(s))
  
 return m, err
}

func main() {
 s := grpc.NewServer(
    // 使用 unary interceptors
  grpc.UnaryInterceptor(orderUnaryServerInterceptor),
 )
 
  pb.RegisterOrderManagementServer(s, &OrderManagementImpl{})
  
 // ...
}
```

**`streaming interceptors`:**

要实现`StreamServerInterceptor`接口

```go
// srv interface{}：服务实现
// ss ServerStream：服务端视角的流。怎么理解呢？无论是哪一种流式RPC对于服务端来说发送（SendMsg）就代表着响应数据，接收（RecvMsg）就代表着请求数据，不同的流式RPC的区别就在于是多次发送数据（服务器端流式 RPC）还是多次接收数据（客户端流式 RPC）或者两者均有（双向流式 RPC）。因此仅使用这一个抽象就代表了所有的流式RPC场景
// info *StreamServerInfo：RPC的服务信息
// handler StreamHandler：它包装了服务实现，通过调用它我们可以完成RPC
func(srv interface{}, ss ServerStream, 
     info *StreamServerInfo, handler StreamHandler) error
```

示例：

```go
func orderStreamServerInterceptor(srv interface{},
 ss grpc.ServerStream, info *grpc.StreamServerInfo, handler grpc.StreamHandler) error {

 // Pre-processing logic
 s := time.Now()

 // Invoking the StreamHandler to complete the execution of RPC invocation
 err := handler(srv, ss)

 // Post processing logic
 log.Printf("Method: %s, latency: %s\n", info.FullMethod, time.Now().Sub(s))

 return err
}

func main() {
 s := grpc.NewServer(
  grpc.StreamInterceptor(orderStreamServerInterceptor),
 )

 pb.RegisterOrderManagementServer(s, &OrderManagementImpl{})

 //...
}
```
* `srv interface{}`：服务实现（就是示例`RegisterOrderManagementServer`中的`&OrderManagementImpl{}`）
* `ss grpc.ServerStream`：服务端发送和接收数据的接口，注意它是一个接口
* `info *grpc.StreamServerInfo`包含三个字段：
    * `FullMethod`是请求的`method`名字（例如`/ecommerce.OrderManagement/updateOrders`）；
    * `IsClientStream` 是否是客户端流
    * `IsServerStream` 是否是服务端流
* `handler`包装了服务实现：所以在调用它之前我们可以进行改写数据流、记录逻辑开始时间等操作，调用完`handler`即完成了RPC，因为是流式调用所以不会返回响应数据，只有`error`

修改 `stream` 请求响应示例：

```go
// SendMsg method call.
type wrappedStream struct {
 Recv []interface{}
 Send []interface{}
 grpc.ServerStream
}

func (w *wrappedStream) RecvMsg(m interface{}) error {
 err := w.ServerStream.RecvMsg(m)

 w.Recv = append(w.Recv, m)

 return err
}

func (w *wrappedStream) SendMsg(m interface{}) error {
 err := w.ServerStream.SendMsg(m)

 w.Send = append(w.Send, m)

 return err
}

func newWrappedStream(s grpc.ServerStream) *wrappedStream {
 return &wrappedStream{
  make([]interface{}, 0),
  make([]interface{}, 0),
  s,
 }
}

func orderStreamServerInterceptor(srv interface{},
 ss grpc.ServerStream, info *grpc.StreamServerInfo, handler grpc.StreamHandler) error {

 // Pre-processing logic
 s := time.Now()

 // Invoking the StreamHandler to complete the execution of RPC invocation
 nss := newWrappedStream(ss)
 err := handler(srv, nss)

 // Post processing logic
 log.Printf("Method: %s, req: %+v, resp: %+v, latency: %s\n",
  info.FullMethod, nss.Recv, nss.Send, time.Now().Sub(s))

 return err
} 
```

### 客户端拦截器

客户端拦截器和服务端拦截器类似，从请求开始按顺序执行拦截器，在获取到服务端响应之后，再按反向的顺序执行拦截器中对响应的处理逻辑

**`unary interceptors`：**

client端要实现`UnaryClientInterceptor`接口实现的接口如下:

```go
// ctx context.Context：单个请求的上下文
// method string：请求的method名字（例如/ecommerce.OrderManagement/getOrder)
// req, reply interface{}：请求和响应数据
// cc *ClientConn：客户端与服务端的链接
// invoker UnaryInvoker：通过调用它我们可以完成RPC并获取到响应
// opts ...CallOption：RPC调用的所有配置项，包含设置到conn上的，也包含配置在每一个调用上的
func(ctx context.Context, method string, req, reply interface{}, 
     cc *ClientConn, invoker UnaryInvoker, opts ...CallOption) error

//// 示例
func orderUnaryClientInterceptor(ctx context.Context, method string, req, reply interface{},
 cc *grpc.ClientConn, invoker grpc.UnaryInvoker, opts ...grpc.CallOption) error {
 // Pre-processor phase
 s := time.Now()

 // Invoking the remote method
 err := invoker(ctx, method, req, reply, cc, opts...)

 // Post-processor phase
 log.Printf("method: %s, req: %s, resp: %s, latency: %s\n",
  method, req, reply, time.Now().Sub(s))

 return err
}
func main() {
 conn, err := grpc.Dial("127.0.0.1:8009",
  grpc.WithInsecure(),
  grpc.WithUnaryInterceptor(orderUnaryClientInterceptor),
 )
 if err != nil {
  panic(err)
 }
 c := pb.NewOrderManagementClient(conn)
  // ...
}
```
* `cc *grpc.ClientConn`客户端与服务端的链接：这里的`cc`就是示例代码中`c := pb.NewOrderManagementClient(conn)`的`conn`
* `invoker grpc.UnaryInvoker`包装了服务实现：调用完`invoker`即完成了RPC，所以我们可以改写`req`或者在获取到`reply`之后修改响应

**`streaming interceptors`:**

要实现的接口`StreamClientInterceptor`

```go
func(ctx context.Context, desc *StreamDesc, cc *ClientConn, 
     method string, streamer Streamer, opts ...CallOption) (ClientStream, error)

//// 示例
func orderStreamClientInterceptor(ctx context.Context, desc *grpc.StreamDesc,
 cc *grpc.ClientConn, method string, streamer grpc.Streamer,
 opts ...grpc.CallOption) (grpc.ClientStream, error) {

 // Pre-processing logic
 s := time.Now()

 cs, err := streamer(ctx, desc, cc, method, opts...)

 // Post processing logic
 log.Printf("method: %s, latency: %s\n", method, time.Now().Sub(s))

 return cs, err
}

func main() {
 conn, err := grpc.Dial("127.0.0.1:8009",
  grpc.WithInsecure(),
  grpc.WithStreamInterceptor(orderStreamClientInterceptor),
 )
 if err != nil {
  panic(err)
 }

 c := pb.NewOrderManagementClient(conn)
  
  // ...
}


//// 修改流拦截器的请求响应数据
// SendMsg method call.
type wrappedStream struct {
 method string
 grpc.ClientStream
}

func (w *wrappedStream) RecvMsg(m interface{}) error {
 err := w.ClientStream.RecvMsg(m)

 log.Printf("method: %s, res: %s\n", w.method, m)

 return err
}

func (w *wrappedStream) SendMsg(m interface{}) error {
 err := w.ClientStream.SendMsg(m)

 log.Printf("method: %s, req: %s\n", w.method, m)

 return err
}

func newWrappedStream(method string, s grpc.ClientStream) *wrappedStream {
 return &wrappedStream{
  method,
  s,
 }
}

func orderStreamClientInterceptor(ctx context.Context, desc *grpc.StreamDesc,
 cc *grpc.ClientConn, method string, streamer grpc.Streamer,
 opts ...grpc.CallOption) (grpc.ClientStream, error) {

 // Pre-processing logic
 s := time.Now()

 cs, err := streamer(ctx, desc, cc, method, opts...)

 // Post processing logic
 log.Printf("method: %s, latency: %s\n", method, time.Now().Sub(s))

 return newWrappedStream(method, cs), err
}
```

和`serve`端类似的参数类似，重点关注下面几个参数

* `cs ClientStream`：客户端视角的流。类比服务端的`ss ServerStream`，无论是哪一种流式RPC对于客户端来说发送（SendMsg）就代表着请求数据，接收（RecvMsg）就代表着响应数据（正好和服务端是反过来的）
* `streamer Streamer`：完成RPC请求的调用


### grpc优雅推出
gRPC服务器的平滑关闭可以通过 `GracefulStop` 方法实现。

```go
package main

import (
    "context"
    "fmt"
    "net"
    "os"
    "os/signal"

    "google.golang.org/grpc"
    "google.golang.org/grpc/reflection"
)

type Greeter struct{}

func (s *Greeter) SayHello(ctx context.Context, in *HelloRequest) (*HelloReply, error) {
    return &HelloReply{Message: "Hello " + in.Name}, nil
}

func main() {
    listener, err := net.Listen("tcp", ":50051")
    if err != nil {
        // 处理监听失败的错误
    }

    server := grpc.NewServer()
    RegisterGreeterServer(server, &Greeter{})

    // 在gRPC服务上启用反射服务
    reflection.Register(server)

    go func() {
        if err := server.Serve(listener); err != nil {
            // 处理gRPC服务启动错误
        }
    }()

    // 等待中断信号来优雅地关闭gRPC服务器
    stop := make(chan os.Signal, 1)
    signal.Notify(stop, os.Interrupt)

    <-stop // 等待中断信号
    fmt.Println("Shutting down gRPC server...")

    server.GracefulStop()
    fmt.Println("gRPC server gracefully stopped")
}
```