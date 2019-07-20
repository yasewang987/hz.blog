# ELK集合镜像部署

## Elacsticsearch+Kibana+Logstash合并镜像部署

### 参考资料
1. 镜像官网地址：https://hub.docker.com/r/sebp/elk/
1. https://blog.csdn.net/qq_39284787/article/details/78874132

### Docker方式安装
#### 安装前提
1. Docker至少需要3G内存
1. Elasticsearch至少需要单独2G内存
1. 防火墙开放相关端口

#### 安装
1. 拉取镜像：`docker pull sebp/elk`
1. 进程中内存映射区域的最大数量设置:
   * 查看配置：`sysctl -p`
   * 永久修改：`sudo vim /etc/sysctl.conf`修改或添加`vm.max_map_count=262144`，至少需要262144
1. 启动容器：`docker run -p 5601:5601 -p 9200:9200 -p 5044:5044 -e ES_MIN_MEM=128m  -e ES_MAX_MEM=1024m -it --name elk sebp/elk`将镜像运行为容器，由于我本机内存不符合安装要求，为了保证ELK能够正常运行，加了-e参数限制使用最小内存及最大内存
1. 打开浏览器，输入：http://host:5601，能打开说明安装成功

#### 采集终端

需要单独安装，具体请参考`Beats`相关文档