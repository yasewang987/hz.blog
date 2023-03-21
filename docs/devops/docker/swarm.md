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
# 查看节点列表
docker node ls
# 查看指定节点详细信息
docker node inspect master1
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
### 查看服务日志(raw参数格式化日志)
docker service logs -f --tail=200 --raw my-web
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
### 查看服务异常退出详细信息
docker service ps --no-trunc my-web
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

### 运行一个测试容器
docker service create --network fcnet --name test -td 10.3.5.16:5000/py:amd sh -c 'tail -f /dev/null'
```

## 磁盘挂载

```bash
#### 挂载主机磁盘
docker service create --constraint 'node.role==manager' \
# 对外暴露端口
-p 12345:9200 -e "discovery.type=single-node" \
# 挂载主机磁盘
--mount type=bind,src=/opt/funcun/data/es/config/elasticsearch.yml,dst=/usr/share/elasticsearch/config/elasticsearch.yml \
--name fc-es 10.3.5.16:5000/es:7.13.0

#### 挂载数据卷
# 创建数据卷
docker volume create data_mongo
# 查看数据卷列表
docker volume ls
# 查看数据卷详情
docker volume inspect data_mongo
# 删除数据卷
docker volume rm data_mongo
# 挂载已存在的数据卷（允许读写）
docker service create \
  --mount src=<VOLUME-NAME>,dst=<CONTAINER-PATH> \
  --name myservice \
  <IMAGE>
# 只读
docker service create \
  --mount type=bind,src=<HOST-PATH>,dst=<CONTAINER-PATH>,readonly \
  --name myservice \
  <IMAGE>
```

## Label节点标签及服务约束

多节点 Swarm 集群下，可能节点的配置不同（比如 CPU、内存等），部署着不同类型的服务（比如 Web服务、Job服务等），当这些服务以 Service 或者 Stack 的形式部署到集群，默认情况下会随机分配到各个节点。

`constraints` 可以匹配 `node` 标签和 `engine` 标签，`engine.labels` 适用于 Docker Engine 标签，如操作系统，驱动程序等，`node.labels` 适用于上述人为添加到节点的。

node|attribute matches|example
---|---|---
node.id|Node ID|node.id==2ivku8v2gvtg4
node.hostname|Node hostname|node.hostname!=node-2
node.role|Node role|node.role==manager
node.labels|user defined node labels|node.labels.security==high
engine.labels|Docker Engine's labels|engine.labels.operatingsystem==ubuntu 14.04

可以通过设置Label等方式部署到指定节点

标签方式：
```bash
# 添加标签
docker node update --label-add role=masl master1
# 查看节点标签
docker node inspect master1
# 删除标签
docker node update --label-rm role master1
# 服务运行到指定标签的节点
docker service create --name my-web -e TZ="Asia/Shanghai" --replicas 2 -p 8081:8080 --constraint 'node.labels.role == masl' nginx:1.20.1
```
其他方式：
```bash
# 设置hostname
hostnamectl set-hostname fcmaster
# host方式
docker service create --name my-web -e TZ="Asia/Shanghai" --replicas 2 -p 8081:8080 --constraint 'node.hostname==fcmaster' nginx:1.20.1

# role方式(manager表示管理节点)
docker service create --name my-web -e TZ="Asia/Shanghai" --replicas 2 -p 8081:8080 --constraint 'node.role==manager' nginx:1.20.1
```

## docker stack

```yaml
services:
    nginx:
         image: nginx
         ports:
           - target: 80
           - published: 80
           - protocol: tcp
           - mode: ingress
         deploy:
           mode: global
           placement:
              constraints:                      # 添加条件约束
                - node.hostname==fcmaster
           restart_policy:
             condition: on-failure
             max_attempts: 3
```

## service参数详解

### `create`:

``` bash
[root@centos181001 ~]# docker service create --help

Usage:  docker service create [OPTIONS] IMAGE [COMMAND] [ARG...]

Create a new service

Options:
      --config config                      Specify configurations to expose to the service
      --constraint list                    Placement constraints
      --container-label list               Container labels
                                            容器标签

      --credential-spec credential-spec    Credential spec for managed service account (Windows only)
  -d, --detach                             Exit immediately instead of waiting for the service to converge
                                            立即退出而不是等待服务收敛

      --dns list                           Set custom DNS servers
                                            指定DNS

      --dns-option list                    Set DNS options
                                            设置DNS选项

      --dns-search list                    Set custom DNS search domains
                                            设置DNS搜索域

      --endpoint-mode string               Endpoint mode (vip or dnsrr) (default "vip")
                                            端点模式 (vip or dnsrr) (default "vip")

      --entrypoint command                 Overwrite the default ENTRYPOINT of the image
                                            覆盖镜像的默认ENTRYPOINT

  -e, --env list                           Set environment variables
                                            设置环境变量

      --env-file list                      Read in a file of environment variables
                                            从配置文件读取环境变量

      --generic-resource list              User defined resources
      --group list                         Set one or more supplementary user groups for the container
      --health-cmd string                  Command to run to check health
                                            健康检查命令

      --health-interval duration           Time between running the check (ms|s|m|h)
                                            健康检查间隔 (ms|s|m|h)

      --health-retries int                 Consecutive failures needed to report unhealthy
                                            报告不健康需要连续失败次数

      --health-start-period duration       Start period for the container to initialize before counting retries towards unstable (ms|s|m|h)
                                            在重试计数到不稳定之前，开始容器初始化的时间段(ms|s|m|h)

      --health-timeout duration            Maximum time to allow one check to run (ms|s|m|h)
                                            允许一次健康检查最长运行时间 (ms|s|m|h)

      --host list                          Set one or more custom host-to-IP mappings (host:ip)
                                            设置一个或多个自定义主机到IP映射 (host:ip)

      --hostname string                    Container hostname
                                            容器名称

      --init                               Use an init inside each service container to forward signals and reap processes
                                            在每个服务容器中使用init来转发信号并收集进程

      --isolation string                   Service container isolation mode
                                            服务容器隔离模式

  -l, --label list                         Service labels
                                            服务标签
      --limit-cpu decimal                  Limit CPUs
                                            CPU限制

      --limit-memory bytes                 Limit Memory
                                            内存限制

      --log-driver string                  Logging driver for service
      --log-opt list                       Logging driver options
      --mode string                        Service mode (replicated or global) (default "replicated")
      --mount mount                        Attach a filesystem mount to the service
      --name string                        Service name
                                            服务名称

      --network network                    Network attachments
                                            网络

      --no-healthcheck                     Disable any container-specified HEALTHCHECK
      --no-resolve-image                   Do not query the registry to resolve image digest and supported platforms
      --placement-pref pref                Add a placement preference
  -p, --publish port                       Publish a port as a node port
                                            发布端口

  -q, --quiet                              Suppress progress output
                                            简化输出

      --read-only                          Mount the container's root filesystem as read only
                                            将容器的根文件系统挂载为只读

      --replicas uint                      Number of tasks
                                            同时运行的副本数

      --reserve-cpu decimal                Reserve CPUs
                                            为本服务需要预留的CPU资源

      --reserve-memory bytes               Reserve Memory
                                            为本服务需要预留的内存资源

      --restart-condition string           Restart when condition is met ("none"|"on-failure"|"any") (default "any")
                                            满足条件时重新启动("none"|"on-failure"|"any") (default "any")

      --restart-delay duration             Delay between restart attempts (ns|us|ms|s|m|h) (default 5s)
                                            重启尝试之间的延迟 (ns|us|ms|s|m|h) (default 5s)

      --restart-max-attempts uint          Maximum number of restarts before giving up
                                            放弃前的最大重启次数

      --restart-window duration            Window used to evaluate the restart policy (ns|us|ms|s|m|h)
      --rollback-delay duration            Delay between task rollbacks (ns|us|ms|s|m|h) (default 0s)
                                            任务回滚之间的延迟(ns|us|ms|s|m|h) (default 0s)

      --rollback-failure-action string     Action on rollback failure ("pause"|"continue") (default "pause")
                                            回滚失败的操作("pause"|"continue") (default "pause")

      --rollback-max-failure-ratio float   Failure rate to tolerate during a rollback (default 0)
                                            回滚期间容忍的失败率(default 0)

      --rollback-monitor duration          Duration after each task rollback to monitor for failure (ns|us|ms|s|m|h) (default 5s)
                                            每次任务回滚后监视失败的持续时间 (ns|us|ms|s|m|h) (default 5s)

      --rollback-order string              Rollback order ("start-first"|"stop-first") (default "stop-first")
                                            回滚选项("start-first"|"stop-first") (default "stop-first")

      --rollback-parallelism uint          Maximum number of tasks rolled back simultaneously (0 to roll back all at once) (default 1)
                                            同时回滚的最大任务数（0表示一次回滚）（默认值为1）

      --secret secret                      Specify secrets to expose to the service
                                            指定要公开给服务的秘钥

      --stop-grace-period duration         Time to wait before force killing a container (ns|us|ms|s|m|h) (default 10s)
                                            在强行杀死容器之前等待的时间(ns|us|ms|s|m|h) (default 10s)

      --stop-signal string                 Signal to stop the container
                                            发出信号停止容器

  -t, --tty                                Allocate a pseudo-TTY
                                            分配伪终端

      --update-delay duration              Delay between updates (ns|us|ms|s|m|h) (default 0s)
                                            更新之间的延迟(ns|us|ms|s|m|h) (default 0s)

      --update-failure-action string       Action on update failure ("pause"|"continue"|"rollback") (default "pause")
                                            更新失败后选项("pause"|"continue"|"rollback") (default "pause")
      --update-max-failure-ratio float     Failure rate to tolerate during an update (default 0)
                                            更新期间容忍的故障率（默认为0）

      --update-monitor duration            Duration after each task update to monitor for failure (ns|us|ms|s|m|h) (default 5s)
                                            每次更新任务后监视失败的持续时间（ns | us | ms | s | m | h）（默认为5s）

      --update-order string                Update order ("start-first"|"stop-first") (default "stop-first")
                                            更新选项 ("start-first"|"stop-first") (default "stop-first")

      --update-parallelism uint            Maximum number of tasks updated simultaneously (0 to update all at once) (default 1)
                                            同时更新的最大任务数（0表示一次更新所有任务）（默认值为1）

  -u, --user string                        Username or UID (format: <name|uid>[:<group|gid>])
      --with-registry-auth                 Send registry authentication details to swarm agents
                                            将注册表验证详细信息发送给swarm代理

  -w, --workdir string                     Working directory inside the container
                                            指定容器内工作目录(workdir)
```

### `inspect`:

```bash
[root@centos181001 nginx]# docker service inspect --help

Usage:  docker service inspect [OPTIONS] SERVICE [SERVICE...]

Display detailed information on one or more services

Options:
  -f, --format string   Format the output using the given Go template
                        使用给定的Go模板格式化输出

      --pretty          Print the information in a human friendly format
                        以人性化的格式打印信息
```

### `logs`:

```bash
[root@centos181001 nginx]# docker service logs --help

Usage:  docker service logs [OPTIONS] SERVICE|TASK

Fetch the logs of a service or task

Options:
      --details        Show extra details provided to logs
  -f, --follow         Follow log output
                        持续输出日志，相当于``tail -f``

      --no-resolve     Do not map IDs to Names in output
                        不要将容器名称输出到日志，而使用CONTAINER ID

      --no-task-ids    Do not include task IDs in output
                        不要将task ID输出到日志

      --no-trunc       Do not truncate output
                        不要截断输出

      --raw            Do not neatly format logs
                        不要整齐地格式化日志（会将前边的容器ID信息等去掉，只保留原始日志内容）

      --since string   Show logs since timestamp (e.g. 2013-01-02T13:23:37) or relative (e.g. 42m for 42 minutes)
                        显示自时间戳（例如2013-01-02T13：23：37）或相对（例如42分钟42分钟）以来的日志

      --tail string    Number of lines to show from the end of the logs (default "all")
                        从日志末尾显示的行数（默认为“全部”）

  -t, --timestamps     Show timestamps
                        显示时间戳
```

### `ls`选项 - 列出服务

```bash
[root@centos181001 nginx]# docker service ls --help

Usage:  docker service ls [OPTIONS]

List services

Aliases:
  ls, list

Options:
  -f, --filter filter   Filter output based on conditions provided
                        根据提供的条件过滤输出

      --format string   Pretty-print services using a Go template
                        使用Go模板的漂亮打印服务

  -q, --quiet           Only display IDs
                        只显示服务ID
```

### `ps`选项 - 列出一个或多个服务`tasks`

```bash
[root@centos181001 nginx]# docker service ps --help

Usage:  docker service ps [OPTIONS] SERVICE [SERVICE...]

List the tasks of one or more services

Options:
  -f, --filter filter   Filter output based on conditions provided
                        根据提供的条件过滤输出

      --format string   Pretty-print tasks using a Go template
                        使用Go模板的漂亮打印任务

      --no-resolve      Do not map IDs to Names
                        服务名和node名称不要显示名字，而显示ID

      --no-trunc        Do not truncate output
                        不要截断输出

  -q, --quiet           Only display task IDs
                        只输出task ID
```

### `rollback`选项 - 回滚服务

```bash
[root@centos181001 nginx]# docker service rollback --help

Usage:  docker service rollback [OPTIONS] SERVICE

Revert changes to a service's configuration

Options:
  -d, --detach   Exit immediately instead of waiting for the service to converge
                    立即退出而不是等待服务收敛

  -q, --quiet    Suppress progress output
                    抑制进度输出
```

### `scale`选项 - 缩容或者扩容服务

```bash
[root@centos181001 nginx]# docker service scale --help

Usage:  docker service scale SERVICE=REPLICAS [SERVICE=REPLICAS...]

Scale one or multiple replicated services

Options:
  -d, --detach   Exit immediately instead of waiting for the service to converge
                    立即退出而不是等待服务收敛

    示例：
    docker service scale tender_hofstadter=2
```

### `update`选项 - 更新一个服务

```bash
[root@centos181001 nginx]# docker service update --help

Usage:  docker service update [OPTIONS] SERVICE

Update a service

Options:
      --args command                       Service command args
      --config-add config                  Add or update a config file on a service
      --config-rm list                     Remove a configuration file
      --constraint-add list                Add or update a placement constraint
      --constraint-rm list                 Remove a constraint
      --container-label-add list           Add or update a container label
      --container-label-rm list            Remove a container label by its key
      --credential-spec credential-spec    Credential spec for managed service account (Windows only)
  -d, --detach                             Exit immediately instead of waiting for the service to converge
                                            立即退出而不是等待服务收敛

      --dns-add list                       Add or update a custom DNS server
                                            添加或更新自定义DNS

      --dns-option-add list                Add or update a DNS option
                                            添加或更新DNS选项

      --dns-option-rm list                 Remove a DNS option
                                            删除一个DNS选项

      --dns-rm list                        Remove a custom DNS server
                                            删除一个自定义DNS

      --dns-search-add list                Add or update a custom DNS search domain
                                            添加或更新自定义DNS搜索域

      --dns-search-rm list                 Remove a DNS search domain
                                            删除一个自定义DNS搜索域

      --endpoint-mode string               Endpoint mode (vip or dnsrr)
                                            端点模式（vip或dnsrr）

      --entrypoint command                 Overwrite the default ENTRYPOINT of the image
                                            覆盖图像的默认ENTRYPOINT

      --env-add list                       Add or update an environment variable
                                            添加或更新环境变量

      --env-rm list                        Remove an environment variable
                                            删除一个环境变量

      --force                              Force update even if no changes require it
                                            即使没有更改需要，也强制更新

      --generic-resource-add list          Add a Generic resource
                                            添加通用资源

      --generic-resource-rm list           Remove a Generic resource
                                            删除通用资源

      --group-add list                     Add an additional supplementary user group to the container
                                            向容器添加一个用户组

      --group-rm list                      Remove a previously added supplementary user group from the container
                                            从容器中删除以前添加的补充用户组

      --health-cmd string                  Command to run to check health
      --health-interval duration           Time between running the check (ms|s|m|h)
      --health-retries int                 Consecutive failures needed to report unhealthy
                                            报告不健康需要连续失败次数

      --health-start-period duration       Start period for the container to initialize before counting retries towards unstable (ms|s|m|h)
      --health-timeout duration            Maximum time to allow one check to run (ms|s|m|h)
      --host-add list                      Add a custom host-to-IP mapping (host:ip)
      --host-rm list                       Remove a custom host-to-IP mapping (host:ip)
      --hostname string                    Container hostname
      --image string                       Service image tag
                                            定义服务image和标签

      --init                               Use an init inside each service container to forward signals and reap processes
                                            在每个服务容器中使用init来转发信号并收集进程

      --isolation string                   Service container isolation mode
                                            服务容器隔离模式

      --label-add list                     Add or update a service label
                                            添加或更新service标签

      --label-rm list                      Remove a label by its key
                                            删除service标签

      --limit-cpu decimal                  Limit CPUs
                                            CPU限制

      --limit-memory bytes                 Limit Memory
                                            内存限制

      --log-driver string                  Logging driver for service
      --log-opt list                       Logging driver options
      --mount-add mount                    Add or update a mount on a service
      --mount-rm list                      Remove a mount by its target path
      --network-add network                Add a network
      --network-rm list                    Remove a network
      --no-healthcheck                     Disable any container-specified HEALTHCHECK
      --no-resolve-image                   Do not query the registry to resolve image digest and supported platforms
      --placement-pref-add pref            Add a placement preference
      --placement-pref-rm pref             Remove a placement preference
      --publish-add port                   Add or update a published port
      --publish-rm port                    Remove a published port by its target port
  -q, --quiet                              Suppress progress output
                                            简化输出

      --read-only                          Mount the container's root filesystem as read only
                                            将容器的根文件系统挂载为只读

      --replicas uint                      Number of tasks
      --reserve-cpu decimal                Reserve CPUs
      --reserve-memory bytes               Reserve Memory
      --restart-condition string           Restart when condition is met ("none"|"on-failure"|"any")
      --restart-delay duration             Delay between restart attempts (ns|us|ms|s|m|h)
      --restart-max-attempts uint          Maximum number of restarts before giving up
                                            放弃前的最大重启次数

      --restart-window duration            Window used to evaluate the restart policy (ns|us|ms|s|m|h)
      --rollback                           Rollback to previous specification
                                            回滚到之前的规范

      --rollback-delay duration            Delay between task rollbacks (ns|us|ms|s|m|h)
                                            任务回滚之间的延迟（ns | us | ms | s | m | h）

      --rollback-failure-action string     Action on rollback failure ("pause"|"continue")
                                            回滚失败的操作（“暂停”|“继续”）

      --rollback-max-failure-ratio float   Failure rate to tolerate during a rollback
                                            回滚期间容忍的失败率

      --rollback-monitor duration          Duration after each task rollback to monitor for failure (ns|us|ms|s|m|h)
                                            每次任务回滚后监视失败的持续时间（ns | us | ms | s | m | h）

      --rollback-order string              Rollback order ("start-first"|"stop-first")
                                            回滚顺序（“start-first”|“stop-first”）

      --rollback-parallelism uint          Maximum number of tasks rolled back simultaneously (0 to roll back all at once)
                                            同时回滚的最大任务数（0表示一次回滚）

      --secret-add secret                  Add or update a secret on a service
                                            添加或更新服务上的密钥

      --secret-rm list                     Remove a secret
                                            删除一个密钥

      --stop-grace-period duration         Time to wait before force killing a container (ns|us|ms|s|m|h)
                                            在强制杀死容器之前等待的时间（ns | us | ms | s | m | h）

      --stop-signal string                 Signal to stop the container
                                            发出信号停止容器

  -t, --tty                                Allocate a pseudo-TTY
      --update-delay duration              Delay between updates (ns|us|ms|s|m|h)
      --update-failure-action string       Action on update failure ("pause"|"continue"|"rollback")
                                            更新失败的操作（“暂停”|“继续”|“回滚”）

      --update-max-failure-ratio float     Failure rate to tolerate during an update
                                            更新期间容忍的失败率

      --update-monitor duration            Duration after each task update to monitor for failure (ns|us|ms|s|m|h)
                                            每次更新后监控失败的持续时间

      --update-order string                Update order ("start-first"|"stop-first")
      --update-parallelism uint            Maximum number of tasks updated simultaneously (0 to update all at once)
                                            同时更新的最大任务数（0表示一次更新所有任务）

  -u, --user string                        Username or UID (format: <name|uid>[:<group|gid>])
      --with-registry-auth                 Send registry authentication details to swarm agents
                                            将注册表验证详细信息发送给swarm代理

  -w, --workdir string                     Working directory inside the container
                                            定义容器内的workdir
```