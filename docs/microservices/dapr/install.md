# Dapr安装

Dapr是一个可移植的、无服务器的、事件驱动的运行时，它使开发人员能够轻松地构建在云和edge上运行的具有弹性、无状态和有状态的微服务，并支持多种语言和开发人员框架

类似一个将与业务无关的基础功能整合到sider-car（dapr）中。

官方文档：https://docs.dapr.io/

quickstarts: https://github.com/dapr/quickstarts

如果是自托管需要在每台服务器上都安装dapr。

## 安装Dapr Cli

官方github仓库的Release页面下载对应系统的压缩包

https://github.com/dapr/cli/releases

解压之后将dapr文件转移到对应目录

Linux,Mac用户：

```bash
mv ./dapr /usr/local/bin

# 如果是Mac M1的用户如果不能执行需要执行如下命令
softwareupdate --install-rosetta
```

Windows用户：创建一个目录并将其添加到系统PATH。 例如，通过编辑系统环境变量，创建一个名为 `C:\dapr` 的目录，并将此目录添加到您的用户PATH

验证只需要直接执行 `dapr` 命令出现正常提示即可。

## 初始化Dapr

Dapr 与您的应用程序一起作为sidecar运行，在自托管模式下，这意味着它是您本地机器上的一个进程。 因此，初始化 Dapr 包括获取 Dapr sidecar 二进制文件并将其安装到本地.

推荐开发环境使用Docker

如果你使用 sudo 运行您的 Docker 命令，或者安装路径是 /usr/local/bin (默认安装路径)， 您需要在下面使用 sudo

* 安装最新的 Dapr 运行时二进制程序:

```bash
# 执行之后会生成3个容器
sudo dapr init
```

* 验证Dapr 版本

```bash
sudo dapr --version

# 输出内容如下
CLI version: 1.0.1 
Runtime version: 1.1.0
```

* 验证容器正在运行

```bash
docker ps

# 会看到 daprio/dapr, openzipkin/zipkin和 redis 几个镜像的容器正在运行
CONTAINER ID   IMAGE                    COMMAND                  CREATED         STATUS         PORTS                              NAMES
0dda6684dc2e   openzipkin/zipkin        "/busybox/sh run.sh"     2 minutes ago   Up 2 minutes   9410/tcp, 0.0.0.0:9411->9411/tcp   dapr_zipkin
9bf6ef339f50   redis                    "docker-entrypoint.s…"   2 minutes ago   Up 2 minutes   0.0.0.0:6379->6379/tcp             dapr_redis
8d993e514150   daprio/dapr              "./placement"            2 minutes ago   Up 2 minutes   0.0.0.0:6050->50005/tcp            dapr_placement    
```

* 验证组件目录已初始化

在 `dapr init` 时，CLI 还创建了一个默认组件文件夹，其中包括几个 YAML 文件，其中包含`state store、elevated 和 zipkin`。 Dapr sidecar,将读取这些文件。 告诉它使用Redis容器进行状态管理和消息传递，以及Zipkin容器来收集跟踪。

```bash
ls ~/.dapr

# 内容如下
bin  components  config.yaml
```

## Configuration配置

文件位置：`~/.dapr/config.yaml`

```yaml
apiVersion: dapr.io/v1alpha1
kind: Configuration
metadata:
  name: daprConfig
  namespace: default
spec:
  tracing:
    samplingRate: "1"
    zipkin:
      endpointAddress: "http://localhost:9411/api/v2/spans"
```

## 使用 Docker-Compose 运行

如果您希望在没有Kubernetes的情况下，在本地使用Dapr sidecars运行多个应用程序，那么建议使用Docker Compose定义（docker-compose.yml）。

为了使用Dapr和Docker Compose运行您的应用程序，您需要在您的`docker-compose.yml`中定义sidecar模式。 例如:


```yaml
version: '3'
services:
  nodeapp:
    build: ./node
    ports:
      - "50001:50001" # Dapr instances communicate over gRPC so we need to expose the gRPC port
    depends_on:
      - redis
      - placement
    networks:
      - hello-dapr
  nodeapp-dapr:
    image: "daprio/daprd:edge"
    command: [
      "./daprd",
     "-app-id", "nodeapp",
     "-app-port", "3000",
     "-placement-host-address", "placement:50006" # Dapr's placement service can be reach via the docker DNS entry
     ]
    volumes:
        - "./components/:/components" # Mount our components folder for the runtime to use
    depends_on:
      - nodeapp
    network_mode: "service:nodeapp" # Attach the nodeapp-dapr service to the nodeapp network namespace

  ... # Deploy other daprized services and components (i.e. Redis)

  placement:
    image: "daprio/dapr"
    command: ["./placement", "-port", "50006"]
    ports:
      - "50006:50006"
    networks:
      - hello-dapr Redis)

  placement:
    image: "daprio/dapr"
    command: ["./placement", "-port", "50006"]
    ports:
      - "50006:50006"
    networks:
      - hello-dapr
```

## 卸装dapr

```bash
# 下面的 CLI 命令移除Dapr sidecar 二进制文件和placement 容器：
dapr uninstall

# 上述命令不会删除在dapr init期间默认安装的Redis或Zipkin容器，以防你将它们用于其他目的。 要删除 Redis, Zipkin, Actor Placement 容器，以及位于 $HOME/.dapr 或 %USERPROFILE%\.dapr\, 运行：
dapr uninstall --all
```

## 升级dapr

```bash
# 卸载
dapr uninstall --all

# 下载最新版本

# 初始化
dapr init

# 查看版本
$ dapr --version
```