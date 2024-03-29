# Dapr-Info

Dapr基本概念介绍

## 知识图谱

https://note.youdao.com/s/D7gEckR9

![2](http://cdn.go99.top/docs/microservices/dapr/info2.png)

## 基本术语

* 应用（App/Application）：运行中的服务/二进制应用，通常是由用户创建和运行的。
* Building block (构建块)：Dapr 为用户提供的 API，以帮助创建微服务和应用程序。
* Component (组件)：由 Dapr 构建块单独使用或与其他组件集合一起使用的模块化功能类型。
* Configuration (配置)：一个 YAML 文件，声明Dapr sidecars 或 Dapr 控制面板的所有设置。 您可以在这里配置控制平面 mTLS 设置，或应用程序实例的跟踪和中间件设置。
* Dapr：分布式应用程序运行时。
* Dapr control plane (Dapr 控制面板)：在托管平台（如 Kubernetes 集群）上安装 Dapr 的一部分的服务集合。 允许 Dapr 启用应用程序在该平台上运行，并处理 Dapr 功能，如 actor placement 、Dapr sidecar 或证书签发/延续。
* 自托管：您可以在 Windows/macOS/Linux机器 用Dapr运行您的应用程序。 Dapr 提供以"自托管"模式在机器上运行的功能。
* Service (服务)：正在运行的应用程序或二进制文件。 可用于指您的应用程序，或Dapr应用程序。
* Sidecar：将应用程序作为单独的流程或容器与您的应用程序一起运行的程序。

## dapr常用镜像

Docker Hub上，每个 Dapr 组件都有已发布的 Docker 镜像。

* [daprio/dapr](https://hub.docker.com/r/daprio/dapr) (包含所有Dapr binaries)
* [daprio/daprd](https://hub.docker.com/r/daprio/daprd)
* [daprio/placement](https://hub.docker.com/r/daprio/placement)
* [daprio/sentry](https://hub.docker.com/r/daprio/sentry)
* [daprio/dapr-dev](https://hub.docker.com/r/daprio/dapr-dev)
### Linux/amd64
* `latest`：最新版本，仅 用于开发目的。
* `edge`: 最新的edge构建(master)。
* `major.minor.patch`: 发布版本。
* `major.patch-rc.iteration`: 候选发布。
### Linux/arm/v7
* `latest-arm`：最新的ARM版本， 只 用于开发目的。
* `edge-arm`: ARM的最新的edge构建(master)。
* `major.minor.patch-arm`: ARM的发布版本。
* `major.patch-rc.iteration`: ARM的候选发布。
