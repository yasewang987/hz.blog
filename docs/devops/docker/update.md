# Docker容器配置调整

## 修改启动容器的环境变量

1. 停止容器: `docker stop xxx`
1. 修改容器配置文件内容：

    `/var/lib/docker/containers/[container-id]/config.json`
    `/var/lib/docker/containers/[container-id]/config.v2.json`
1. 重启docker：`sudo systemctl restart docker`

## docker update 命令

`docker update` 命令动态更新容器配置。可以使用此命令防止容器从其Docker主机消耗太多资源。使用单个命令，您可以对单个容器或多个容器设置限制。若要指定多个容器，请提供以空格分隔的容器名称或ID列表.

```bash
docker update [OPTIONS] CONTAINER [CONTAINER...]
```

参数：

* `-blkio-weight`: 阻止IO（相对权重），介于10和1000之间，或0禁用（默认值为0
* `--cpu-period`: 限制CPU CFS（完全公平调度程序）间隔
* `--cpu-quota`: 限制CPU CFS（完全公平调度程序）配额
* `--cpu-rt-period`: 以微秒为单位限制CPU实时周期
* `--cpu-rt-runtime`: 以微秒为单位限制CPU实时运行时间
* `--cpu-shares, -c`: CPU份额（相对重量）
* `--cpus`: CPU数量
* `--cpuset-cpus`: 允许执行的CPU（0-3,0,1）
* `--cpuset-mems`: 允许执行的MEM（0-3,0,1）
* `--kernel-memory`: 内核内存限制
* `--memory, -m`: 内存限制
* `--memory-reservation`: 内存软限制
* `--memory-swap`: 交换限制等于内存加交换：'-1'以启用无限交换
* `--restart` 重新启动策略以在容器退出时应用

例子：

```bash
# 将容器的CPU共享限制为512
docker update --cpu-shares 512 abebf7571666

# 将容器的CPU共享限制为512,内存限制300m
docker update --cpu-shares 512 -m 300M abebf7571666 hopeful_morse

# --kernel-memory选择。在4.6以上的内核版本上，只有当容器启动时，才能在运行的容器上更新此选项
docker run -dit --name test --kernel-memory 50M ubuntu bash
docker update --kernel-memory 80M test
# 如果容器已启动无--kernel-memory在更新内核内存之前，需要停止容器。
docker run -dit --name test2 --memory 300M ubuntu bash

# 更新容器重启策略
docker update --restart=on-failure:3 abebf7571666 hopeful_morse
```