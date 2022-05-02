# Go-负载均衡

```go
////// 定义服务 server.go
package balance

// 服务
type Server struct {
	host string
	port int
}

func NewServer(host string, port int) *Server {
	return &Server{
		host: host,
		port: port,
	}
}


////// 定义负载均衡接口 balance.go
package balance

type Balance interface {
	// 选择其中一个服务返回
	DoBalance([]*Server) (*Server, error)
}

////// 实现随机类型的负载均衡 balance_random.go
package balance

import (
	"errors"
	"math/rand"
)

type BalanceRandom struct{}

func init() {
	// 注册balance
	RegisterBalance("random", &BalanceRandom{})
}

// 实现DoBalance接口
func (b *BalanceRandom) DoBalance(servers []*Server) (server *Server, err error) {
	lens := len(servers)
	if lens == 0 {
		err = errors.New("no servers")
		return
	}
	index := rand.Intn(lens)
	server = servers[index]
	return
}


////// 实现轮询的服务在均衡 balance_roundribon.go
package balance

import "errors"

type BalanceRoundRobin struct {
	index int
}

func init() {
	// 注册
	RegisterBalance("round", &BalanceRoundRobin{})
}

func (b *BalanceRoundRobin) DoBalance(servers []*Server) (server *Server, err error) {
	lens := len(servers)
	if lens == 0 {
		err = errors.New("no servers")
		return
	}
	if b.index >= lens {
		b.index = 0
	}
	server = servers[b.index]
	b.index++
	return
}

////// 统一通过负载均衡管理器来管理负载均衡的各种实现 balance_manager.go
package balance

import "errors"

// 负载均衡管理器
type BalanceManager struct {
	balances map[string]Balance
}

// 内存中保存所有负载均衡器
var mgr = BalanceManager{
	balances: make(map[string]Balance),
}

// 将负载均衡器注册到管理器
func (bm *BalanceManager) registerBalance(name string, balance Balance) {
	bm.balances[name] = balance
}

func RegisterBalance(name string, balance Balance) {
	mgr.registerBalance(name, balance)
}

// 根据选择的负载均衡器来挑选合适的服务
func DoBalance(name string, servers []*Server) (server *Server, err error) {
	b, ok := mgr.balances[name]
	if !ok {
		err = errors.New("no such balance")
		return
	}

	server, err = b.DoBalance(servers)
	if err != nil {
		return
	}
	return
}


////// 客户端调用 run.go
package balance

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

func Run() {
	var servers []*Server

	for i := 0; i < 5; i++ {
		host := fmt.Sprintf("192.168.0.%d", i)
		port, _ := strconv.Atoi(fmt.Sprintf("800%d", i))
		server := NewServer(host, port)
		servers = append(servers, server)
	}

	var name = "round"
	if len(os.Args) > 1 {
		name = os.Args[1]
	}

	for {
		server, err := DoBalance(name, servers)
		if err != nil {
			fmt.Println(err)
			<-time.After(time.Second)
			continue
		}
		fmt.Println(server)
		<-time.After(time.Second)
	}
}

////// main.go
func main() {
    balance.Run()
}
```

使用如下命令测试效果

```bash
# 轮询
go run main.go

# 随机
go run main.go random
```