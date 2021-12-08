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