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