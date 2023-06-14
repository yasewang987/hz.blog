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
### 初始化（限制历史任务数量为2，service服务只会保留一个回滚副本和一个正在运行服务）
docker swarm init --advertise-addr 192.168.33.11 --task-history-limit 2
# 退出swarm集群 - 工作节点
docker swarm leave
# 退出swarm集群 - 主节点
docker swarm leave -f
# 限制历史任务数量为2（建议最少是2，不然无法回滚）
docker swarm update --task-history-limit 2


### node
# 查看节点列表（--filter, -f 、--format、--quiet，-q）
# filter: ID、label、membership、name、role
# format:  .ID、.Self、.Hostname、.Status、.Availability、.ManagerStatus、.TLSStatus
docker node ls
docker node ls -f id=1
docker node ls -f "label=foo"
docker node ls -f "membership=accepted"
docker node ls -f name=swarm-manager1
docker node ls -f "role=manager"
# 列出在一个或多个节点上运行的任务（ --filter, -f、 --format、--no-resolve、--no-trunc、 --quiet, -q）
# filter: name、id、label、desired-state
# format:  .Name、.Image、.Node、.DesiredState、 .CurrentState、.Error、 .Ports
docker node ps swarm-manager1
docker node ps -f name=redis swarm-manager1
docker node ps -f id=bg8c07zzg87di2mufeq51a2qp swarm-manager1
docker node ps -f "label=usage"
docker node ps --format "{{.Name}}: {{.Image}}"

# 更新节点（ --availability、 --label-add、--label-rm、 --role）
# --availability: 三种状态
#	  active: 正常
#   pause：挂起
#   drain：排除
# 主节点只做管理节点不跑其他服务(如果允许部署服务，只需要设置为active)
docker node update --availability drain manager
# 工作节点从集群中排除，其上的容器会被转移到其它可运行的节点上
docker node update --availability drain node1
# 向节点添加标签元数据
docker node update --label-add foo --label-add bar worker1

# 查看节点信息
docker node inspect swarm-manager
# 指定输出格式
docker node inspect --pretty self
docker node inspect --format '{{ .ManagerStatus.Leader }}' self
# 管理节点删除指定工作节点（活动节点需要--force）
docker node rm node1
docker node rm --force swarm-node-03
# 将一个或多个节点从群集中的管理器降级
docker node demote NODE [NODE...]

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
      --config config                      Specify configurations to expose to the service （指定配置以暴露给服务）
      --constraint list                    Placement constraints（展示位置限制）
      --container-label list               Container labels（容器标签）
      --credential-spec credential-spec    Credential spec for managed service account (Windows only)（托管服务帐户的凭证规范）
  -d, --detach                             Exit immediately instead of waiting for the service to converge （立即退出而不是等待服务收敛）
      --dns list                           Set custom DNS servers（指定DNS服务器）
      --dns-option list                    Set DNS options（设置DNS选项）
      --dns-search list                    Set custom DNS search domains（设置DNS搜索域）
      --endpoint-mode string               Endpoint mode (vip or dnsrr) (default "vip")（ 端点模式 vip or dnsrr）
      --entrypoint command                 Overwrite the default ENTRYPOINT of the image（覆盖镜像的默认ENTRYPOINT）
  -e, --env list                           Set environment variables（设置环境变量）
      --env-file list                      Read in a file of environment variables（从配置文件读取环境变量）
      --generic-resource list              User defined resources
      --group list                         Set one or more supplementary user groups for the container（为容器设置一个或多个补充用户组）
      --health-cmd string                  Command to run to check health（健康检查命令）
      --health-interval duration           Time between running the check (ms|s|m|h)（健康检查间隔 (ms|s|m|h)）
      --health-retries int                 Consecutive failures needed to report unhealthy（报告不健康需要连续失败次数）
      --health-start-period duration       Start period for the container to initialize before counting retries towards unstable (ms|s|m|h)（在重试计数到不稳定之前，开始容器初始化的时间段(ms|s|m|h)）
      --health-timeout duration            Maximum time to allow one check to run (ms|s|m|h)（允许一次健康检查最长运行时间 (ms|s|m|h)）
      --host list                          Set one or more custom host-to-IP mappings (host:ip)（设置一个或多个自定义主机到IP映射 (host:ip)
）              
      --hostname string                    Container hostname（容器名称）
      --init                               Use an init inside each service container to forward signals and reap processes（在每个服务容器中使用init来转发信号并收集进程）
      --isolation string                   Service container isolation mode（服务容器隔离模式）
  -l, --label list                         Service labels（服务标签）
      --limit-cpu decimal                  Limit CPUs（CPU限制）
      --limit-memory bytes                 Limit Memory（内存限制）
      --log-driver string                  Logging driver for service（记录驱动程序的服务）
      --log-opt list                       Logging driver options（记录驱动程序选项）
      --mode string                        Service mode (replicated or global) (default "replicated") （服务模式（复制或全局））
      --mount mount                        Attach a filesystem mount to the service（将文件系统挂载附加到服务）
      --name string                        Service name（服务名称）
      --network network                    Network attachments（网络）
      --no-healthcheck                     Disable any container-specified HEALTHCHECK（禁用任何容器指定的HEALTHCHECK）
      --no-resolve-image                   Do not query the registry to resolve image digest and supported platforms（不要查询注册表来解析图像摘要和支持的平台）
      --placement-pref pref                Add a placement preference（添加展示位置首选项）
  -p, --publish port                       Publish a port as a node port（将端口发布为节点端口）
  -q, --quiet                              Suppress progress output（抑制进度输出）
      --read-only                          Mount the containers root filesystem as read only（将容器的根文件系统挂载为只读）
      --replicas uint                      Number of tasks（同时运行的副本数）
      --reserve-cpu decimal                Reserve CPUs（为本服务需要预留的CPU资源）
      --reserve-memory bytes               Reserve Memory（为本服务需要预留的内存资源）
      --restart-condition string           Restart when condition is met ("none"|"on-failure"|"any") (default "any")（满足条件时重新启动("none"|"on-failure"|"any") (default "any")）
      --restart-delay duration             Delay between restart attempts (ns|us|ms|s|m|h) (default 5s)（重启尝试之间的延迟 (ns|us|ms|s|m|h) (default 5s)）
      --restart-max-attempts uint          Maximum number of restarts before giving up（放弃前的最大重启次数）
      --restart-window duration            Window used to evaluate the restart policy (ns|us|ms|s|m|h)（用于评估重新启动策略的窗口（ns | us | ms | s | m | h））
      --rollback-delay duration            Delay between task rollbacks (ns|us|ms|s|m|h) (default 0s)（任务回滚之间的延迟(ns|us|ms|s|m|h) (default 0s)）
      --rollback-failure-action string     Action on rollback failure ("pause"|"continue") (default "pause")（回滚失败的操作("pause"|"continue") (default "pause")）
      --rollback-max-failure-ratio float   Failure rate to tolerate during a rollback (default 0)（回滚期间容忍的失败率(default 0)）
      --rollback-monitor duration          Duration after each task rollback to monitor for failure (ns|us|ms|s|m|h) (default 5s)（每次任务回滚后监视失败的持续时间 (ns|us|ms|s|m|h) (default 5s)）
      --rollback-order string              Rollback order ("start-first"|"stop-first") (default "stop-first")（回滚顺序("start-first"|"stop-first") (default "stop-first")）
      --rollback-parallelism uint          Maximum number of tasks rolled back simultaneously (0 to roll back all at once) (default 1)（同时回滚的最大任务数（0表示一次回滚）（默认值为1））
      --secret secret                      Specify secrets to expose to the service（指定要公开给服务的秘钥）
      --stop-grace-period duration         Time to wait before force killing a container (ns|us|ms|s|m|h) (default 10s)（在强行杀死容器之前等待的时间(ns|us|ms|s|m|h) (default 10s)）
      --stop-signal string                 Signal to stop the container（发出信号停止容器）
  -t, --tty                                Allocate a pseudo-TTY（分配伪终端）
      --update-delay duration              Delay between updates (ns|us|ms|s|m|h) (default 0s)（更新之间的延迟(ns|us|ms|s|m|h) (default 0s)）
      --update-failure-action string       Action on update failure ("pause"|"continue"|"rollback") (default "pause")（更新失败后选项("pause"|"continue"|"rollback") (default "pause")）
      --update-max-failure-ratio float     Failure rate to tolerate during an update (default 0)（更新期间容忍的故障率（默认为0））
      --update-monitor duration            Duration after each task update to monitor for failure (ns|us|ms|s|m|h) (default 5s)（每次更新任务后监视失败的持续时间（ns | us | ms | s | m | h）（默认为5s））
      --update-order string                Update order ("start-first"|"stop-first") (default "stop-first")（更新选项 ("start-first"|"stop-first") (default "stop-first")）
      --update-parallelism uint            Maximum number of tasks updated simultaneously (0 to update all at once) (default 1)（同时更新的最大任务数（0表示一次更新所有任务）（默认值为1））
  -u, --user string                        Username or UID (format: <name|uid>[:<group|gid>])
      --with-registry-auth                 Send registry authentication details to swarm agents（将注册表验证详细信息发送给swarm代理）
  -w, --workdir string                     Working directory inside the container（指定容器内工作目录(workdir)）

# 建一个包含5个副本任务的服务
docker service create --name redis --replicas=5 redis:3.0.6
# 创建一个包含秘密的服务
docker service create --name redis --secret secret.json redis:3.0.6
docker service create --name redis \
  --secret source=ssh-key,target=ssh \
  --secret source=app-key,target=app,uid=1000,gid=1001,mode=0400 \
  redis:3.0.6
# 使用滚动更新策略创建服务
docker service create \
  --replicas 10 \
  --name redis \
  --update-delay 10s \
  --update-parallelism 2 \
  redis:3.0.6
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
# 设置环境变量
docker service create \
  --name redis_2 \
  --replicas 5 \
  --env MYVAR=foo \
  --env MYVAR2=bar \
  redis:3.0.6
# 使用特定主机名（-hostname）创建服务
docker service create --name redis --hostname myredis redis:3.0.6
# 在服务上设置元数据（-l，-label）
docker service create \
  --name redis_2 \
  --label com.example.foo="bar"
  --label bar=baz \
  redis:3.0.6
# 添加绑定挂载或 volume
docker service create \
  --name my-service \
  --replicas 3 \
  --mount type=volume,source=my-volume,destination=/path/in/container,volume-label="color=red",volume-label="shape=round" \
  nginx:alpine
# 创建使用匿名卷的服务
docker service create \
  --name my-service \
  --replicas 3 \
  --mount type=volume,destination=/path/in/container \
  nginx:alpine
# 创建使用绑定挂载主机目录的服务
docker service create \
  --name my-service \
  --mount type=bind,source=/path/on/host,destination=/path/in/container \
  nginx:alpine
# 设置服务模式（ - 模式）
docker service create \
 --name redis_2 \
 --mode global \
 redis:3.0.6
# 指定服务约束（-constraint）
docker service create \
  --name redis_2 \
  --constraint 'node.labels.type == queue' \
  redis:3.0.6
# 指定服务布局偏好（-placement-pref）
docker service create \
  --replicas 9 \
  --name redis_2 \
  --placement-pref 'spread=node.labels.datacenter' \
  --placement-pref 'spread=node.labels.rack' \
  redis:3.0.6
# 将服务附加到现有网络（ - 网络）
docker network create -d overlay niginx_network
# 服务使用指定网络
docker service create --replicas 1 --network niginx_network --name my_nginx -p 80:80 nginx:latest
# 在群外发布服务端口（-p，-publish）
docker service create --name my_web --replicas 3 --publish 8080:80 nginx
# tcp+udp
docker service create --name dns-cache -p 53:53/tcp -p 53:53/udp dns-cache
# 使用模板创建服务(.Service.ID .Service.Name .Service.Labels .Node.ID .Task.ID .Task.Name .Task.Slot)
docker service create --name hosttempl \
  --hostname="{{.Node.ID}}-{{.Service.Name}}"\
  busybox top
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
# 格式化输出
docker service inspect --pretty frontend
# 查看副本数
docker service inspect --format='{{.Spec.Mode.Replicated.Replicas}}' redis
```

### `logs`:

```bash
[root@centos181001 nginx]# docker service logs --help

Usage:  docker service logs [OPTIONS] SERVICE|TASK

Fetch the logs of a service or task

Options:
      --details        Show extra details provided to logs
  -f, --follow         Follow log output(持续输出日志，相当于``tail -f``)
      --no-resolve     Do not map IDs to Names in output(不要将容器名称输出到日志，而使用CONTAINER ID)
      --no-task-ids    Do not include task IDs in output(不要将task ID输出到日志)
      --no-trunc       Do not truncate output(不要截断输出)
      --raw            Do not neatly format logs(不要整齐地格式化日志（会将前边的容器ID信息等去掉，只保留原始日志内容）)
      --since string   Show logs since timestamp (e.g. 2013-01-02T13:23:37) or relative (e.g. 42m for 42 minutes)(显示自时间戳（例如2013-01-02T13：23：37）或相对（例如42分钟42分钟）以来的日志)
      --tail string    Number of lines to show from the end of the logs (default "all")(从日志末尾显示的行数（默认为“全部”）)
  -t, --timestamps     Show timestamps(显示时间戳)

### 查看服务日志(raw参数格式化日志)
docker service logs -f --tail=200 --raw my-web
```

### `ls`选项 - 列出服务

```bash
[root@centos181001 nginx]# docker service ls --help

Usage:  docker service ls [OPTIONS]

List services

Aliases:
  ls, list

Options:
  -f, --filter filter   Filter output based on conditions provided(根据提供的条件过滤输出)
      --format string   Pretty-print services using a Go template(使用Go模板的漂亮打印服务)
  -q, --quiet           Only display IDs(只显示服务ID)

### 查看集群服务列表
docker service ls
# 过滤-ID
docker service ls -f "id=0bcjw"
# 过滤-标签（无值）
docker service ls --filter label=project
# 过滤-标签（有值）
docker service ls --filter label=project=project-a
# 过滤-模式
docker service ls --filter mode=global
# 过滤-名称（fc-开头）
docker service ls --filter name=fc-
# 格式化( .ID .Name  .Mode .Replicas  .Image  .Ports)
docker service ls --format "{{.ID}}: {{.Mode}} {{.Replicas}}"
```

### `ps`选项 - 列出一个或多个服务`tasks`

```bash
[root@centos181001 nginx]# docker service ps --help

Usage:  docker service ps [OPTIONS] SERVICE [SERVICE...]

List the tasks of one or more services

Options:
  -f, --filter filter   Filter output based on conditions provided(根据提供的条件过滤输出)
      --format string   Pretty-print tasks using a Go template(使用Go模板的漂亮打印任务)
      --no-resolve      Do not map IDs to Names(服务名和node名称不要显示名字，而显示ID)
      --no-trunc        Do not truncate output(不要截断输出)
  -q, --quiet           Only display task IDs(只输出task ID)
### 查看服务异常退出详细信息
docker service ps --no-trunc my-web
### 查看服务状态信息
docker service ps my-web
# 过滤-ID
docker service ps -f "id=8" redis
# 过滤-名称
docker service ps -f "name=redis.1" redis
# 过滤-节点
docker service ps -f "node=manager1" redis
## 格式化( .ID .Name  .Mode .Replicas  .Image  .Ports)
docker service ps --format "{{.Name}}: {{.Image}}" top
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

### 服务扩容/缩容 (上面运行的nginx服务变成了2个)
docker service scale my-web=2
# 也可以用update命令代替
docker service update --replicas 2 my-web
```

### `update`选项 - 更新一个服务

```bash
[root@centos181001 nginx]# docker service update --help

Usage:  docker service update [OPTIONS] SERVICE

Update a service

Options:
      --args command                       Service command args(服务命令参数)
      --config-add config                  Add or update a config file on a service(添加或更新服务上的配置文件)
      --config-rm list                     Remove a configuration file(删除配置文件)
      --constraint-add list                Add or update a placement constraint(添加或更新展示位置约束)
      --constraint-rm list                 Remove a constraint(删除约束)
      --container-label-add list           Add or update a container label(添加或更新容器标签)
      --container-label-rm list            Remove a container label by its key(删除容器标签)
      --credential-spec credential-spec    Credential spec for managed service account (Windows only)
  -d, --detach                             Exit immediately instead of waiting for the service to converge（立即退出而不是等待服务收敛）
      --dns-add list                       Add or update a custom DNS server（添加或更新自定义DNS）
      --dns-option-add list                Add or update a DNS option（添加或更新DNS选项）
      --dns-option-rm list                 Remove a DNS option（删除一个DNS选项）
      --dns-rm list                        Remove a custom DNS server（删除自定义DNS服务器）
      --dns-search-add list                Add or update a custom DNS search domain（添加或更新自定义DNS搜索域）
      --dns-search-rm list                 Remove a DNS search domain（删除一个自定义DNS搜索域）
      --endpoint-mode string               Endpoint mode (vip or dnsrr)端点模式（vip或dnsrr）
      --entrypoint command                 Overwrite the default ENTRYPOINT of the image 覆盖图像的默认ENTRYPOINT
      --env-add list                       Add or update an environment variable  添加或更新环境变量
      --env-rm list                        Remove an environment variable 删除一个环境变量
      --force                              Force update even if no changes require it 即使没有更改需要，也强制更新
      --generic-resource-add list          Add a Generic resource  添加通用资源
      --generic-resource-rm list           Remove a Generic resource 删除通用资源
      --group-add list                     Add an additional supplementary user group to the container 向容器添加一个用户组
      --group-rm list                      Remove a previously added supplementary user group from the container 从容器中删除以前添加的补充用户组
      --health-cmd string                  Command to run to check health  运行以检查运行状况的命令
      --health-interval duration           Time between running the check (ms|s|m|h)  运行检查之间的时间（ms | s | m | h）
      --health-retries int                 Consecutive failures needed to report unhealthy  报告不健康需要连续失败次数
      --health-start-period duration       Start period for the container to initialize before counting retries towards unstable (ms|s|m|h)
      --health-timeout duration            Maximum time to allow one check to run (ms|s|m|h) 允许一次检查运行的最长时间（ms | s | m | h）
      --host-add list                      Add a custom host-to-IP mapping (host:ip) 添加或更新自定义主机到IP映射（主机：IP）
      --host-rm list                       Remove a custom host-to-IP mapping (host:ip) 删除自定义的主机到IP映射（主机：IP）
      --hostname string                    Container hostname 容器主机名
      --image string                       Service image tag 定义服务image和标签
      --init                               Use an init inside each service container to forward signals and reap processes 在每个服务容器中使用init来转发信号并收集进程
      --isolation string                   Service container isolation mode 服务容器隔离模式
      --label-add list                     Add or update a service label 添加或更新service标签
      --label-rm list                      Remove a label by its key 删除service标签
      --limit-cpu decimal                  Limit CPUs  CPU限制
      --limit-memory bytes                 Limit Memory  内存限制
      --log-driver string                  Logging driver for service 记录驱动程序的服务
      --log-opt list                       Logging driver options 记录驱动程序选项
      --mount-add mount                    Add or update a mount on a service 添加或更新服务上的挂载
      --mount-rm list                      Remove a mount by its target path 删除挂载
      --network-add network                Add a network 添加一个网络
      --network-rm list                    Remove a network 删除网络
      --no-healthcheck                     Disable any container-specified HEALTHCHECK 禁用任何容器指定的HEALTHCHECK
      --no-resolve-image                   Do not query the registry to resolve image digest and supported platforms 不要查询注册表来解析图像摘要和支持的平台
      --placement-pref-add pref            Add a placement preference 添加展示位置首选项
      --placement-pref-rm pref             Remove a placement preference 删除展示位置偏好设置
      --publish-add port                   Add or update a published port 添加或更新已发布的端口
      --publish-rm port                    Remove a published port by its target port 通过目标端口删除发布的端口
  -q, --quiet                              Suppress progress output 简化输出
      --read-only                          Mount the containers root filesystem as read only 将容器的根文件系统挂载为只读
      --replicas uint                      Number of tasks 任务副本数量
      --reserve-cpu decimal                Reserve CPUs 预留CPU
      --reserve-memory bytes               Reserve Memory 保留内存
      --restart-condition string           Restart when condition is met ("none"|"on-failure"|"any") 条件满足时重新启动（“none”|“on-failure”|“any”）
      --restart-delay duration             Delay between restart attempts (ns|us|ms|s|m|h) 重启尝试之间的延迟（ns | us | ms | s | m | h）
      --restart-max-attempts uint          Maximum number of restarts before giving up 放弃前的最大重启次数
      --restart-window duration            Window used to evaluate the restart policy (ns|us|ms|s|m|h) 用于评估重新启动策略的窗口（ns | us | ms | s | m | h）
      --rollback                           Rollback to previous specification 回滚到之前的规范
      --rollback-delay duration            Delay between task rollbacks (ns|us|ms|s|m|h) 任务回滚之间的延迟（ns | us | ms | s | m | h）
      --rollback-failure-action string     Action on rollback failure ("pause"|"continue") 回滚失败的操作（“暂停”|“继续”）
      --rollback-max-failure-ratio float   Failure rate to tolerate during a rollback 回滚期间容忍的失败率
      --rollback-monitor duration          Duration after each task rollback to monitor for failure (ns|us|ms|s|m|h) 每次任务回滚后监视失败的持续时间（ns | us | ms | s | m | h）
      --rollback-order string              Rollback order ("start-first"|"stop-first") 回滚顺序（“start-first”|“stop-first”）
      --rollback-parallelism uint          Maximum number of tasks rolled back simultaneously (0 to roll back all at once) 同时回滚的最大任务数（0表示一次回滚）
      --secret-add secret                  Add or update a secret on a service 添加或更新服务上的密钥
      --secret-rm list                     Remove a secret 删除一个密钥
      --stop-grace-period duration         Time to wait before force killing a container (ns|us|ms|s|m|h) 在强制杀死容器之前等待的时间（ns | us | ms | s | m | h）
      --stop-signal string                 Signal to stop the container 发出信号停止容器
  -t, --tty                                Allocate a pseudo-TTY 分配一个伪TTY
      --update-delay duration              Delay between updates (ns|us|ms|s|m|h) 更新之间的延迟（ns | us | ms | s | m | h）
      --update-failure-action string       Action on update failure ("pause"|"continue"|"rollback") 更新失败的操作（“暂停”|“继续”|“回滚”）
      --update-max-failure-ratio float     Failure rate to tolerate during an update 更新期间容忍的失败率
      --update-monitor duration            Duration after each task update to monitor for failure (ns|us|ms|s|m|h) 每次更新后监控失败的持续时间
      --update-order string                Update order ("start-first"|"stop-first") 更新顺序（“start-first”|“stop-first”）
      --update-parallelism uint            Maximum number of tasks updated simultaneously (0 to update all at once)  同时更新的最大任务数（0表示一次更新所有任务）
  -u, --user string                        Username or UID (format: <name|uid>[:<group|gid>]) 用户名或UID（格式：<名称| uid>：<组| gid>）
      --with-registry-auth                 Send registry authentication details to swarm agents 将注册表验证详细信息发送给swarm代理
  -w, --workdir string                     Working directory inside the container  定义容器内的workdir

# 如果执行后查看状态不是设置的，可以在update一下，将服务状态设置为自己想要的
docker service update --rollback-monitor 20s  my-web
docker service update --rollback-max-failure-ratio 0.2 my-web

# 执行滚动重新启动，不更改参数（--update-parallelism 1设置确保一次只替换一个任务，--update-delay 30s设置在任务之间引入了30秒的延迟）
docker service update --force --update-parallelism 1 --update-delay 30s redis

# 添加或移除挂载
docker service create \
  --name=myservice \
  --mount \
    type=volume,source=test-data,target=/somewhere \
  nginx:alpine \
  myservice
docker service update \
  --mount-add \
    type=volume,source=other-volume,target=/somewhere-else \
  myservice
docker service update --mount-rm /somewhere myservice

### 服务回滚
# 服务也可以设置为在更新失败时自动回滚到以前的版本
# 要设置自动回滚服务，请使用--update-failure-action=rollback
# 如果成功更新失败的部分任务超过了给定的值，将会触发回滚--update-max-failure-ratio
### 也可以使用update滚动更新镜像版本
docker service update --image nginx:1.13 my-web
# 刚才nginx版本已经是1.13了，现在将其还原到1.12.1　
docker service update --rollback my-web
```

## 常见问题记录

### nginx缓存问题

swarm中如果在`nginx`中配置服务名，会有`DNS缓存`问题

解决方案：参考`nginx`问题处理文档中的`缓存`相关处理，通过`变量+rewrite`方式处理。

### 日志无法使用grep过滤

```bash
# 2>&1 把stderr重定向到stdout中
docker service logs --raw --tail 500 nginx 2>&1 | grep 500
```

