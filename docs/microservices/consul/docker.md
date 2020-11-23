# Consul Docker容器部署

## 介绍

![img](http://cdn.go99.top/docs/microservices/consul/dockerck1.png)
* **Client:** 表示 Consul 客户端模式，是 Consul 节点的一种模式，所有注册到 Client 节点的服务会被转发到 Server 。本身无状态不持久化如何数据。Client 通过 HTTP、DNS、GRPC 接口请求转发给局域网内的服务端集群。

* **Server:** 表示 Consul 的服务端模式， Server 功能和 Client 都一样，不同的是 Server 持久化数据到本地。在局域网内与本地 Client 通讯，通过广域网与其他数据中心通讯。每个数据中心的 Server 数量推荐为 3 个或是 5 个。

* **Server-Leader:** 表示这个 Server 是它们的老大，它和其它 Server 不一样的一点是，它需要负责同步注册的信息给其它的 Server 节点，同时也要负责各个节点的健康监测。如果 Leader 宕机了，通数据中心的所有 Server 内部会使用 Raft 算法来在其中选取一个 Leader 出来。

* **Agent:** Agent 是 Consul 的核心进程，Agent 的工作是维护成员关系信息、注册服务、健康检查、响应查询等等。Consul 集群的每一个节点都必须运行 agent 进程。

## 安装

1. 拉去镜像：`docker pull consul:1.4.4`(镜像版本可以去dockerhub查看)
1. Consul镜像常用环境变量：
    * `CONSUL_CLIENT_INTERFACE`: 配置 Consul 的 `-client=<interface ip>` 命令参数
    * `CONSUL_BIND_INTERFACE`: 配置 Consul 的 `-bind=<interface ip>` 命令参数
    * `CONSUL_DATA_DIR`: 配置 Consul 的数据持久化目录
    * `CONSUL_CONFIG_DIR` 配置 Consul 的配置文件目录

1. 启动Consul-Leader和web管理器：
    ```
    $ docker run -d -p 8500:8500 -v /data/consul:/consul/data -e CONSUL_BIND_INTERFACE='eth0' --name=consul_server_1 consul:1.4.4 agent -server -bootstrap -ui -node=1 -client='0.0.0.0'
    ```
    * 提示：`/consul/data` 是 Consul 持久化地方，如果需要持久化那 Dooker 启动时候需要给它指定一个数据卷 `-v /data/consul:/consul/data`。
1. Consul命令简介：
    * `agent` : 表示启动 Agent 进程。
    * `-server`：表示启动 Consul Server 模式。
    * `-client`：表示启动 Consul Cilent 模式。
    * `-bootstrap`：表示这个节点是 `Server-Leader` ，每个数据中心只能运行一台服务器。技术角度上讲 Leader 是通过 Raft 算法选举的，但是集群第一次启动时需要一个引导 Leader，在引导群集后，建议不要使用此标志。
    * `-ui`：表示启动 Web UI 管理器，默认开放端口 8500，所以上面使用 Docker 命令把 8500 端口对外开放。
    * `-node`：节点的名称，集群中必须是唯一的(建议使用`中心-机房-机器`命名)。
    * `-client`：表示 Consul 将绑定客户端接口的地址，0.0.0.0 表示所有地址都可以访问。
    * `-join`：表示加入到某一个集群中去。 如：-join=192.168.1.23
1. 查看web管理器：`http://{Server-IP}:8500`
1. 加入其他Server
    ```bash
    # 查看集群信息
    $ docker exec consul_server_1 consul members
    Node  Address          Status  Type    Build  Protocol  DC   Segment
    1     172.17.0.2:8301  alive   server  1.4.4  2         dc1  <all>

    # 添加其他server
    $ docker run -d -e CONSUL_BIND_INTERFACE='eth0' --name=consul_server_2 consul:1.4.4 agent -server -node=2  -join='172.17.0.2'
    $ docker run -d -e CONSUL_BIND_INTERFACE='eth0' --name=consul_server_3 consul:1.4.4 agent -server -node=3  -join='172.17.0.2'
    ```
1. 客户端接入集群
    ```bash
    $ docker run -d -e CONSUL_BIND_INTERFACE='eth0' --name=consul_server_4 consul:1.4.4 agent -client -node=4 -join='172.17.0.2' -client='0.0.0.0'
    6e0604490eb49363d28249a5277c03173b258aa55965d70eb5b5438a0a6b7eea

    $ docker run -d -e CONSUL_BIND_INTERFACE='eth0' --name=consul_server_5 consul:1.4.4 agent -client -node=5 -join='172.17.0.2' -client='0.0.0.0'
    25e9792c6d5949ba3fcf73432ed2933568726d214d6819ab52d2b6eaa00d7842

    $ docker run -d -e CONSUL_BIND_INTERFACE='eth0' --name=consul_server_6 consul:1.4.4 agent -client -node=5 -join='172.17.0.2' -client='0.0.0.0'
    c7333068c1679f8f9e8c8c0be0fcf68f93f85b2c45dd177e4757217bdfa55d7a
    ```
