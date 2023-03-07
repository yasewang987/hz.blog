# 自定义Exporter

指标类型|类别|描述|应用场景
---|---|---|---
Counter|计数类|使用在累计指标单调递增或递减情况下，只能在目标重启后自动归零|服务请求处理数量、已完成任务数量、错误数量
Guage|测量类|使用可增可减的的数据情况下|当前内存、CPU使用情况、并发请求数量
Histogram|直方图类|使用统计指标信息在不同区间内的统计数量|延迟时间、响应大小。例如：0-1秒内的延迟时间、、0-5秒内的延迟时间、例如0-1kb之内的响应大小、0-5kb之内的响应大小
Summary|摘要类|类似于直方图，在客户端对百分位进行统计|延迟时间、响应大小。例如：超过百分之多少的人要满足需求的话，需要多长时间完成

## 使用go实现自定义exporter

例子模拟实现一个api健康检查

* 创建一个服务配置文件 `checks.yaml`, 内容如下：

    ```yaml
    services:
    - name: serviceA
        host:
        - "hz1.com"
        - "hz2.com"
        - "hz3.com"
    - name: serviceB
        host:
        - "hz1.com"
        - "hz4.com"
    ```

* 定义与 yaml 配置文件对应的结构体struct

    ```go
    package main

    type Service struct {
        Name string `yaml:"name"`
        Hosts []string `yaml:"host"`
    }

    type Config struct {
        Services []Service `yaml:"services"`
    }
    ```

* 应用 prometheus go客户端包以及yaml文件操作包

    ```bash
    go get github.com/prometheus/client_golang/prometheus
    go get github.com/prometheus/client_golang/prometheus/promhttp
    go get gopkg.in/yaml.v3
    ```

* 实现代码如下：

    ```go
    package main

    import (
        "fmt"
        "github.com/prometheus/client_golang/prometheus"
        "github.com/prometheus/client_golang/prometheus/promhttp"
        "gopkg.in/yaml.v3"
        "io/ioutil"
        "log"
        "math/rand"
        "net/http"
    )

    func main() {

        var setting Config

        // 读取配置文件内容
        config, err := ioutil.ReadFile("./checks.yml")
        if err != nil {
            fmt.Println(err)
        }

        yaml.Unmarshal(config, &setting)

        // 注册自定义exporter
        reg := prometheus.NewPedanticRegistry()

        for _, c := range setting.Services {
            serviceN := NewAPIHealthCheckManager(c.Name)
            reg.MustRegister(serviceN)
        }

        gatherers := prometheus.Gatherers{
            prometheus.DefaultGatherer,
            reg,
        }

        h := promhttp.HandlerFor(gatherers, promhttp.HandlerOpts{})

        // 定义metrics路由
        http.HandleFunc("/metrics", func(writer http.ResponseWriter, request *http.Request) {
            h.ServeHTTP(writer, request)
        })
        log.Fatal(http.ListenAndServe(":8080", nil))
    }

    // api健康检查指标采集器
    type APIHealthCheckManager struct {
        ServiceName   string
        APIHealthDesc *prometheus.Desc
    }

    // 实现prometheus的采集器描述接口
    func (c *APIHealthCheckManager) Describe(ch chan<- *prometheus.Desc)  {
        ch <- c.APIHealthDesc
    }

    // 实现prometheus采集器的采集接口
    func (c *APIHealthCheckManager) Collect(ch chan<- prometheus.Metric)  {

        var setting Config

        config, err := ioutil.ReadFile("./checks.yml")
        if err != nil {
            fmt.Println(err)
        }

        yaml.Unmarshal(config, &setting)

        for _,x := range setting.Services {
            if c.ServiceName != x.Name {
                continue
            }
            apiHealthUsageByHost := x.Hosts

            for _,host := range apiHealthUsageByHost {
                    ch <- prometheus.MustNewConstMetric(
                    c.APIHealthDesc,
                    prometheus.GaugeValue,
                    float64(rand.Int31n(5)),
                    host,
                )
            }
        }
    }

    // 工厂模式实例化api健康检查采集器
    func NewAPIHealthCheckManager(serviceName string) *APIHealthCheckManager {
        return &APIHealthCheckManager{
            ServiceName: serviceName,
            APIHealthDesc: prometheus.NewDesc(
                "service_health_status",
                "Check Service Status.",
                []string{"host"},
                prometheus.Labels{"servicename": serviceName},
            ),
        }
    }
    ```

## Gauge指标类型

```go
package main

import (
 "net/http"

 "github.com/prometheus/client_golang/prometheus"
 "github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
 // 定义指标
 cpuUsage := prometheus.NewGauge(prometheus.GaugeOpts{
  Name: "cpu_usage",                      // 指标名称
  Help: "this is test metrics cpu usage", // 帮助信息
  // 不带固定label就不用下面这行
  ConstLabels: prometheus.Labels{"MachineType": "host"}, // label
 })


 // 给指标设置值
 cpuUsage.Set(89.56)
 // 注册指标
 prometheus.MustRegister(cpuUsage)
 // 暴露指标
 http.Handle("/metrics", promhttp.Handler())
 http.ListenAndServe(":9900", nil)
}
```

带有非固定label指标的例子

```go
package main

import (
 "net/http"

 "github.com/prometheus/client_golang/prometheus"
 "github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
 //定义带有不固定label的指标
 mtu := prometheus.NewGaugeVec(prometheus.GaugeOpts{
  Name: "interface_mtu",
  Help: "网卡接口MTU",
 }, []string{"interface", "Machinetype"})

 // 给指标设置值
 mtu.WithLabelValues("lo", "host").Set(1500)
 mtu.WithLabelValues("ens32", "host").Set(1500)
 mtu.WithLabelValues("eth0", "host").Set(1500)

 // 注册指标
 prometheus.MustRegister(mtu)

 // 暴露指标
 http.Handle("/metrics", promhttp.Handler())
 http.ListenAndServe(":9900", nil)
}
```

## Counter指标类型

```go
package main

import (
 "net/http"

 "github.com/prometheus/client_golang/prometheus"
 "github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
 // 定义指标
 reqTotal := prometheus.NewCounter(prometheus.CounterOpts{
  Name: "current_request_total",
  Help: "当前请求总数",
  // 不带固定label就不用下面这行
  ConstLabels: prometheus.Labels{"StatusCode": "200"},
 })
 // 注册指标
 prometheus.MustRegister(reqTotal)

 // 设置值
 reqTotal.Add(10)

 // 暴露指标
 http.Handle("/metrics", promhttp.Handler())
 http.ListenAndServe(":9900", nil)
}
```

带有非固定label指标的例子

```go
package main

import (
 "net/http"

 "github.com/prometheus/client_golang/prometheus"
 "github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
 // 定义指标
 pathReqTotal := prometheus.NewCounterVec(prometheus.CounterOpts{
  Name: "path_request_total",
  Help: "path请求总数",
 }, []string{"path"})
 // 注册指标
 prometheus.MustRegister(pathReqTotal)

 // 设置值
 pathReqTotal.WithLabelValues("/token").Add(37)
 pathReqTotal.WithLabelValues("/auth").Add(23)
 pathReqTotal.WithLabelValues("/user").Add(90)
 pathReqTotal.WithLabelValues("/api").Add(67)

 // 暴露指标
 http.Handle("/metrics", promhttp.Handler())
 http.ListenAndServe(":9900", nil)
}
```

## Histogram指标类型

```go
package main

import (
 "net/http"

 "github.com/prometheus/client_golang/prometheus"
 "github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
 // 定义指标
 reqDelay := prometheus.NewHistogram(prometheus.HistogramOpts{
  Name:    "request_delay",
  Help:    "请求延迟，单位秒",
  Buckets: prometheus.LinearBuckets(0, 3, 6), // 调用LinearBuckets生成区间，从0开始，宽度3，共6个Bucket
  // 不带固定label不需要下面这一行
  ConstLabels: prometheus.Labels{"path": "/api"},
 })

 // 注册指标
 prometheus.MustRegister(reqDelay)

 // 设置值
 reqDelay.Observe(6)

 // 暴露指标
 http.Handle("/metrics", promhttp.Handler())
 http.ListenAndServe(":9900", nil)
}
```

带有非固定label的例子

```go
package main

import (
 "net/http"

 "github.com/prometheus/client_golang/prometheus"
 "github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
 // 定义指标
 reqDelay := prometheus.NewHistogramVec(prometheus.HistogramOpts{
  Name:    "request_delay",
  Help:    "请求延迟，单位秒",
  Buckets: prometheus.LinearBuckets(0, 3, 6), // 调用LinearBuckets生成区间，从0开始，宽度3，共6个Bucket
 }, []string{"path"})

 // 注册指标
 prometheus.MustRegister(reqDelay)

 // 设置值
 reqDelay.WithLabelValues("/api").Observe(6)
 reqDelay.WithLabelValues("/user").Observe(3)
 reqDelay.WithLabelValues("/delete").Observe(2)
 reqDelay.WithLabelValues("/get_token").Observe(13)

 // 暴露指标
 http.Handle("/metrics", promhttp.Handler())
 http.ListenAndServe(":9900", nil)
}
```

## Summary指标类型

```go
package main

import (
 "net/http"

 "github.com/prometheus/client_golang/prometheus"
 "github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
 // 定义指标
 reqDelay := prometheus.NewSummary(prometheus.SummaryOpts{
  Name:       "request_delay",
  Help:       "请求延迟",
  Objectives: map[float64]float64{0.5: 0.05, 0.90: 0.01, 0.99: 0.001}, // 百分比:精度
  // 不带固定label，不需要下面这一行
  ConstLabels: prometheus.Labels{"path": "/api"},
 })

 // 注册指标
 prometheus.MustRegister(reqDelay)

 // 设置值
 reqDelay.Observe(4)

 // 暴露指标
 http.Handle("/metrics", promhttp.Handler())
 http.ListenAndServe(":9900", nil)
}
```

带有非固定label的例子

```go
package main

import (
 "net/http"

 "github.com/prometheus/client_golang/prometheus"
 "github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
 // 定义指标
 reqDelay := prometheus.NewSummaryVec(prometheus.SummaryOpts{
  Name:       "request_delay",
  Help:       "请求延迟",
  Objectives: map[float64]float64{0.5: 0.05, 0.90: 0.01, 0.99: 0.001}, // 百分比:精度
 }, []string{"path"})

 // 注册指标
 prometheus.MustRegister(reqDelay)

 // 设置值
 reqDelay.WithLabelValues("/api").Observe(4)
 reqDelay.WithLabelValues("/token").Observe(2)
 reqDelay.WithLabelValues("/user").Observe(3)

 // 暴露指标
 http.Handle("/metrics", promhttp.Handler())
 http.ListenAndServe(":9900", nil)
}
```