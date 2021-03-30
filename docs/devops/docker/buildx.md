# Docker多平台构建builderx

1. 确保使用的 Linux 发行版内核 **>=4.8.0**（推荐使用 Ubuntu 18.04 以上的 TLS 发行版），且 **Docker >= 19.03**；

1. 启用Docker CLI 实验性功能：`export DOCKER_CLI_EXPERIMENTAL=enabled`
    
    查看是否已经开启：

    ```bash
    # Server: Docker Engine 中有 Experimental: true
    docker version
    ```

1. 配置其它平台的模拟器：`docker run --privileged docker/binfmt:66f9012c56a8316f9244ffd7622d7c21c1f6f28d`

    如果报错 `Cannot write to /proc/sys/fs/binfmt_misc/register: write /proc/sys/fs/binfmt_misc/register: invalid argument`,这是由于内核不支持 （F）标志造成的。出现这种情况，建议您升级系统内核或者换使用较高版本内核的 Linux 发行版。

    验证是 binfmt_misc 否开启:

    ```bash
    ls -al /proc/sys/fs/binfmt_misc

    -rw-r--r-- 1 root root 0 11月 18 00:12 qemu-aarch64
    -rw-r--r-- 1 root root 0 11月 18 00:12 qemu-arm
    -rw-r--r-- 1 root root 0 11月 18 00:12 qemu-ppc64le
    -rw-r--r-- 1 root root 0 11月 18 00:12 qemu-s390x
    --w------- 1 root root 0 11月 18 00:09 register
    -rw-r--r-- 1 root root 0 11月 18 00:12 status
    ```

1. 新建 Docker builder 实例支持多平台构建：
    
    ```bash
    # 新建同时切换 builder 
    docker buildx create --use --name mybuilder

    # 只新建，然后再切换 builder
    docker buildx create --name mybuilder
    docker buildx use mybuilder

    # 启动构建器（可以不执行）
    docker buildx inspect mybuilder --bootstrap
    ```
1. 在项目目录中执行构建：

    ```bash
    docker buildx build --platform linux/amd64,linux/arm64,linux/arm -t xyz:1 . --push
    ```