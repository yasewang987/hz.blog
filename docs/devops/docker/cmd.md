# Docker常用方法

## docker常用命令

```bash
# 删除所有容器
docker rm $(docker ps -qa)
# 强制删除所有容器（包含运行的）
docker rm -f $(docker ps -qa)
# 删除退出状态的容器
docker rm $(docker ps -a | grep "Exited" | awk '{print $1 }')
# 获取容器名称
docker ps --format {{.Names}}

# 删除所有镜像
docker rmi $(docker images -qa)
# 删除<none>的镜像
docker rmi $(docker images | grep none | awk '{print $3}')

# 查找dockerhub镜像
docker search
# 查看容器元数据
docker inspect xxx
# 查看日志
docker logs xxx
# 进入容器bash
docker exec -it xxx /bin/bash

```

## docker常用功能

### docker容器中使用docker命令

```bash
docker run -d -v /var/run/docker.sock:/var/run/docker.sock -v /usr/bin/docker:/usr/bin/docker --name hello helloworld
```

### docker时区问题

```bash
docker run -d -v /etc/localtime:/etc/localtime --name hello helloworld
```

### docker中文乱码问题

```bash
# 查看所有编码
locale -a

# 查看当前所使用的编码
locale

# 这里设置哪种编码需要根据容器环境确定
docker run -d -e LANG="C.UTF-8" --name hello helloworld
```

### docker替换国内镜像源

```bash
# 在dockerfile中加入如下内容，stretch这个需要注意看一下构建镜像的时候提示的默认版本是什么
RUN echo "deb http://mirrors.aliyun.com/debian/ stretch main" >/etc/apt/sources.list && echo "deb http://mirrors.aliyun.com/debian-security stretch/updates main" >>/etc/apt/sources.list && echo "deb http://mirrors.aliyun.com/debian/ stretch-updates main" >>/etc/apt/sources.list
```