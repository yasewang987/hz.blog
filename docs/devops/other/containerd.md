# Containerd

`containerd` 采用的也是 C/S 架构，服务端通过 `unix domain socket` 暴露低层的 `gRPC API` 接口出去，客户端通过这些 API 管理节点上的容器，每个 `containerd` 只负责一台机器，Pull 镜像，对容器的操作（启动、停止等），网络，存储都是由 containerd 完成。

真正启动容器是通过 `containerd-shim` 去调用 `runc` 来启动容器的，`runc` 启动完容器后本身会直接退出，`containerd-shim` 则会成为容器进程的父进程, 负责收集容器进程的状态, 上报给 `containerd`, 并在容器中 `pid 为 1` 的进程退出后接管容器中的子进程进行清理, 确保不会出现僵尸进程。

## containerd部署

到github-release页面选择合适的版本下载：https://github.com/containerd/containerd/releases

```bash
# 推荐选择cri-containerd-cni-xxx的完整版本
wget https://github.com/containerd/containerd/releases/download/v1.7.20/cri-containerd-cni-1.7.20-linux-amd64.tar.gz

# 查看压缩包里包含的文件
tar -tf cri-containerd-cni-1.7.20-linux-amd64.tar.gz

# 解压到系统级目录（推荐）
tar zxvf cri-containerd-cni-1.7.20-linux-amd64.tar.gz -C /

# 如果/usr/local/bin等目录不在PATH变量里，需要加一下
vim ~/.bashrc
export PATH=$PATH:/usr/local/bin:/usr/local/sbin
source ~/.bashrc

### 生成默认配置文件(主要关注registry.mirrors配置镜像仓库)
# root配置是用来保存持久化数据，包括 Snapshots, Content, Metadata 以及各种插件的数据，每一个插件都有自己单独的目录，Containerd 本身不存储任何数据，它的所有功能都来自于已加载的插件
# state 是用来保存运行时的临时数据的，包括 sockets、pid、挂载点、运行时状态以及不需要持久化的插件数据
mkdir /etc/containerd
containerd config default > /etc/containerd/config.toml
# 修改镜像源
vim /etc/containerd/config.toml
   [plugins."io.containerd.grpc.v1.cri".registry.mirrors]
        [plugins."io.containerd.grpc.v1.cri".registry.mirrors."docker.io"]
          endpoint = ["https://dxc7f1d6.mirror.aliyuncs.com"]

# 启动containerd
systemctl enable containerd --now

# 查看版本
ctr version
```

## ctr常用命令

```bash
#### 运行容器
ctr run --net-host  --mount type=bind,src=/opt/deploy/crm,dst=/data,options=rbind:rw  --mount type=bind,src=/opt/deploy/crm/logs,dst=/tmp/logs,options=rbind:rw  -d docker.io/java:v1 crm bash crm_start.sh

#### 运行常见容器2
# --detach: 以后台模式运行容器。
# --mount type=bind,src=/path/to/host/directory,dst=/path/in/container,readonly: 将主机目录 /path/to/host/directory 绑定挂载到容器内的 /path/in/container，并且设置为只读模式。readonly 参数去掉即可即为可读写
# --publish 8080:80: 将容器内的 80 端口映射到主机的 8080 端口。
# --env MY_ENV_VARIABLE=value: 设置环境变量 MY_ENV_VARIABLE 的值为 value。
# --cpus 0.5: 设置容器可以使用的 CPU 核心数，这里设置为 0.5 个核心。
# --memory-limit 512M: 设置容器的最大可用内存为 512MB。
# --gpus 0: 向容器添加 GPU，这里的 0 表示第 0 号 GPU。
ctr -n=k8s.io run \
    --detach \
    --mount type=bind,src=/path/to/host/directory,dst=/path/in/container,readonly \
    --publish 8080:80 \
    --env MY_ENV_VARIABLE=value \
    --env ANOTHER_VARIABLE=another_value \
    --cpus 0.5 \
    --memory-limit 512M \
    --gpus 0 \
    <image-name> \
    <command-to-run-inside-container>

#### plugin
# 查看所有镜像
ctr plugin ls
#### namespace
# create, c : 创建
# list, ls：查看列表
# remove, rm ：删除
# 查看所有命名空间
ctr ns ls
# 创建命名空间
ctr ns create test
# 删除命名空间
ctr ns rm test
# 

#### images
# export 导出
# import 导入
# list, ls 查看
# pull 拉取镜像
# push 推送镜像
# prune 清理无用镜像
# delete, del, remove, rm 删除镜像
# tag 镜像打标签
# usage 镜像依赖关系查看

# 查看所有镜像
ctr images ls
# 查看指定命名空间下的镜像
ctr -n moby images list
# 拉取镜像（--platform 选项指定对应平台的镜像）
ctr image pull docker.io/library/nginx:alpine
# 推送镜像（--user 自定义仓库的用户名和密码）
ctr image push xxx
# 检查镜像（主要看STATUS=complete表示可用）
ctr image check xxx
# 打标签
ctr image tag docker.io/library/nginx:alpine harbor.k8s.local/course/nginx:alpine
# 删除镜像（--sync 选项可以同步删除镜像和所有相关的资源）
ctr image rm harbor.k8s.local/course/nginx:alpine
# 将镜像挂载到主机目录
ctr image mount docker.io/library/nginx:alpine /mnt
# 将镜像从主机目录上卸载
ctr image unmount /mnt
# 将镜像导出为压缩包
ctr image export nginx.tar.gz docker.io/library/nginx:alpine
# 从压缩包导入镜像
ctr image import nginx.tar.gz

#### containers
# create: 创建一个新的容器。（通过 container create 命令创建的容器，并没有处于运行状态，只是一个静态的容器。一个 container 对象只是包含了运行一个容器所需的资源及相关配置数据，表示 namespaces、rootfs 和容器的配置都已经初始化成功了，只是用户进程还没有启动。）
# start: 启动容器。
# stop: 停止容器。
# delete: 删除容器。
# ls: 列出容器。
# info: 查看容器信息
# logs: 查看容器的日志（如果 containerd 版本支持此命令）。

# 创建容器
ctr container create docker.io/library/nginx:alpine nginx
# 删除容器
ctr container rm nginx
# 查看所有容器（-q 选项精简列表内容）
ctr c ls
# 查看日志
ctr c logs containername
# 删除容器
ctr c delete containername
# 查看磁盘映射目录
ctr c info containername | grep source

#### tasks
# start：启动容器（一个容器真正运行起来是由 Task 任务实现的，Task 可以为容器设置网卡，还可以配置工具来对容器进行监控等）
# kill: 终止任务。
# attach: 附加到任务。
# exec：进入容器
# resume: 恢复任务。
# pause: 暂停任务。
# wait: 等待任务结束。
# ls: 列出任务。
# inspect: 查看任务的详细信息
# 启动容器
ctr task start -d nginx
# 查看所有任务(包含pid)
ctr t ls
# 查看任务所有进程（第一个就是1号进程）
ctr t ps taskame
# 关闭进程状态为STOPPED（如果关闭不了直接用 kill -9 pid）
ctr t kill nginx
# 进入容器进行操作（--exec-id 参数，这个 id 可以随便写，只要唯一就行）
ctr task exec --exec-id 0 -t nginx sh
# 暂停容器（状态变为PAUSED）
ctr task pause nginx
# 恢复容器（状态变为RUNNING）
ctr task resume nginx
# 获取容器的 cgroup 相关信息（内存、CPU 和 PID 的限额与使用量）
ctr task metrics nginx 
```

## nerdctl常用命令