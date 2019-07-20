# ELK组件拆分并以Docker部署

* 官网：https://www.elastic.co
* Docker官网镜像地址：https://www.docker.elastic.co/#

## Elasticsearch
---
### 参考资料
1. https://www.jianshu.com/p/b81e1b7c0efb
1. https://www.docker.elastic.co/# 在对应镜像的后面有参考资料

### Docker方式部署
1. 修改进程中内存映射区域的最大数量：
   查看当前值：`grep vm.max_map_count /etc/sysctl.conf`  
   永久性修改：`sudo vim /etc/sysctl.conf`修改或添加`vm.max_map_count=262144`,至少需要262144
   运行时修改：`sysctl -w vm.max_map_count=262144`
1. 拉取镜像：`docker pull docker.elastic.co/elasticsearch/elasticsearch:6.4.2`，最好拉取指定版本，防止镜像版本不一致问题。
1. 运行容器：`docker run -d -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" -- name elasticsearch docker.elastic.co/elasticsearch/elasticsearch:6.4.2`
   > 如果实际使用中，可能需要设置集群等操作。因实际情况而定。如果你需要存储历史数据，那么就可能需要将data目录保存到本地，使用-v，或者mount参数挂载本地一个目录
1. 验证是否成功：如果开启防火墙，需要先开放端口，然后访问：http://ip:9200 如果没有错误信息说明成功

---

## Logstash
---
kibana和ES的安装，如果我们在开发环境中并不需要太多的关注他们的详细配置。但是logstash和filebeat我们需要注意下它的配置，因为这两者是我们完成需求的重要点。  

logstash我们只让它进行日志处理，处理完之后将其输出到elasticsearch。logstash中有很多filter插件可以使用（关于插件的资料，可以查看官网logstash的教程）

### 参考资料
1. https://www.jianshu.com/p/b81e1b7c0efb
1. https://www.docker.elastic.co/# 在对应镜像的后面有参考资料

### Dockr方式安装
1. 在服务器用户目录中新建`elk`文件夹，新建`logstash.conf`文件，并修改配置如下（使用grok filter插件）：
   ```bash
   input {
    beats {
        host => "localhost" # logstash地址
        port => "5043" # 暴露的端口号
      }
    }
    filter {
      if [fields][doc_type] == 'order' {
        grok {
            match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{JAVALOGMESSAGE:msg}" }
        }
      }

      if [fields][doc_type] == 'customer' { # 这里写两个一样的grok，实际上可能出现多种不同的日志格式，这里做个提示而已,当然如果是相同的格式，这里可以不写的
        grok {
            match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{JAVALOGMESSAGE:msg}" }
        }
      }
    }
    output {
      stdout { codec => rubydebug }
      elasticsearch {
        hosts => [ "localhost:9200" ] ## 如果和elastic不在同一台服务器，可以替换成对应ip地址即可（只要这个地址能ping通）
        index => "%{[fields][doc_type]}-%{+YYYY.MM.dd}"
      }
    }
   ```
   在logstash.conf中，我们主要使用`[fields][doc_type]`来标明日志的类型，这个值实在`filebeat`中定义的。
1. 拉取镜像：`docker pull docker.elastic.co/logstash/logstash:6.4.2`
1. 运行容器：`docker run --rm -it --name logstash --link elasticsearch -d -v ~/elk/logstash.conf:/usr/share/logstash/pipeline/logstash.conf docker.elastic.co/logstash/logstash:6.4.2`
   > `--rm`表示容器在退出时删除，`--link`如果elasticsearch和logstash不在同一台服务器就不用指定了，`-v`表示将宿主机的`～/elk/logstash.conf`映射到容器的`/usr/share/logstash/pipeline/logstash.conf`
1. 验证：查看容器运行日志(`docker logs -f logstash`)，如果没有报错信息说明运行正常。还有一种方式，可以访问kibana控制台（http://ip:5601）-management-kibana-index patterns查看是否有logstash类型的discovery

---

## Kibana
---
kibana的作用主要是帮助我们将日志文件可视化。便于我们操作，统计等。它需要ES服务，所以我们将部署好的es和kibana关联起来，主要用到的参数是--link:
### 参考资料
1. https://www.jianshu.com/p/b81e1b7c0efb
1. https://www.docker.elastic.co/# 在对应镜像的后面有参考资料

### Dokcer方式安装
1. 拉取镜像：`docker pull docker.elastic.co/kibana/kibana:6.4.2`
1. 运行容器：`docker run -d -p 5601:5601 --link elasticsearch -e ELASTICSEARCH_URL=http://elasticsearch:9200 --name kibana docker.elastic.co/kibana/kibana:6.4.2`
   > 使用link参数，会在kibana容器hosts文件中加入elasticsearch ip地址，这样我们就直接通过定义的name来访问es服务了。如果是部署在不同的服务器中，可以使用ip地址替代
1. 验证：安装完成后，访问 http://ip:5601 如果显示Kibana控制台说明安装成功

---

## Filebeat

---
filebeat是一个轻量级收集器，我们使用它来收集文件日志，将不同文件夹下的日志进行tag，之后发送给logstash。

### 参考资料
1. https://www.docker.elastic.co/# 在对应的filebeat镜像地址后会有教程
1. 下载地址：https://www.elastic.co/products/beats

### 安装

#### Win
进入下载地址，选择`filebeat`下载，解压

### 配置
修改`filebeat.yml`文件
```bash
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/*.log
    #- c:\programdata\elasticsearch\logs\*
```
 使用logstash：
 ```bash
 #--------------- Logstash output --------------------
output.logstash:
  hosts: ["127.0.0.1:5044"]
 ```
 * 需要将其他的output方式注释掉才能正常启动

 ### 启动

 #### Win：
 在filebeat文件夹打开命令行，输入`./filebeat`即可启动，可以在文件夹中的logs中查看到运行日志。

---

