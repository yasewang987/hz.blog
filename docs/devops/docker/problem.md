# Docker问题处理

## docker拉取私有镜像报错

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
```

## docker中文乱码问题

```bash
# 查看所有编码
locale -a

# 查看当前所使用的编码
locale

# 这里设置哪种编码需要根据容器环境确定
docker run -d -e LANG="C.UTF-8" --name hello helloworld
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