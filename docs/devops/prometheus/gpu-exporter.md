## GPU-Exporter部署

* 使用 `dcgm-exporter` 监控GPU信息

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
