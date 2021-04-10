# 自定义Exporter

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