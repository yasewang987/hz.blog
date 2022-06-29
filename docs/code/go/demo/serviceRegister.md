# 服务注册发现

* 反向代理
```go
package main

import (
    "fmt"
    "net/http"
    "sync/atomic"
)

type Application struct {
    RequestCount uint64
    SRegistry    *ServiceRegistry
}

func (a *Application) Handle(w http.ResponseWriter, r *http.Request) {
    atomic.AddUint64(&a.RequestCount, 1)

    if a.SRegistry.Len() == 0 {
        w.Write([]byte(`No backend entry in the service registry`))
        return
    }
    //请求数对服务实例个数取模
    backendIndex := int(atomic.LoadUint64(&a.RequestCount) % uint64(a.SRegistry.Len()))
    fmt.Printf("Request routing to instance %d\n", backendIndex)
    //将请求代理转发到对应的服务端
    a.SRegistry.GetByIndex(backendIndex).
        proxy.
        ServeHTTP(w, r)
}
```
* 使用定时任务扫描服务器上对应的服务

```go
package main

import (
    "context"
    "fmt"
    "github.com/docker/docker/api/types"
    "github.com/docker/docker/client"
    "time"
)

type Registrar struct {
    Interval  time.Duration
    DockerCLI *client.Client
    SRegistry *ServiceRegistry
}

const (
    HelloServiceImageName = "hello" //后端服务实例docker镜像名称
    ContainerRunningState = "running" //服务运行状态
)

func (r *Registrar) Observe() {
    for range time.Tick(r.Interval) { //定时器
        //获取容器列表
        cList, _ := r.DockerCLI.ContainerList(context.Background(), types.ContainerListOptions{
            All: true,
        })
         //没有容器运行，意味着没有后端服务可用，清空注册列表
        if len(cList) == 0 {
            r.SRegistry.RemoveAll()
            continue
        }
        //镜像过滤名称不是hello的容器，也就是指定服务
        for _, c := range cList {
            if c.Image != HelloServiceImageName {
                continue
            }
             //根据容器ID查找该后端服务是否已经注册
            _, exist := r.SRegistry.GetByContainerID(c.ID)

            if c.State == ContainerRunningState {
                //容器运行但是为注册，执行注册操作
                if !exist {
                    addr := fmt.Sprintf("http://localhost:%d", c.Ports[0].PublicPort)
                    r.SRegistry.Add(c.ID, addr)
                }
            } else {
                //容器不是运行状态，但已注册需移除
                if exist {
                    r.SRegistry.RemoveByContainerID(c.ID)
                }
            }
        }
    }
}
```

* 服务注册发现

```go
package main

import (
    "fmt"
    "net/http/httputil"
    "net/url"
    "sync"
)
//定义后端服务结构体
type backend struct {
    proxy       *httputil.ReverseProxy  //代理转发
    containerID string   //容器ID
}
//服务注册结构体
type ServiceRegistry struct {
    mu       sync.RWMutex
    backends []backend
}
//初始化
func (s *ServiceRegistry) Init() {
    s.mu = sync.RWMutex{}   
    s.backends = []backend{}  //默认服务列表为空
}
//向服务列表添加服务，也即是注册服务
func (s *ServiceRegistry) Add(containerID, addr string) {
    s.mu.Lock()
    defer s.mu.Unlock()

    URL, _ := url.Parse(addr)

    s.backends = append(s.backends, backend{
       //根据后端服务创建代理对象，用于转发请求
        proxy:       httputil.NewSingleHostReverseProxy(URL),
        containerID: containerID,
    })
}
//根据容器ID查询注册列表，支持并发
func (s *ServiceRegistry) GetByContainerID(containerID string) (backend, bool) {
    s.mu.RLock()
    defer s.mu.RUnlock()

    for _, b := range s.backends {
        if b.containerID == containerID {
            return b, true
        }
    }

    return backend{}, false
}
//根据容器ID读取后端服务实例
func (s *ServiceRegistry) GetByIndex(index int) backend {
    s.mu.RLock()
    defer s.mu.RUnlock()

    return s.backends[index]
}
//根据容器ID移除服务
func (s *ServiceRegistry) RemoveByContainerID(containerID string) {
    s.mu.Lock()
    defer s.mu.Unlock()

    var backends []backend
    for _, b := range s.backends {
        if b.containerID == containerID {
            continue
        }
        backends = append(backends, b)
    }

    s.backends = backends
}
//清除服务注册列表
func (s *ServiceRegistry) RemoveAll() {
    s.mu.Lock()
    defer s.mu.Unlock()

    s.backends = []backend{}
}
//获取服务实例个数
func (s *ServiceRegistry) Len() int {
    s.mu.RLock()
    defer s.mu.RUnlock()

    return len(s.backends)
}
//打印服务列表
func (s *ServiceRegistry) List() {
    s.mu.RLock()
    defer s.mu.RUnlock()

    for i := range s.backends {
        fmt.Println(s.backends[i].containerID)
    }
}
```