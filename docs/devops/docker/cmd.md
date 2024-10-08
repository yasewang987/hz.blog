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
#### docker停止
systemctl stop docker.socket
systemctl stop docker
systemctl disable docker.socket
systemctl disable docker

#### 构建镜像
docker build -t imagename .

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
docker logs --tail 100 <容器ID>
# 动态监控最后200条日志
docker logs -f --tail 200 <containerid>
# 过滤指定日志
dokcer logs -n 20000 containerid | grep ERROR

###### 进入容器bash
docker exec -it xxx /bin/bash

###### 使用容器生成镜像
docker commit 容器id 镜像名称

###### 拷贝宿主机文件到容器中
docker cp 宿主机文件夹/文件 容器id:/path
# 拷贝容器文件到宿主机
docker cp 容器id:/path 宿主机文件夹/文件

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

##### docker使用显卡
# 显卡1和显卡2
docker run --rm --gpus '"device=1,2"' 84b086e2ba68 nvidia-smi
# 所有显卡
docker run --rm --gpus all xxxx

#### 格式化输出容器信息
# .ID 容器ID
#.Image 镜像ID
#.Command Quoted command
#.CreatedAt 创建容器的时间点.
#.RunningFor 从容器创建到现在过去的时间.
#.Ports 暴露的端口.
#.Status 容器状态.
#.Size 容器占用硬盘大小.
#.Names 容器名称.
#.Labels 容器所有的标签.
#.Label 指定label的值 例如'{{.Label “com.docker.swarm.cpu”}}’
#.Mounts 挂载到这个容器的数据卷名称
docker ps --format "容器ID：{{.ID}}\n名称：{{.Names}}\n镜像：{{.Image}}\n状态：{{.Status}}\n端口：{{.Ports}}\n"

###### 将指定镜像保存成 tar 归档文件
# -o :输出到的文件
docker save [OPTIONS] IMAGE [IMAGE...]
# 多个镜像打包示例
docker save -o abc.tar image:1 image:2
# 导入使用 docker save 命令导出的镜像,--input , -i : 指定导入的文件
docker load [OPTIONS]
docker load -i abc.tar
docker load < abc.tar.gz

####### 删除所有镜像
docker rmi $(docker images -qa)
# 删除<none>的镜像
docker rmi $(docker images | grep none | awk '{print $3}')

##### 查看镜像层级
docker image history xxxx:11

# 查看镜像详细信息
docker image inspect xxxxx:11

# 修改镜像名称
docker tag souceImage:[tag] targetImage:[tag]


# 持续刷新查看容器状态
docker stats
# 只显示当前状态
docker stats --no-stream
# 格式化输出当前状态（.Container，.Name，.ID，.CPUPerc，.MemUsage，.NetIO，.BlockIO，.MemPerc，.PIDs）
docker stats --format "{{.Container}}: {{.CPUPerc}}"
# 以表格的方式输出当前状态
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

## docker参数说明

```bash
# 获取宿主机器root用户权限（权限全开，不利于宿主机安全）
--privileged
# 细粒度权限设置，需要什么开什么
--cap-add/--cap-drop
# 能看到宿主机上的所有进程
--pid=host
# 共享内存设置32g
--shm-size=32g
```

## docker启动端口绑定ip

```bash
# 将容器的端口80映射到主机192.168.1.100的端口8080上
docker run -p 192.168.1.100:8080:80 <镜像名>
```

## docker容器中使用docker命令

```bash
docker run -d -v /var/run/docker.sock:/var/run/docker.sock -v /usr/bin/docker:/usr/bin/docker --name hello helloworld
```

## docker替换国内镜像源

`apt update`升级较慢时需要用到

```bash
RUN echo "deb http://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal main restricted universe multiverse" > /etc/apt/sources.list &&\
  echo "deb http://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-updates main restricted universe multiverse" >> /etc/apt/sources.list &&\
  echo "deb http://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-backports main restricted universe multiverse" >> /etc/apt/sources.list &&\
  echo "deb http://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-security main restricted universe multiverse" >> /etc/apt/sources.list
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


```bash
# Keep containers alive during daemon downtime
$ sudo vim /etc/docker/daemon.yaml
{
  "live-restore": true
}

# 在守护进程停机期间保持容器存活
$ sudo dockerd --live-restore

# 只能使用reload重载
# 相当于发送SIGHUP信号量给dockerd守护进程
$ sudo systemctl reload docker

# 但是对应网络的设置需要restart才能生效
# 重启 docker，此时重启 docker 不会重启容器
$ sudo systemctl restart docker
```

检查是否配置成功

```bash
docker info | grep -i live
# 可以看到 Live Restore Enabled: true
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

## 清理指定label镜像

```dockerfile
FROM image:1
LABEL mylabel=label0
```

```bash
docker images prune -a -f --filter="label=mylabel=label0"
```

## 转移docker存储目录

默认目录 `/var/lib/docker` 

方案一：添加软链接

```bash
# 1.停止docker服务
$ sudo systemctl stop docker

# 2.开始迁移目录
$ sudo mv /var/lib/docker /data/
# 迁移目录也可以使用cp命令一定要加-arv
# sudo cp -arv /data/docker /data2/docker

# 3.添加软链接
$ sudo ln -s /data/docker /var/lib/docker

# 4.启动docker服务
$ sudo systemctl start docker
```

方案二：改动 docker 配置文件

```bash
# [方式一] 改动docker启动配置文件
$ sudo vim /lib/systemd/system/docker.service
ExecStart=/usr/bin/dockerd --graph=/data/docker/

# [方式二] 改动docker启动配置文件
$ sudo vim /etc/docker/daemon.json
{
    "live-restore": true,
    "graph": [ "/data/docker/" ]
} 
```

## Docker 添加私有仓库

```bash
# 添加配置
$ sudo cat /etc/docker/daemon.json
{
    "insecure-registries": ["192.168.31.191:5000"]
}

# 重启docker
$ sudo systemctl restart docker

# 重新登录即可
$ docker login 私库地址 -u 用户名 -p 密码
```

