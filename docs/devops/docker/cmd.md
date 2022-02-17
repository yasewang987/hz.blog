# Docker常用方法

## 判断Docker容器是否存在

```sh
if [ ! $(docker ps -a --format {{.Names}} | grep schoolpal.aggregate.api.builder) ]
then
    docker run -d -i -v /home:/dotnet --name schoolpal.aggregate.api.builder mcr.microsoft.com/dotnet/core/sdk:2.2
fi
```

## docker常用命令

```bash
####### 指定默认工作目录 /data
docker run -d -w /data aaa

####### 删除所有容器
docker rm $(docker ps -qa)
# 强制删除所有容器（包含运行的）
docker rm -f $(docker ps -qa)
# 删除退出状态的容器
docker rm $(docker ps -a | grep "Exited" | awk '{print $1 }')

####### 获取容器名称
docker ps --format {{.Names}}

####### 删除所有镜像
docker rmi $(docker images -qa)
# 删除<none>的镜像
docker rmi $(docker images | grep none | awk '{print $3}')

####### 查找dockerhub镜像
docker search

######## 查看容器元数据
docker inspect xxx
# 查看日志文件数据
$ docker inspect --format='{{.LogPath}}' <容器ID>
/var/lib/docker/containers/545e06a75cc0ac8f8c1e6f7217455660187124a3eed031b5eb2f6f0edeb426cb/545e06a75cc0ac8f8c1e6f7217455660187124a3eed031b5eb2f6f0edeb426cb-json.log

######### 查看日志
docker logs xxx
# 查看最后10条日志
docker logs --tail=100 <容器ID>
# 动态监控最后200条日志
docker logs -f --tail 200 <containerid>

###### 进入容器bash
docker exec -it xxx /bin/bash

###### 使用容器生成镜像
docker commit 容器id 镜像名称

###### 拷贝宿主机文件到容器中
docker cp 宿主机文件夹/文件 容器id:/path
# 拷贝容器文件到宿主机
docker cp 容器id:/path 宿主机文件夹/文件

###### 查看指定镜像的创建历史
docker history [OPTIONS] IMAGE

###### 将指定镜像保存成 tar 归档文件
# -o :输出到的文件
docker save [OPTIONS] IMAGE [IMAGE...]
# 多个镜像打包示例
docker save -o abc.tar image:1 image:2
# 导入使用 docker save 命令导出的镜像,--input , -i : 指定导入的文件
docker load [OPTIONS]
docker load -i abc.tar

##### 将容器导出为镜像
# -o :将输入内容写到文件。
docker export [OPTIONS] CONTAINER
docker export -o mysql-`date +%Y%m%d`.tar a404c6c174a2
# 通过容器导入镜像，-c :应用docker 指令创建镜像,-m :提交时的说明文字
docker import [OPTIONS] file|URL|- [REPOSITORY[:TAG]]
docker import  my_ubuntu_v3.tar runoob/ubuntu:v4

###### 列出指定的容器的端口映射，或者查找将PRIVATE_PORT NAT到面向公众的端口
docker port [OPTIONS] CONTAINER [PRIVATE_PORT[/PROTO]]
docker port mymysql

##### 查看容器中运行的进程信息，支持 ps 命令参数
docker top [OPTIONS] CONTAINER [ps OPTIONS]
```

## docker容器中使用docker命令

```bash
docker run -d -v /var/run/docker.sock:/var/run/docker.sock -v /usr/bin/docker:/usr/bin/docker --name hello helloworld
```

## docker替换国内镜像源

`apt update`升级较慢时需要用到

```bash
# 在dockerfile中加入如下内容，stretch这个需要注意看一下构建镜像的时候提示的默认版本是什么
RUN echo "deb http://mirrors.aliyun.com/debian/ stretch main" >/etc/apt/sources.list && echo "deb http://mirrors.aliyun.com/debian-security stretch/updates main" >>/etc/apt/sources.list && echo "deb http://mirrors.aliyun.com/debian/ stretch-updates main" >>/etc/apt/sources.list
```
## docker限定日志大小

单容器限制：

```bash
docker run -it --log-opt max-size=10m --log-opt max-file=3 redis
```

全局设置：修改docker配置文件`daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {"max-size": "10m", "max-file": "3"}
}
```

重启生效：

```bash
systemctl daemon-reload
systemctl restart docker

# 或者直接执行
systemctl reload docker
```


## docker容器日志清理

创建shell脚本

```bash
vim /home/docker-sh/clean_docker_log.sh
```

脚本内容如下：

```shell
#!/bin/sh 
echo "======== start clean docker containers logs ========"  
logs=$(find /var/lib/docker/containers/ -name *-json.log)  
for log in $logs  
        do  
                echo "clean logs : $log"  
                cat /dev/null > $log  
        done  
echo "======== end clean docker containers logs ========"  
```

添加定时服务自动执行

```bash
crontab -e

0 0 2 * * ? /home/docker-sh/clean_docker_log.sh
```

## 优雅重启dockerd

编辑文件 `/etc/docker/daemon.json`，添加如下配置

```bash
{
    "live-restore": true
}
```

dockerd reload 配置(不会重启 dockerd，修改配置真好用)

```bash
# 给 dockerd 发送 SIGHUP 信号，dockerd 收到信号后会 reload 配置
kill -SIGHUP $(pidof dockerd)
```

检查是否配置成功

```bash
docker info | grep -i live
# 可以看到 Live Restore Enabled: true
```

重启 docker，此时重启 docker 不会重启容器

```bash
systemctl restart docker
```

* 如果有容器挂载了 docker.sock 文件，重启后工作可能会不正常，需要重启该容器。

## Docker普通用户使用

```bash
# 查看 docker.sock 所属用户组
ls -l /var/run/docker.sock
# 如果不是docker用户组所有需要修改
chown root:docker /var/run/docker.sock
## 最终效果
srw-rw----. 1 root docker 0 May 25 14:12 /var/run/docker.sock

# 将普通用户加入docker用户组
usermod -G docker test
```

## Docker开启tcp控制

* 如果开启了防火墙记得开启防火墙

```bash
# 查找docker.service的位置
systemctl status docker.service

# 修改配置文件
vim /usr/lib/systemd/system/docker.service
# 将 ExecStart 改为如下内容
ExecStart=/usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock -H tcp://0.0.0.0:2375

# 重启docker服务
systemctl daemon-reload
systemctl restart docker

# 执行命令示例如下
docker -H 192.168.100.7:2375 ps 
```
