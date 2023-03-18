# Docker Swarm

## 简单概念介绍
`Swarm` 是 `Docker` 社区提供的唯一一个原生支持 `Docker` 集群管理的工具。它可以把多个 `Docker` 主机组成的系统转换为单一的虚拟 `Docker` 主机，使得容器可以组成跨主机的子网网络。

有两种类型的节点： `managers` 和 `workers`.

* 管理节点（managers）:管理节点用于 Swarm 集群的管理，docker swarm 命令基本只能在管理节点执行（节点退出集群命令 docker swarm leave 可以在工作节点执行）。一个 Swarm 集群可以有多个管理节点，但只有一个管理节点可以成为 leader，leader 通过 raft 协议实现。`N`个管理节点的集群容忍最多损失 `(N-1)/2` 个管理节点。 Docker建议一个集群最多`7`个管理器节点。 重要说明：添加更多管理节点并不意味着可扩展性更高或性能更高。一般而言，情况正好相反。
* 工作节点（workers）: 工作节点是任务执行节点，管理节点将服务 (service) 下发至工作节点执行。管理节点默认也作为工作节点。你也可以通过配置让服务只运行在管理节点。
* 服务 （Services）: 是指一组任务的集合，服务定义了任务的属性。服务有两种模式。通过 `docker service create` 的 `–mode` 参数指定
    * `replicated services` （复制服务）按照一定规则在各个工作节点上运行指定个数的任务。
    * `global services` （全局服务）每个工作节点上运行一个任务。
* 任务 （Task）: 是 Swarm 中的最小的调度单位，目前来说就是一个单一的容器。

## 部署

前置处理：

```bash
# 设置主机名
master执行：hostnamectl set-hostname master
node01执行：hostnamectl set-hostname node01
node02执行：hostnamectl set-hostname node02

# 安装docker，参考docker安装文档
```

初始化Swarm

```bash
# 主节点（最后是主节点IP）
docker swarm init --advertise-addr 192.168.33.11
# 初始化完成之后会输出如下信息，需要记录用于工作节点加入集群
docker swarm join --token SWMTKN-1-3v46nt5v1uinmnl6x6ggxx1w7nbbh3yqzs5mu0gloxg58u7ntv-6eazokhvzyctk5ycl3msba36a 192.168.33.11:2377

# 工作节点加入集群
docker swarm join --token SWMTKN-1-3v46nt5v1uinmnl6x6ggxx1w7nbbh3yqzs5mu0gloxg58u7ntv-6eazokhvzyctk5ycl3msba36a 192.168.33.11:2377
# 输出如下信息说明已经加入：
 This node joined a swarm as a worker
 # 工作节点如果要升级为主节点
docker node promote node01
docker node promote node02
```

## 常用命令

```bash
# 查看节点信息
docker node ls
# 管理节点删除指定工作节点
docker node rm node1
# 退出swarm集群 - 工作节点
docker swarm leave
# 退出swarm集群 - 主节点
docker swarm leave -f
# node update: 更改节点状态
# --availability: 三种状态
#	  active: 正常
#   pause：挂起
#   drain：排除
# 主节点只做管理节点不跑其他服务(如果允许部署服务，只需要设置为active)
docker node update --availability drain manager
# 工作节点从集群中排除，其上的容器会被转移到其它可运行的节点上
docker node update --availability drain node1

### swarm创建特定网络
docker network create -d overlay niginx_network
# 服务使用指定网络
docker service create --replicas 1 --network niginx_network --name my_nginx -p 80:80 nginx:latest


### 部署集群服务
# replicas:指定运行服务的数量.（和k8s需要运行的副本数道理是一样的）
docker service create --replicas 1 --name 别名 镜像ID
# 例如 以下命令将nginx容器中的端口80发布到群集中任何节点的端口8080
docker service create \
  --name my-web \
  --publish published=8080,target=80 \
  --replicas 3 \
  nginx
### 查看集群服务列表
docker service ls
### 服务扩容/缩容 (上面运行的nginx服务变成了2个)
docker service scale my-web=2
# 也可以用update命令代替
docker service update --replicas 2 my-web
### 滚动更新服务
# --update-parallelism 2: 每次允许两个服务一起更新
#--update-failure-action continue: 更新失败后的动作是继续
# --rollback-parallelism 2: 回滚时允许两个一起
# --rollback-monitor 20s: 回滚监控时间20s
# --rollback-max-failure-ratio 0.2: 回滚失败率20%
docker service create \
--name my-web \
--replicas 10 \
--update-delay 10s \
--update-parallelism 2 \
--update-failure-action continue \
--rollback-parallelism 2 \
--rollback-monitor 20s \
--rollback-max-failure-ratio 0.2 \
nginx:1.12.1
# 如果执行后查看状态不是设置的，可以在update一下，将服务状态设置为自己想要的
docker service update --rollback-monitor 20s  my-web
docker service update --rollback-max-failure-ratio 0.2 my-web
### 查看服务状态信息
docker service ps my-web
docker service inspect --pretty my-web
### 也可以使用update滚动更新镜像版本
docker service update --image nginx:1.13 my-web
### 服务回滚
# 刚才nginx版本已经是1.13了，现在将其还原到1.12.1　
docker service update --rollback my-web
### 移除服务
docker service rm my-web
```