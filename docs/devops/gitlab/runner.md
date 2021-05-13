# Gitlab-Runner基础教程

## 一、Intro

`jenkins`和`runner`，作为主流自动化运维工具来说，两者的大思路其实是一样的，就是将我们提交到代码仓库的代码拉到`jenkins`或者`runner`运行的机器里，然后执行一系列的命令（这里通常是指打包和发布的命令，当然你想执行什么样的命令都是可以自己定义的）

## 二、Runner安装注册

**准备工作** 在gitlab创建个人项目，注意查看如下信息，在注册runner的时候会用到（必须是项目的管理员才能看到）

![3](http://cdn.go99.top/docs/devops/gitlabrunner/base1.png)

### 安装包安装runner

安装： https://docs.gitlab.com/runner/install/linux-manually.html

```bash
# Replace ${arch} with any of the supported architectures, e.g. amd64, arm, arm64
# A full list of architectures can be found here https://gitlab-runner-downloads.s3.amazonaws.com/latest/index.html
curl -LJO "https://gitlab-runner-downloads.s3.amazonaws.com/latest/deb/gitlab-runner_${arch}.deb"

dpkg -i gitlab-runner_<arch>.deb
```

注册： https://docs.gitlab.com/ee/ci/docker/using_docker_build.html#use-the-shell-executor

```bash
sudo gitlab-runner register 
# 根据提示填写信息即可

# 将gitlab-runner加入到docker用户组
sudo usermod -aG docker gitlab-runner
```

* 如果在 Runner 在执行过程中提示 `Job failed (system failure): preparing environment:`,则需要把 `/home/gitlab-runner/.bash_logout` 删除，[官网处理意见参考](https://docs.gitlab.com/runner/faq/README.html#job-failed-system-failure-preparing-environment)。

### docker安装runner

gitlab-runner提供windows和linux版本的安装客户端，我这边使用`docker`的方式安装举例

```bash
docker pull gitlab/gitlab-runner
```

为了演示流水线的效果，这边会将整个过程分成2个阶段`编译`和`发布`（中间可以根据自己的需要添加其他阶段，比如镜像打包上传到镜像仓库等）

注册对应的runner之前应该想清楚这个runner需要实现的目标是什么

* `编译`runner安装注册

    **实施：** 
    ```bash
    # 创建配置文件目录
    sudo mkdir -p runner/runnertest/builder

    # 运行runner
    sudo docker run -d --name runnertest-builder --restart always \
    > -v /home/yasewang/runner/runnertest/builder:/etc/gitlab-runner \
    > -v /var/run/docker.sock:/var/run/docker.sock \
    > gitlab/gitlab-runner:latest

    # 注册runner
    sudo docker exec -it runnertest-builder gitlab-runner register

    # 配置runner
    Please enter the gitlab-ci coordinator URL (e.g. https://gitlab.com/):
    http://git.greedyint.com/

    Please enter the gitlab-ci token for this runner:
    _jooQZxyy6zCrs8HevDd

    Please enter the gitlab-ci description for this runner:
    [653f2eda5bfa]: runnertest-builder

    Please enter the gitlab-ci tags for this runner (comma separated):
    109-runnertest-builder

    Registering runner... succeeded                     runner=9x8kWsU1
    Please enter the executor: docker-ssh, docker+machine, docker-ssh+machine, kubernetes, docker, parallels, shell, ssh, virtualbox:
    docker

    Please enter the default Docker image (e.g. ruby:2.1):
    microsoft/dotnet:latest #注意这里使用dotnet镜像,查看镜像https://hub.docker.com/
    ```
    > 映射`/var/run/docker.sock`这个文件是为了让容器可以通过`/var/run/docker.sock`与`Docker守护进程`通信，管理其他`Docker容器`
    > `-v /srv/gitlab-runner/config:/etc/gitlab-runner`是将runner的配置文件映射到宿主机`/srv/gitlab-runner/config`方便调整和查看配置

    打开配置文件sudo cat /home/yasewang/runner/runnertest/builder/config.toml确认配置是否正确

    ```
    [[runners]]
    name = "dataservice"
    url = "http://1.2.3.4:10001/"
    token = "指定项目的授权码"
    executor = "docker"
    [runners.docker]
        tls_verify = false
        image = "docker:stable"
        privileged = false
        disable_entrypoint_overwrite = false
        oom_kill_disable = false
        disable_cache = false
        volumes = ["/var/run/docker.sock:/var/run/docker.sock", "/cache"]
        shm_size = 0
    ```

    * 一定要确保 *[volumes = ["/var/run/docker.sock:/var/run/docker.sock", "/cache"]* 存在，不然无法使用docker命令

按照上面的顺序操作下来，如果顺利的话就会在gitlab项目的ci里面看到这个runner已经上线

![3](http://cdn.go99.top/docs/devops/gitlabrunner/base2.png)

* `发布`runner安装注册

    **目标：** 将上一步生成的待发布文件打包成镜像，并运行容器。

    **分析：** 确定拉目标之后，就可以根据目标注册对应的runner了，想一下我们上面的步骤需要生成`docker`镜像并运行容器，那么在这个runner里面必须能使用`docker`命令。

    **实施：** 采用参数赋值的方式直接注册
    ```bash
    # 创建配置文件目录
    sudo mkdir -p runner/runnertest/deploy

    # 运行runner
    sudo docker run -d --name runnertest-deploy --restart always \
    > -v /home/yasewang/runner/runnertest/deploy:/etc/gitlab-runner \
    > -v /var/run/docker.sock:/var/run/docker.sock \
    > gitlab/gitlab-runner:latest

    # 注册runner
    sudo docker exec -it runnertest-deploy gitlab-runner register

    # 配置runner
    Please enter the gitlab-ci coordinator URL (e.g. https://gitlab.com/):
    http://git.greedyint.com/

    Please enter the gitlab-ci token for this runner:
    _jooQZxyy6zCrs8HevDd

    Please enter the gitlab-ci description for this runner:
    [653f2eda5bfa]: runnertest-deploy

    Please enter the gitlab-ci tags for this runner (comma separated):
    109-runnertest-deploy

    Registering runner... succeeded                     runner=9x8kWsU1
    Please enter the executor: docker-ssh, docker+machine, docker-ssh+machine, kubernetes, docker, parallels, shell, ssh, virtualbox:
    docker

    Please enter the default Docker image (e.g. ruby:2.1):
    docker:stable # 一定要指定，才能正常使用docker命令
    ```
    

## 三、CICD项目实战

1. 新建webapi项目：`dotnet new webapi -n runnertest --no-https`
1. 添加镜像检测删除脚本（后续ci构建脚本会用到）：
    ```bash
    # check-dev.sh
    if [ $(docker ps -a --format {{.Names}} | grep runnertest-dev) ]
    then
        docker rm -f runnertest-dev
        docker rmi runnertest-dev
    fi

    # check-master.sh
    if [ $(docker ps -a --format {{.Names}} | grep runnertest-master) ]
    then
        docker rm -f runnertest-master
        docker rmi runnertest-master
    fi
    ```
1. 添加`Dockerfile`文件
    ```dockerfile
    FROM mcr.microsoft.com/dotnet/core/aspnet
    WORKDIR /app
    COPY out/ /app
    ENTRYPOINT [ "dotnet", "/app/runnertest.dll" ]
    ```

### `gitlab-ci.yml`常用参数

1. **stages**：`pipeline`的阶段列表。定义整个`pipeline`的阶段
2. **stage**：定义某个`job`的所在阶段。参考#1
3. **script**：（唯一一个必须写的参数）`job`执行过程中的命令列表
4. **only/except**：触发类型/限制`job`的创建条件。参考[可用的选项](https://docs.gitlab.com/ee/ci/yaml/#only-and-except-simplified)
5. **tags**：指定`runner`的`tag`，只有拥有指定`tag`的`runner`才会接收到这个任务
6. **cache**：缓存。可选部分目录或未被 git 追踪的文件进行缓存,[参考](https://docs.gitlab.com/ee/ci/yaml/#cache)
7. **environment**：指定部署相关任务的环境，并非真实环境，是对要部署到某环境的任务的归类。方便在`gitlab`上聚合以便进行回滚和重新部署操作，[参考](https://docs.gitlab.com/ee/ci/yaml/#environment)
8. **artifacts**：保留文档。在每次 job 之前`runner`会清除未被 git 跟踪的文件。为了让编译或其他操作后的产物可以留存到后续使用，添加该参数并设置保留的目录，保留时间等。被保留的文件将被上传到`gitlab`以备后续使用。[参考](https://docs.gitlab.com/ee/ci/yaml/#artifacts)
9. **dependencies**：任务依赖。指定`job`的前置`job`。添加该参数后，可以获取到前置`job`的`artifacts`。注意如果前置 job 执行失败，导致没能生成`artifacts`，则 job 也会直接失败。

### yml阶段构建脚本(.gitlab-ci.yml)

```yml
stages:
  - build
  - deploy-dev
  - deploy-master

# 构建
build-job:
  stage: build
  only:
    - develop
    - master
  cache:
    untracked: true
  script:
    - dotnet restore
    - dotnet publish -o ./out -c Release
  artifacts:
    # 可以缓存在gitlab的流水线记录中，供直接下载
    expire_in: 30 days
    paths:
      - out/
  tags:
    - 109-runnertest-builder

# 发布测试
deploy-dev-job:
  stage: deploy-dev
  only:
    - develop
  dependencies:
    - build-job  # 这里一定要依赖build-job，不然dockerfile里面的out目录无法使用
  script:
    - ls out/
    - sh ./check-dev.sh
    - docker build -t runnertest-dev:$CI_PIPELINE_ID .
    # 这里可以添加将生成好的image上传到dockerhub或者docker本地仓库
    
    ### 如果生成的镜像需要统一上传到仓库管理，则后面的逻辑可以分离到另外一个runner去执行
    # 这里可以添加从dockerhub或本地仓库拉取指定镜像
    - docker run -d --name runnertest-dev -p 10001:80 runnertest-dev:$CI_PIPELINE_ID
  tags:
    - 109-runnertest-deploy

# 发布正式
deploy-master-job:
  stage: deploy-master
  only:
    - master
  dependencies:
    - build-job  # 这里一定要依赖build-job，不然dockerfile里面的out目录无法使用
  script:
    - ls out/
    - sh ./check-master.sh
    - docker build -t runnertest-master:$CI_PIPELINE_ID .
    # 这里可以添加将生成好的image上传到dockerhub或者docker本地仓库
    
    ### 如果生成的镜像需要统一上传到仓库管理，则后面的逻辑可以分离到另外一个runner去执行
    # 这里可以添加从dockerhub或本地仓库拉取指定镜像
    - docker run -d --name runnertest-master -p 10000:80 runnertest-master:$CI_PIPELINE_ID
  when: manual
  tags:
    - 109-runnertest-deploy
```

* 可以在 Settings-》CI/CD-》Variables 设置机密配置，通过 `$KEY` 方式使用
* gitlab流水线预设的变量：https://docs.gitlab.com/ee/ci/variables/predefined_variables.html

## 四、其他

做完上面的工作之后，将代码提交到gitlab的develop或者master分支就会自动触发构建任务了（第一次运行会比较慢，因为要拉取`netcore`和`docker`镜像，所以在没开始学习这个教程之前可以将几个镜像都准备好）。

各个阶段效果图如下：
1. 构建
![3](http://cdn.go99.top/docs/devops/gitlabrunner/base3.png)
![4](http://cdn.go99.top/docs/devops/gitlabrunner/base4.png)
1. 发布
![5](http://cdn.go99.top/docs/devops/gitlabrunner/base5.png)

服务器运行之后docker容器状态：

![3](http://cdn.go99.top/docs/devops/gitlabrunner/base6.png)

网页访问api效果图：

![3](http://cdn.go99.top/docs/devops/gitlabrunner/base7.png)

整个过程走下来会发现其实耗时的操作都是拉取镜像，这个情况只有第一次的时候才会出现，后续构建就不会有这个问题了。





## 五、Runner中使用docker buildx

确保使用的 Linux 发行版内核 **>=4.8.0**（推荐使用 Ubuntu 18.04 以上的 TLS 发行版），且 **Docker >= 19.03**；

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

需要在 `.gitlab-ci.yml` 脚本中添加如下命令：

```yml
stages:
  - build-image

build-image:
  stage: build-image
  only:
    - master
  cache:
    untracked: true
  script:
    - export DOCKER_CLI_EXPERIMENTAL=enabled
    ########################################
    - docker buildx version
    - docker run --rm --privileged docker/binfmt:66f9012c56a8316f9244ffd7622d7c21c1f6f28d
    - ls -al /proc/sys/fs/binfmt_misc
    - docker buildx create --use --name mybuilder2 --config=/home/${USER}/.docker/buildx/config.toml
    - docker buildx inspect mybuilder2 --bootstrap
    - docker buildx ls
    # 上面的只需要第一次执行即可，后面就不需要执行了。
    - docker login -u dockeruser -p $DOCKER_PWD inner.test.ifuncun.cn:8082
    - docker buildx build -t inner.test.ifuncun.cn:8082/pytest:$CI_PIPELINE_ID --platform=linux/arm64,linux/amd64 . --push
  artifacts:
    expire_in: 10 days
    paths:
      - out/
  tags:
    - imagebuilder3
```