# Docker问题处理

## docker登陆、拉取私有镜像报错

问题：Error response from daemon: Get https://ip:port/v2/: http: server gave HTTP response to HTTPS client

解决：在`/etc/docker/daemon.json`中增加一行

```json
{
    "insecure-registries":["ip:port"]
}
```

## docker时区问题

```bash
docker run -d -v /etc/localtime:/etc/localtime --name hello helloworld

RUN apk add tzdata \
    && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/localtimezone \
    && apk del tzdata
```

## docker中文乱码问题

```bash
# 查看所有编码
locale -a

# 查看当前所使用的编码
locale

# 这里设置哪种编码需要根据容器环境确定 -e LANG="C.UTF-8" -e LC_ALL="C.UTF-8" 选一个
docker run -d -e LANG="C.UTF-8" --name hello helloworld

ENV LANG=C.UTF-8
```

## 二进制安装docker，systemd无法管理docker服务问题

到 `/etc/systemd/system` 目录下新增2个文件

链接：https://github.com/moby/moby/tree/master/contrib/init/systemd

1. docker.socket

```ini
[Unit]
Description=Docker Socket for the API

[Socket]
# If /var/run is not implemented as a symlink to /run, you may need to
# specify ListenStream=/var/run/docker.sock instead.
ListenStream=/run/docker.sock
SocketMode=0660
SocketUser=root
SocketGroup=docker

[Install]
WantedBy=sockets.target
```

1. docker.service

```ini
[Unit]
Description=Docker Application Container Engine
Documentation=https://docs.docker.com
After=network-online.target firewalld.service
Wants=network-online.target

[Service]
Type=notify
# the default is not to use systemd for cgroups because the delegate issues still
# exists and systemd currently does not support the cgroup feature set required
# for containers run by docker
ExecStart=/usr/bin/dockerd
ExecReload=/bin/kill -s HUP $MAINPID
# Having non-zero Limit*s causes performance problems due to accounting overhead
# in the kernel. We recommend using cgroups to do container-local accounting.
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
# Uncomment TasksMax if your systemd version supports it.
# Only systemd 226 and above support this version.
#TasksMax=infinity
TimeoutStartSec=0
# set delegate yes so that systemd does not reset the cgroups of docker containers
Delegate=yes
# kill only the docker process, not all processes in the cgroup
KillMode=process
# restart the docker process if it exits prematurely
Restart=on-failure
StartLimitBurst=3
StartLimitInterval=60s

[Install]
WantedBy=multi-user.target
```

1. 重启机器

```bash
systemctl enable docker

reboot
```

## arm64服务器服务时报错 “Illegal instruction(core dumped)”

需要在环境变量中增加 `OPENBLAS_CORETYPE=ARMV8`

* 方式一： `docker run -e OPENBLAS_CORETYPE=ARMV8 xxxx`
* 方式二： 在 `dockerfile` 中增加 `ENV OPENBLAS_CORETYPE=ARMV8`
* 方式三： 到容器中修改环境变量 `export OPENBLAS_CORETYPE=ARMV8`

## docker endpoint with name zookeeper already exists in network bridge

```bash
sudo docker  rm -f 容器名
# 清理此容器的网络占用
docker network disconnect --force bridge 容器名
```

## No Route to Host

一半都是防火墙问题，需要修改防火墙规则

## systemctl无法停止docker

`Warning: Stopping docker.service, but it can still be activated by: docker.socket`

```bash
sudo systemctl stop docker.socket
```

## iptables failed: iptables --wait -t nat

直接重启docker服务：

```bash
systmctl restart docker
```

## IPv4 forwarding is disabled

`WARNING: IPv4 forwarding is disabled. Networking will not work.`

问题原因：是没有开启转发,docker网桥配置完后，需要开启转发，不然容器启动后，就会没有网络，配置`/etc/sysctl.conf`,添加`net.ipv4.ip_forward=1`.

```bash
# vim /etc/sysctl.conf 或者 /usr/lib/sysctl.d/00-system.conf

#添加此行配置
net.ipv4.ip_forward=1

# 重启网络并重启docker服务
systemctl restart network && systemctl restart docker

# 查看是否修改成功
sysctl net.ipv4.ip_forward
```

## OCI runtime create failed container init caused “write /proc/self/attr/keycreate: permission denied““: unknown

需要关闭 `SELINUX`,修改文件 `/etc/selinux/config`

* 强制模式`SELINUX=enforcing`：表示所有违反安全策略的行为都将被禁止。
* 宽容模式`SELINUX=permissive`：表示所有违反安全策略的行为不被禁止，但是会在日志中作记录。
* 关闭 `SELINUX=disabled`: 表示关闭

```text
SELINUX=disabled
```

然后重启服务器,即可。

```bash
# 获取selinux状态
getenforce
# 临时关闭selinux
setenforce 0
```

## Docker运行shell脚本之后直接就退出

这个是因为docker运行的时候pid是1的进程是调用shell脚本的，在脚本执行完毕之后终端会自动退出。

所以只需要想办法让脚本在执行完之后不要退出就可以了。

```sh
echo "123"
# 使用tail让shell脚本无法结束
tail -f /dev/null
```

## Failed to start Docker Application Container Engine

使用 `systemctl` 启动 `docker` 服务时无法启动，报这个错误。

定位这种问题需要直接使用 `dockerd` 命令确认具体问题之后再进行处理。

```bash
dockerd
# 信息如下，则删除 /var/lib/docker 之后再启动即可
mkdir /var/lib/docker: file exists
```

## port is already allocated

```bash
docker network prune
# 先直接执行重启docker服务试试，不行就先执行上面，再执行重启
systemctl restart docker
```

## Docker 缺共享链接库

问题：
```bash
$ docker-compose --version
error while loading shared libraries: libz.so.1: failed to map segment from shared object: Operation not permitted
```

解决方案：是因为系统中 docker 没有对 /tmp 目录的访问权限导致，需要重新将其挂载一次，就可以解决了。

```bash
# 重新挂载
$ sudo mount /tmp -o remount,exec
```

## Docker 容器文件损坏

问题：主要的原因是因为重新对 docker 的默认容器进行了重新的分配限制导致的。

```bash
# 操作容器遇到类似的错误
'devicemapper: Error running deviceCreate (CreateSnapDeviceRaw) dm_task_run failed'
```

解决方案：通过以下操作将容器删除/重建。

```bash
# 1.关闭docker
$ sudo systemctl stop docker

# 2.删除容器文件
$ sudo rm -rf /var/lib/docker/containers

# 3.重新整理容器元数据
$ sudo thin_check /var/lib/docker/devicemapper/devicemapper/metadata
$ sudo thin_check --clear-needs-check-flag /var/lib/docker/devicemapper/devicemapper/metadata

# 4.重启docker
$ sudo systemctl start docker
```

## Docker 容器无法删除

问题：docker 容器无法停止/终止/删除，可能原因是容器启动之后，主机因任何原因重新启动并且没有优雅地终止容器。剩下的文件现在阻止你重新生成旧名称的新容器，因为系统认为旧容器仍然存在。

```bash
# 删除容器
$ sudo docker rm -f f8e8c3..
Error response from daemon: Conflict, cannot remove the default name of the container
```

解决方案：找到 `/var/lib/docker/containers/` 下的对应容器的文件夹，将其删除，然后重启一下 dockerd 即可。我们会发现，之前无法删除的容器没有了。

```bash
# 删除容器文件
$ sudo rm -rf /var/lib/docker/containers/f8e8c3...65720

# 重启服务
$ sudo systemctl restart docker.service
```

## Docker NFS 挂载报错

```bash
# 报错信息
Traceback (most recent call last):
    ......
    File "xxx/utils/storage.py", line 34, in xxx.utils.storage.LocalStorage.read_file
OSError: [Errno 9] Bad file descriptor
```

实际上是由 RedHat 內核中的一个错误引起的，并在 kernel-3.10.0-693.18.1.el7 版本中得到修复。所以对于 NFSv3 和 NFSv4 服务而已，就需要升级 Linux 内核版本才能够解决这个问题。

```bash
# https://t.codebug.vip/questions-930901.htm
$ In Linux kernels up to 2.6.11, flock() does not lock files over NFS (i.e.,
the scope of locks was limited to the local system). [...] Since Linux 2.6.12,
NFS clients support flock() locks by emulating them as byte-range locks on the entire file.
```

## Bus error (core dumped)

原因是在 docker 运行的时候，`shm` 分区设置太小导致 `share memory` 不够。不设置 `--shm-size` 参数时，docker 给容器默认分配的 `shm` 大小为 `64M`，导致程序启动时不足。具体原因还是因为安装 `pytorch` 包导致了，多进程跑任务的时候，docker 容器分配的共享内存太小，导致 `torch` 要在 `tmpfs` 上面放模型数据用于子线程的 共享不足，就出现报错了。

```bash
# 问题原因
root@18...35:/opt/app# df -TH
Filesystem     Type     Size  Used Avail Use% Mounted on
overlay        overlay  2.0T  221G  1.4T   3% /
tmpfs          tmpfs     68M     0   68M   0% /dev
shm            tmpfs     68M   41k   68M   1% /dev/shm

# 启动docker的时候加上--shm-size参数(单位为b,k,m或g)
$ docker run -it --rm --shm-size=200m pytorch/pytorch:latest

# 在docker-compose添加对应配置
$ shm_size: '2gb'
```

还有一种情况就是容器内的磁盘空间不足，也会导致 `bus error` 这样的报错，所以如果出现了，清除多余文件和目录或者分配一个大的磁盘空间，就可以解决了。

```bash
# 磁盘空间不足
$ df -Th
Filesystem     Type     Size  Used Avail Use% Mounted on
overlay        overlay    1T    1T    0G 100% /
shm            tmpfs     64M   24K   64M   1% /dev/shm
```

## Docker 删除镜像报错

清理服器磁盘空间的时候，删除某个镜像的时候提示如下信息。提示需要强制删除，但是发现及时执行了强制删除依旧没有效果。

```bash
# 删除镜像
$ docker rmi 3ccxxxx2e862
Error response from daemon: conflict: unable to delete 3ccxxxx2e862 (cannot be forced) - image has dependent child images

# 强制删除
$ dcoker rmi -f 3ccxxxx2e862
Error response from daemon: conflict: unable to delete 3ccxxxx2e862 (cannot be forced) - image has dependent child images
```

出现这个原因主要是因为 TAG，即存在其他镜像引用了这个镜像。这里我们可以使用如下命令查看对应镜像文件的依赖关系，然后根据对应 TAG 来删除镜像。

```bash
# 查询依赖 - image_id表示镜像名称
$ docker image inspect --format='{{.RepoTags}} {{.Id}} {{.Parent}}' $(docker image ls -q --filter since=<image_id>)
# 根据TAG删除镜像
$ docker rmi -f c565xxxxc87f
# 删除悬空镜像
$ docker rmi $(docker images --filter "dangling=true" -q --no-trunc)
```