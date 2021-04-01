# Prometheus部署

## docker部署prometheus

```bash
# 新建目录
mkdir prometheus && cd prometheus
# 新建配置文件
vim prometheus.yml
# 配置内容如下：
global:
  scrape_interval: 60s
  evaluation_interval: 60s
  external_labels:
    monitor: 'codelab-monitor'

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
        labels:
          appname: 'prometheus'


# 运行prometheus容器
docker run --name prometheus -d -p 9090:9090 --restart=always -v $PWD:/etc/prometheus prom/prometheus
```

## 添加Grafana

```bash
# 新建grafana存储数据文件夹
mkdir grafana

# 设置权限
chmod 777 -R grafana

# 启动grafana
docker run -d \
  -p 3000:3000 \
  --name=grafana \
  -v $PWD/grafana:/var/lib/grafana \
  --restart=always \
  --name grafana \
  grafana/grafana
```

访问 http://hostip:3000/ 进入登陆页面，默认账户、密码都是admin

进入之后点击 `Add data source`，选择 prometheus，并修改 URL 配置为prometheus的url地址，点击下面的Save & Test，如果出现绿色的，说明ok了。

## 添加node-exporter

1. 在需要监控的机器上运行node-exporter

    ```bash
    docker run -d -p 9100:9100 \
    -v "/proc:/host/proc:ro" \
    -v "/sys:/host/sys:ro" \
    -v "/:/rootfs:ro" \
    --net="host" \
    --restart=always \
    --name node-exporter \
    prom/node-exporter
    ```

1. 修改prometheus.yml配置文件，加入node监控信息

    ```yml
    global:
      scrape_interval: 60s
      evaluation_interval: 60s
      external_labels:
        monitor: 'codelab-monitor'

    scrape_configs:
      - job_name: 'TestHost'
        static_configs:
          - targets: ['192.168.1.121:9100']
            labels:
              appname: 'Test-GPU-121'
      - job_name: 'prometheus'
        static_configs:
          - targets: ['localhost:9090']
            labels:
              appname: 'prometheus'
    ```

    * 需要重启prometheus，`docker restart prometheus`, 访问 http://prometheusip:9090/targets，可以看到监控的node节点信息。

1. 添加 grafana 的 Node Exporter for Prometheus 模版

访问 https://grafana.com/grafana/dashboards/8919/revisions 下载最新版本

1. 点击prometheus页面的 `+`,选择 `Import`, 选择右边的 `Upload .json file`，选择下载好的json文件，选择Prometheus即可。

## GPU监控dcgm-exporter

1. 启动监控

    ```bash
    # 运行dcgm-exporter
    $ docker run -d --runtime=nvidia --restart=always --name=nvidia-dcgm-exporter bgbiao/dcgm-exporter
    # 或者
    $ docker run -d --gpus all --restart=always --name=nvidia-dcgm-exporter bgbiao/dcgm-exporter

    # 启动gpu信息站点
    $ docker run -d --privileged --restart=always -p 9400:9400  --volumes-from nvidia-dcgm-exporter:ro --name nvidia-dcgm-exporter-api bgbiao/gpu-metrics-exporter

    # 测试
    $ curl -s localhost:9400/gpu/metrics
    dcgm_ecc_dbe_aggregate_total{gpu="0",uuid="GPU-b91e30ac-fe77-e236-11ea-078bc2d1f226"} 0
    ```

1. 修改配置文件prometheus.yml,加入prometheus

    ```yml
    global:
      scrape_interval: 60s
      evaluation_interval: 60s
      external_labels:
        monitor: 'codelab-monitor'

    scrape_configs:
      - job_name: 'TestHost'
        static_configs:
          - targets: ['192.168.1.121:9100']
            labels:
              appname: 'Test-121'
      - job_name: 'gpu-metrics' # 这里不要换成其他名字，grafana的组件采集信息时要用到这个名字
        metrics_path: '/gpu/metrics'
        static_configs:
          - targets: ['192.168.1.121:9400']
            labels:
              appname: 'Test-121'
      - job_name: 'prometheus'
        static_configs:
          - targets: ['localhost:9090']
            labels:
              appname: 'prometheus'
    ```

1. 添加Grafana展示

    模版链接 https://grafana.com/grafana/dashboards/12027 ，可以下载下来之后直接导入json文件。

    如果联网的话也可以直接输入 `12027` 加载
