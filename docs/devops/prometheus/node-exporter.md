# Node-Exporter部署

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