# 企业微信告警接入

## 企业微信后台配置

1. 访问企业微信官网： https://work.weixin.qq.com/ 注册一个企业，无需认证，注册完之后登陆后台在【我的企业】中查看 `企业ID`

    ![1](http://cdn.go99.top/docs/devops/prometheus/wechat-alert1.png)

1. 转到【通讯录】， 选择/添加 子部门，用于接收告警信息，在这个部门中的人会接收到告警信息，然后选择部门后的三个点，查看部门id

    ![2](http://cdn.go99.top/docs/devops/prometheus/wechat-alert2.png)

1. 转到【应用管理】，添加自建应用，可见范围选择刚才的子部门即可

    ![3](http://cdn.go99.top/docs/devops/prometheus/wechat-alert3.png)

1. 点击【创建应用】，之后记录`AgentId`,`Secret`信息

    ![4](http://cdn.go99.top/docs/devops/prometheus/wechat-alert4.png)

## Alertmanager服务配置

1. 在【prometheus部署】教程的 `prometheus` 文件夹下创建 `alertmanager` 文件夹，再创建 `alertmanager.yml` 文件，并添加如下配置：

    ```yml
    global:
      resolve_timeout: 1m   # 每1分钟检测一次是否恢复
      wechat_api_url: 'https://qyapi.weixin.qq.com/cgi-bin/'
      wechat_api_corp_id: 'bbbbbbbbbbbbbbbb'      # 企业微信中企业ID
      wechat_api_secret: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'      # 企业微信中，应用的Secret

    templates:
      - '/opt/alertmanager/template/*.tmpl' # 这个目录要与容器中告警模板的目录一致

    route:
      receiver: 'wechat'
      group_by: ['alertname']
      group_wait: 10s       # 初次发送告警延时
      group_interval: 1m   # 距离第一次发送告警，等待多久再次发送告警
      repeat_interval: 5m   # 告警重发时间

    receivers:
    - name: 'wechat'
      wechat_configs: 
      - send_resolved: true
        message: '{{ template "wechat.default.message" . }}'
        to_party: '2'         # 企业微信中创建的接收告警的部门【告警机器人】的部门ID
        agent_id: '1000002'     # 企业微信中创建的应用的ID
        api_secret: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'      # 企业微信中，应用的Secret
    ```
1. 在 `alertmanager`文件夹下新增文件夹 `template`, 并在template文件夹中创建告警模版 `wechat.tmpl`,内容如下

    ```text
    {{ define "wechat.default.message" }}
    {{- if gt (len .Alerts.Firing) 0 -}}
    {{- range $index, $alert := .Alerts -}}
    {{- if eq $index 0 }}
    ========= 监控报警 =========
    告警状态：{{   .Status }}
    告警级别：{{ .Labels.severity }}
    告警类型：{{ $alert.Labels.alertname }}
    故障主机: {{ $alert.Labels.instance }}
    告警主题: {{ $alert.Annotations.summary }}
    告警详情: {{ $alert.Annotations.message }}{{ $alert.Annotations.description}};
    触发阀值：{{ .Annotations.value }}
    故障时间: {{ ($alert.StartsAt.Add 28800e9).Format "2006-01-02 15:04:05" }}
    ========= = end =  =========
    {{- end }}
    {{- end }}
    {{- end }}
    {{- if gt (len .Alerts.Resolved) 0 -}}
    {{- range $index, $alert := .Alerts -}}
    {{- if eq $index 0 }}
    ========= 异常恢复 =========
    告警类型：{{ .Labels.alertname }}
    告警状态：{{   .Status }}
    告警主题: {{ $alert.Annotations.summary }}
    告警详情: {{ $alert.Annotations.message }}{{ $alert.Annotations.description}};
    故障时间: {{ ($alert.StartsAt.Add 28800e9).Format "2006-01-02 15:04:05" }}
    恢复时间: {{ ($alert.EndsAt.Add 28800e9).Format "2006-01-02 15:04:05" }}
    {{- if gt (len $alert.Labels.instance) 0 }}
    实例信息: {{ $alert.Labels.instance }}
    {{- end }}
    ========= = end =  =========
    {{- end }}
    {{- end }}
    {{- end }}
    {{- end }}
    ```
1. 运行`Alertmanager`容器，启动告警服务

    ```bash
    $ docker run -d -p 9093:9093 --name alertmanager --restart=always -v /opt/prometheus/alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml -v /opt/prometheus/alertmanager/template:/etc/alertmanager/template  docker.io/prom/alertmanager:latest
    ```
1. 容器运行完成后查看web页面 IP:9093，切换到`Status`页签，查看告警服务运行状态为 `ready` 即可。

## 配置Prometheus报警规则，并接入告警服务

* 在 `prometheus` 文件夹下新增文件夹 `rules`,并在 rules 中添加监控规则文件（这里添加主机监控规则） `node_status.yml`,内容如下：

```yml
groups:
- name: 实例存活告警规则
  rules:
  - alert: 实例存活告警
    expr: up{job="prometheus"} == 0 or up{job="mysql"} == 0
    for: 1m
    labels:
      user: prometheus
      severity: Disaster
    annotations:
      summary: "实例 {{ $labels.instance }} 下线"
      description: "实例 {{ $labels.instance }} 的 {{ $labels.job }} 已经下线超过1分钟."
      value: "{{ $value }}"

- name: 内存告警规则
  rules:
  - alert: "内存使用率告警"
    expr: (node_memory_MemTotal_bytes - (node_memory_MemFree_bytes+node_memory_Buffers_bytes+node_memory_Cached_bytes )) / node_memory_MemTotal_bytes * 100 > 75
    for: 1m
    labels:
      user: prometheus
      severity: warning
    annotations:
      summary: "服务器: {{$labels.alertname}} 内存报警"
      description: "{{ $labels.alertname }} 内存资源利用率大于75%！(当前值: {{ $value }}%)"
      value: "{{ $value }}"

- name: CPU报警规则
  rules:
  - alert: CPU使用率告警
    expr: 100 - (avg by (instance)(irate(node_cpu_seconds_total{mode="idle"}[1m]) )) * 100 > 70
    for: 1m
    labels:
      user: prometheus
      severity: warning
    annotations:
      summary: "服务器: {{$labels.alertname}} CPU报警"
      description: "服务器: CPU使用超过70%！(当前值: {{ $value }}%)"
      value: "{{ $value }}"

- name: 磁盘报警规则
  rules:
  - alert: 磁盘使用率告警
    expr: (node_filesystem_size_bytes - node_filesystem_avail_bytes) / node_filesystem_size_bytes * 100 > 80
    for: 1m
    labels:
      user: prometheus
      severity: warning
    annotations:
      summary: "服务器: {{$labels.alertname}} 磁盘报警"
      description: "服务器:{{$labels.alertname}},磁盘设备: 使用超过80%！(挂载点: {{ $labels.mountpoint }} 当前值: {{ $value }}%)"
      value: "{{ $value }}"
```

* 修改 prometheus 文件夹下的 `prometheus.yml` 配置文件，新增如下信息：

```yml
alerting:
  alertmanagers:
  - static_configs:
    - targets: [ '192.168.1.121:9093']
rule_files:
  - "rules/node_status.yml"
```

* 重启prometheus容器，访问 prometheusIP:9090，跳转到【Alert】页签即可查看到所有告警规则，也可以选择具体的告警规则进行测试。