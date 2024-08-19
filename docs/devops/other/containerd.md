# Containerd

## containerd部署

## ctr常用命令

```bash
#### 查看命名空间
# create, c : 创建
# list, ls：查看列表
# remove, rm ：删除
ctr ns ls
# 运行容器
ctr run --net-host  --mount type=bind,src=/opt/deploy/crm,dst=/data,options=rbind:rw  --mount type=bind,src=/opt/deploy/crm/logs,dst=/tmp/logs,options=rbind:rw  -d docker.io/java:v1 crm bash crm_start.sh

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

#### containers
# create: 创建一个新的容器。
# start: 启动容器。
# stop: 停止容器。
# delete: 删除容器。
# ls: 列出容器。
# info: 查看容器信息
# logs: 查看容器的日志（如果 containerd 版本支持此命令）。
# 查看所有容器
ctr c ls
# 查看日志
ctr c logs containername
# 删除容器
ctr c delete containername
# 查看磁盘映射目录
ctr c info containername | grep source

#### tasks
# kill: 终止任务。
# attach: 附加到任务。
# resume: 恢复任务。
# pause: 暂停任务。
# wait: 等待任务结束。
# ls: 列出任务。
# inspect: 查看任务的详细信息
# 查看所有任务(包含pid)
ctr t ls
# 查看任务所有进程
ctr t ps taskame
# 关闭进程（如果关闭不了直接用 kill -9 pid）
ctr t kill pid
```

## nerdctl常用命令