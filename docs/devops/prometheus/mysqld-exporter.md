# mysqld-exporter部署

## 创建数据库用户

```sql
CREATE USER 'exporter'@'%' IDENTIFIED BY 'mypassword';
GRANT PROCESS, REPLICATION CLIENT ON *.* TO 'exporter'@'%';
GRANT SELECT ON performance_schema.* TO 'exporter'@'%';
```

## 启动mysqld-exporter

这里使用docker容器启动exporter

```bash
docker run --restart=always -d -p 9104:9104 --name mysql-test -e DATA_SOURCE_NAME="exporter:mypassword@(1.1.1.1:3306)/mydb" prom/mysqld-exporter
```

## 加入prometheus

修改`prometheus.yaml`配置文件, 添加如下`job`
```yaml
scrape_configs:
  - job_name: 'mysql-test'
    static_configs:
      - targets: ['192.168.1.121:9106']
        labels:
          appname: 'mysql'
```

## 引用grafana监控模版

到 [grafana监控大盘](https://grafana.com/grafana/dashboards) 查找mysql监控模版，我这里使用最多下载量的 `7362` - `MySQL Overview` 模版

## 添加告警规则

在rules文件夹下添加一个最简单的实例存活检测告警`mysql.yaml`

```yaml
groups:
- name: mysql实例存活告警规则
  rules:
  - alert: mysql实例存活告警
    expr: up{job="mysql-test"} == 0
    for: 1m
    labels:
      user: prometheus
      severity: 严重
    annotations:
      summary: "{{ $labels.job }} 出现问题"
      description: "实例 {{ $labels.instance }} 中的 {{ $labels.job }} 服务已经下线超过1分钟，请及时处理."
      value: "{{ $value }}"
```