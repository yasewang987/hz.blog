# Docker常用命令

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