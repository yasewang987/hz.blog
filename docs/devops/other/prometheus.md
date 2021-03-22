# Prometheus部署

## docker部署prometheus

```bash
# 新建目录
mkdir prometheus && cd prometheus
# 新建配置文件
vim prometheus.yml
# 配置内容如下：
global:
  scrape_interval: 15s
  external_labels:
    monitor: 'codelab-monitor'

scrape_configs:
  - job_name: 'prometheus'
    scrape_interval: 5s
    static_configs:
      - targets: ['localhost:9090']


# 运行prometheus容器
docker run --name prometheus -d -p 9090:9090 --restart=always -v $PWD:/etc/prometheus prom/prometheus
```

## 添加node-exporter

