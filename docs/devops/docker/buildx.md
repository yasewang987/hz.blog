# Docker多平台构建builderx

官网地址：https://docs.docker.com/buildx/working-with-buildx/

1. 确保使用的 Linux 发行版内核 **>=4.8.0**（推荐使用 Ubuntu 18.04 以上的 TLS 发行版），且 **Docker >= 19.03**；

1. 启用Docker CLI 实验性功能：`export DOCKER_CLI_EXPERIMENTAL=enabled`
    
    查看是否已经开启：

    ```bash
    docker buildx version
    #出现如下内容
    github.com/docker/buildx v0.5.1-tp-docker 6db68d029599c6710a32aa7adcba8e5a344795a7
    ```

    如果在某些系统上设置环境变量 `DOCKER_CLI_EXPERIMENTAL` 不生效（比如 Arch Linux）,你可以选择从源代码编译：

    ```bash
    export DOCKER_BUILDKIT=1
    docker build --platform=local -o . git://github.com/docker/buildx
    mkdir -p ~/.docker/cli-plugins && mv buildx ~/.docker/cli-plugins/docker-buildx
    ```
1. 启用 binfmt_misc

    如果你使用的是 Docker 桌面版（MacOS 和 Windows），默认已经启用了 binfmt_misc，可以跳过这一步。

    如果你使用的是 Linux，需要手动启用 binfmt_misc。大多数 Linux 发行版都很容易启用，不过还有一个更容易的办法，直接运行一个特权容器，容器里面写好了设置脚本：

    **注意**：如果服务器重启需要重新执行

    ```bash
    # 建议(包含了mips64el等)
    docker run --privileged --rm tonistiigi/binfmt:buildkit-master --install all
    # 卸载
    docker run --privileged --rm tonistiigi/binfmt:buildkit-master --uninstall qemu-*
    # 备用
    docker run --rm --privileged docker/binfmt:a7996909642ee92942dcd6cff44b9b95f08dad64
    # 这个只是在机器上安装所有的qemu支持，但是 docker buildx 并不能使用
    docker run --rm --privileged multiarch/qemu-user-static:register --reset
    ```

    如果报错 `Cannot write to /proc/sys/fs/binfmt_misc/register: write /proc/sys/fs/binfmt_misc/register: invalid argument`,这是由于内核不支持 （F）标志造成的。出现这种情况，建议您升级系统内核或者换使用较高版本内核的 Linux 发行版。

1. 验证是 binfmt_misc 否开启：

    ```bash
    ls -al /proc/sys/fs/binfmt_misc

    -rw-r--r-- 1 root root 0 11月 18 00:12 qemu-aarch64
    -rw-r--r-- 1 root root 0 11月 18 00:12 qemu-arm
    -rw-r--r-- 1 root root 0 11月 18 00:12 qemu-ppc64le
    -rw-r--r-- 1 root root 0 11月 18 00:12 qemu-s390x
    --w------- 1 root root 0 11月 18 00:09 register
    -rw-r--r-- 1 root root 0 11月 18 00:12 status
    ```

    验证是否启用了相应的处理器：

    ```bash
    cat /proc/sys/fs/binfmt_misc/qemu-aarch64
    enabled
    interpreter /usr/bin/qemu-aarch64
    flags: OCF
    offset 0
    magic 7f454c460201010000000000000000000200b7
    mask ffffffffffffff00fffffffffffffffffeffff
    ```

1. 新建 Docker builder 实例支持多平台构建：

    如果是私有仓库管理docker镜像，而且使用的是http协议，则会出现错误提示： `Error response from daemon: Get https://ip:port/v2/: http: server gave HTTP response to HTTPS client`

    需要在 `/home/gitlab-runner/.docker/buildx` 文件夹下新建 `config.toml` 文件，内容如下：

    ```
    [registry."docker.io"]
        mirrors = ["reg-mirror.qiniu.com"]
        
    [registry."192.168.1.118:5000"]
        http = true
        insecure = true
    ```
    * mirrors: 镜像加速器地址
    * http和insecure: 允许非安全的http仓库地址
    * 完整配置参考：https://github.com/moby/buildkit/blob/master/docs/buildkitd.toml.md
    
    ```bash
    # 新建同时切换 builder 
    docker buildx create --use --name mybuilder # --config=/home/${USER}/.docker/buildx/config.toml

    # 只新建，然后再切换 builder
    docker buildx create --name mybuilder # --config=/home/${USER}/.docker/buildx/config.toml
    docker buildx use mybuilder

    # 适用于国内环境(设置了 --driver-opt 后，可以使用 mips64el)
    $ docker buildx create --use --name=mybuilder-cn --driver docker-container --driver-opt image=dockerpracticesig/buildkit:master

    # 适用于腾讯云环境(腾讯云主机、coding.net 持续集成)
    $ docker buildx create --use --name=mybuilder-cn --driver docker-container --driver-opt image=dockerpracticesig/buildkit:master-tencent

    # 启动构建器
    docker buildx inspect mybuilder --bootstrap
    ```

1. 查看当前使用的构建器及构建器支持的 CPU 架构

    ```bash
    docker buildx ls
    # 内容如下
    NAME/NODE    DRIVER/ENDPOINT             STATUS  PLATFORMS
    mybuilder *  docker-container
    mybuilder0 unix:///var/run/docker.sock running linux/amd64, linux/arm64, linux/ppc64le, linux/s390x, linux/386, linux/arm/v7, linux/arm/v6
    default      docker
    default    default                     running linux/amd64, linux/386
    ```

1. 使用go项目测试：

    ```go
    package main

    import (
            "fmt"
            "runtime"
    )

    func main() {
            fmt.Printf("Hello, %s!\n", runtime.GOARCH)
    }
    ```

    创建一个 Dockerfile 将该应用容器化：

    ```dockerfile
    FROM golang:alpine AS builder
    WORKDIR /app
    COPY . .
    RUN go mod init hello && go build -o hello .

    FROM alpine
    WORKDIR /app
    COPY --from=builder /app/hello .
    CMD ["./hello"]
    ```

    现在就可以使用 buildx 构建一个支持 arm、arm64 和 amd64 多架构的 Docker 镜像了，同时将其推送到 Docker Hub

    ```bash
    # 登陆 dockerhub
    docker login

    # 构建并推送
    docker buildx build -t yasewang/hello-arch --platform=linux/arm64,linux/arm,linux/amd64 . --push
    ```

    现在就可以通过 `docker pull yasewang/hello-arch` 拉取刚刚创建的镜像了，Docker 将会根据你的 CPU 架构拉取匹配的镜像。

    背后的原理也很简单，之前已经提到过了，buildx 会通过 `QEMU` 和 `binfmt_misc` 分别为 3 个不同的 CPU 架构（arm，arm64 和 amd64）构建 3 个不同的镜像。构建完成后，就会创建一个 `manifest list`，其中包含了指向这 3 个镜像的指针。

    如果想将构建好的镜像保存在本地，可以将 `type` 指定为 `docker`，但必须分别为不同的 CPU 架构构建不同的镜像，不能合并成一个镜像，即：

    ```bash
    docker buildx build -t yasewang/hello-arch --platform=linux/arm -o type=docker .
    docker buildx build -t yasewang/hello-arch --platform=linux/arm64 -o type=docker .
    docker buildx build -t yasewang/hello-arch --platform=linux/amd64 -o type=docker .
    ```

1. 测试多平台镜像

    由于之前已经启用了 `binfmt_misc`，现在我们就可以运行任何 CPU 架构的 Docker 镜像了，因此可以在本地系统上测试之前生成的 3 个镜像是否有问题。

    首先列出每个镜像的 `digests`：

    ```bash
    docker buildx imagetools inspect yasewang/hello-arch

    # 内容如下
    Name:      docker.io/yasewang/hello-arch:latest
    MediaType: application/vnd.docker.distribution.manifest.list.v2+json
    Digest:    sha256:cbe685f855c2c86d6b22bd1d185ef52534465721a682c32b198765208f0d6dea
            
    Manifests: 
    Name:      docker.io/yasewang/hello-arch:latest@sha256:cf8bd3e2764a490c7edcc150a52a24ac4faed6f2162b34a5ad144384e840d0b7
    MediaType: application/vnd.docker.distribution.manifest.v2+json
    Platform:  linux/arm64
                
    Name:      docker.io/yasewang/hello-arch:latest@sha256:2d42d86f8eb79969852969d11184b03bd8ea876bf5a1ad89103e808961dc2f37
    MediaType: application/vnd.docker.distribution.manifest.v2+json
    Platform:  linux/arm/v7
                
    Name:      docker.io/yasewang/hello-arch:latest@sha256:dd19f57683395387b00d1a41adf2cabc7a34bba91bf2c1a80292bf3eaf0e4481
    MediaType: application/vnd.docker.distribution.manifest.v2+json
    Platform:  linux/amd64
    ```

    运行每一个镜像并观察输出结果：

    ```bash
    docker run --rm docker.io/yasewang/hello-arch:latest@sha256:cf8bd3e2764a490c7edcc150a52a24ac4faed6f2162b34a5ad144384e840d0b7
    # 输出
    Hell,arm64

    docker run --rm docker.io/yasewang/hello-arch:latest@sha256:2d42d86f8eb79969852969d11184b03bd8ea876bf5a1ad89103e808961dc2f37
    # 输出
    Hell,arm
    
    docker run --rm docker.io/yasewang/hello-arch:latest@sha256:dd19f57683395387b00d1a41adf2cabc7a34bba91bf2c1a80292bf3eaf0e4481
    # 输出
    Hell,amd64
    ```

**拉取多平台镜像**

```bash
docker pull --platform arm64  镜像
# --platform：该参数是用于拉取指定平台的镜像，也是实验性功能，在上面步骤中开启后就会出现。通过该参数可以手动指定需要的CPU平台镜像，而不用自动去识别。
```