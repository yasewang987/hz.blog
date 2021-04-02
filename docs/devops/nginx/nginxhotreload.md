# Nginx配置文件热更新

## consul-template

![1](http://cdn.go99.top/docs/devops/other/consultemplate1.png)

### 安装consul，consul-template

直接到官网下载可执行文件或者使用docker安装

https://hashicorp.com

使用`consul-template -h`查看支持的命令

consul-template语法可以到官网查看

### Consul-Template使用实例

假设consul中已经注册服务service-front，通过命令行方式输出已经注册服务的名称和Tags

```bash
curl http://10.200.110.90:8500/v1/catalog/service/service-front

# 一般输出如下信息
# [{"ID":"d1b05900-4f8f-b956-5ba6-5a3c798d93d3","Node":"10.200.110.91","Address":"10.200.110.91","Datacenter":"shenzhen","TaggedAddresses":{"lan":"10.200.110.91","wan":"10.200.110.91"},"NodeMeta":{"consul-network-segment":""},"ServiceKind":"","ServiceID":"service-front-10-200-110-100-8001","ServiceName":"service-front","ServiceTags":["front-dev,这是个前置应用，网关层","duan"],"ServiceAddress":"10.200.110.100","ServiceWeights":{"Passing":1,"Warning":1},"ServiceMeta":{},"ServicePort":8001,"ServiceEnableTagOverride":false,"ServiceProxyDestination":"","ServiceProxy":{},"ServiceConnect":{},"CreateIndex":11382,"ModifyIndex":11382},{"ID":"382f88c2-4482-e1f7-1453-28f94ff65108","Node":"10.200.110.97","Address":"10.200.110.97","Datacenter":"shenzhen","TaggedAddresses":{"lan":"10.200.110.97","wan":"10.200.110.97"},"NodeMeta":{"consul-network-segment":""},"ServiceKind":"","ServiceID":"front1","ServiceName":"service-front","ServiceTags":["local-dev"],"ServiceAddress":"","ServiceWeights":{"Passing":1,"Warning":1},"ServiceMeta":{},"ServicePort":8001,"ServiceEnableTagOverride":false,"ServiceProxyDestination":"","ServiceProxy":{},"ServiceConnect":{},"CreateIndex":11976,"ModifyIndex":11976}][root@localhost consul-template]
```

通过consul-template生成nginx配置文件

```bash
vim tmpltest.ctmpl

# 输入如下内容
{{range services}}
{{.Name}}
{{range .Tags}}
{{.}}{{end}}
{{end}}
```

调用模板文件生成查询结果

```bash
# -consul-addr:指定Consul的API接口 ，默认是8500端口。
# -template：模板参数，第一个参数是模板文件位置，第二个参数是结果输出位置。
# -once：只运行一次就退出。
consul-template -consul-addr 10.200.110.90:8500 -template "tmpltest.ctmpl:result" -once
```

查看模板渲染的结果

```bash
cat result 

# 输入如下内容
consul

service-consumer

service-demo

jar

service-front

duan
front-dev #这是个前置应用，网关层
local-dev

service-producter
```
* consul是系统自带的服务；
* service-front是通过consul的配置方式注册的服务,其Tags为【duan front-dev,这是个前置应用，网关层 local-dev】；

根据已注册的服务动态生成Nginx配置文件

新建Nginx配置模板文件

```bash
{{range services}} {{$name := .Name}} {{$service := service .Name}}
upstream {{$name}} {
  zone upstream-{{$name}} 64k;
  {{range $service}}server {{.Address}}:{{.Port}} max_fails=3 fail_timeout=60 weight=1;
  {{else}}server 127.0.0.1:65535; # force a 502{{end}}
} {{end}}

server {
  listen 80 default_server;

  location / {
    root /usr/share/nginx/html/;
    index index.html;
  }

  location /stub_status {
    stub_status;
  }

{{range services}} {{$name := .Name}}
  location /{{$name}} {
    proxy_pass http://{{$name}};
  }
{{end}}
}
```

调用模板文件生成Nginx配置文件

```bash
consul-template -consul-addr 10.200.110.90:8500 -template="nginx.conf.ctmpl:default.conf" -once

# 生成结果如下
upstream consul {
  zone upstream-consul 64k;
  server 10.200.110.90:8300 max_fails=3 fail_timeout=60 weight=1;
  server 10.200.110.91:8300 max_fails=3 fail_timeout=60 weight=1;
  server 10.200.110.93:8300 max_fails=3 fail_timeout=60 weight=1;
  
}   
upstream service-consumer {
  zone upstream-service-consumer 64k;
  server 10.200.110.89:8091 max_fails=3 fail_timeout=60 weight=1;
  server 10.200.110.90:8091 max_fails=3 fail_timeout=60 weight=1;
  
}   
upstream service-demo {
  zone upstream-service-demo 64k;
  server 10.200.110.97:8071 max_fails=3 fail_timeout=60 weight=1;
  
}   
upstream service-front {
  zone upstream-service-front 64k;
  server 10.200.110.97:8001 max_fails=3 fail_timeout=60 weight=1;
  
}   
upstream service-producter {
  zone upstream-service-producter 64k;
  server 10.200.110.95:8081 max_fails=3 fail_timeout=60 weight=1;
  
} 

server {
  listen 80 default_server;

  location / {
    root /usr/share/nginx/html/;
    index index.html;
  }

  location /stub_status {
    stub_status;
  }

 
  location /consul {
    proxy_pass http://consul;
  }
 
  location /service-consumer {
    proxy_pass http://service-consumer;
  }
 
  location /service-demo {
    proxy_pass http://service-demo;
  }
 
  location /service-front {
    proxy_pass http://service-front;
  }
 
  location /service-producter {
    proxy_pass http://service-producter;
  }

}
```

如果想生成Nginx配置文件后自动加载配置，需要加`service nginx reload`，可以这样：

```bash
consul-template -consul-addr 10.200.110.90:8500 -template="nginx.conf.ctmpl:/usr/local/nginx/conf/conf.d/default.conf:service nginx reload" -once
```

### consul-template以服务方式运行

```bash
consul-template -consul-addr=10.200.110.90:8500 -template "tmpltest.ctmpl:test.out"
```

### 渲染多个模板

```bash
consul-template \
  -consul-addr=10.200.110.90:8500 \
  -retry 30s \
  -once \
  -template "nginx.ctmpl:/etc/nginx/nginx.conf:service nginx restart" \
  -template "redis.ctmpl:/etc/redis/redis.conf:service redis restart" \
  -template "haproxy.ctmpl:/etc/haproxy/haproxy.conf:service haproxy restart"
```

### 使用配置文件代替命令中的参数

更多详细的参数可以参考这里： https://github.com/hashicorp/consul-template#configuration-file-format

运行命令：

```bash
consul-template -config "nginx.hcl"
```

简易配置：

```json
vim nginx.hcl

consul {
address = "10.200.110.90:8500"
}

template {
source = "nginx.conf.ctmpl"
destination = "/usr/local/nginx/conf/conf.d/default.conf"
command = "service nginx reload"
}
```

稍微详细的配置:

```json
consul {

  auth {
    enabled  = true
    username = "test"
    password = "test"
  }

  address = "192.168.2.210:8500"
  token = "abcd1234"

  retry {
    enabled = true
    attempts = 5
    backoff = "250ms"
  }

  ssl {

    enabled = true
    verify = false
    cert = "/path/to/client/cert"
    key = "/path/to/client/key"
    ca_cert = "/path/to/ca"
    ca_path = "path/to/certs/"
    server_name = "my-server.com"
  }
}

reload_signal = "SIGHUP"
dump_signal = "SIGQUIT"
kill_signal = "SIGINT"
max_stale = "10m"
log_level = "warn"
pid_file = "/path/to/pid"


wait {
  min = "5s"
  max = "10s"
}

vault {
  address = "https://vault.service.consul:8200"
  token = "abcd1234"
  unwrap_token = true
  renew_token = true
  retry {
    # ...
  }

  ssl {
    # ...
  }
}


syslog {
  enabled = true
  facility = "LOCAL5"
}


deduplicate {
  enabled = true
  prefix = "consul-template/dedup/"
}


exec {
  command = "/usr/bin/app"
  splay = "5s"
  env {

    pristine = false
    custom = ["PATH=$PATH:/etc/myapp/bin"]
    whitelist = ["CONSUL_*"]
    blacklist = ["VAULT_*"]
  }

  reload_signal = ""
  kill_signal = "SIGINT"
  kill_timeout = "2s"
}

template {

  source = "/path/on/disk/to/template.ctmpl"
  destination = "/path/on/disk/where/template/will/render.txt"
  contents = "{{ keyOrDefault \"service/redis/maxconns@east-aws\" \"5\" }}"
  command = "restart service foo"
  command_timeout = "60s"
  perms = 0600
  backup = true
  left_delimiter  = "{{"
  right_delimiter = "}}"

  wait {
    min = "2s"
    max = "10s"
  }
}
```

