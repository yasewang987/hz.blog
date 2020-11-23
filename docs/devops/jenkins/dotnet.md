
# Asp.Net Core + Jenkins 持续集成部署实践

`Jenkins` 是一款流行的开源持续集成（CI）与持续部署（CD）工具，广泛用于项目开发，具有自动化构建、测试和部署等功能，很多公司已经在使用`Jenkins`来代替人工发布了。

## 这次目标

1. `Docker` 中安装 `Jenkins`。
1. 使用`Jenkins`管理`Asp.net Core`应用程序，实现持续集成部署。

## Docker安装Jenkins

> Jenkins镜像地址：https://hub.docker.com/r/jenkins/jenkins  
> Jenkins使用文档: https://jenkins.io/zh/doc/book/installing/#%E5%9C%A8docker%E4%B8%AD%E4%B8%8B%E8%BD%BD%E5%B9%B6%E8%BF%90%E8%A1%8Cjenkins

1. 下载镜像：

    ```bash
    sudo docker pull jenkins/jenkins
    ```
    * 也可以使用`jenkinsci/blueocean`镜像
1. 启动jenkins容器

    ```bash
    sudo docker run -d --name jenkins \ 
    -p 13333:8080 -p 50000:50000 \
    -v $HOME/jenkins_home:/var/jenkins_home \
    -v /var/run/docker.sock:/var/run/docker.sock \
    jenkins/jenkins
    ```
    * 注意如果想在重启容器的时候保持`Jenkins`状态，需要将容器的`/var/jenkins_home`目录映射到宿主机的目录`jenkins_home`（这里使用的是服务器的用户目录下的`jenkins_home`，不然有可能出现权限问题）。  
    * 由于jenkins官方的镜像是基于`debian`linux的，所以可能在运行了`jenkins`容器的时候无法正常使用docker命令（映射了`/var/run/docker.sock`也无法使用）。在测试的时候我也遇到了这个问题，有2种方法可以解决这个问题：  
        一、 自己做一个基于centos或其他的linux的jenkins镜像  
        二、 使用`jenkins`中的`SSH`连接到服务器执行`docker`命令

1. 解锁`Jenkins`,访问`http://localhost:13333`,解锁密码在可以查看`jenkins`容器的`/var/jenkins_home/secrets/initialAdminPassword`文件内容
    ![img](http://cdn.go99.top/docs/devops/jenkins/dotnet1.png)
1. 选择需要安装的插件
    ![img](http://cdn.go99.top/docs/devops/jenkins/dotnet2.png)
    > Generic WebHook Trigger => 触发WebHook必备  
    MSTest & xUnit => 进行基于MSTest或基于xUnit的单元测试  
    Nuget Plugin => 拉取Nuget包必备  
    Pipeline => 实现Pipeline任务必备，建议将Pipeline相关插件都安装上  
    Publish Over SSH => 远程ssh  
    WallDisplay => 电视投屏构建任务列表必备  
    Email Extension => 发送邮件

## CI/CD持续集成部署

一、新建一个webapi项目：`dotnet new webapi -n jenkinsTest --no-https`

二、新建`Dockerfile`：`touch Dockerfile`

三、修改`Dockerfile`内容如下：

    ```Dockerfile
    # 编译
    FROM microsoft/dotnet:2.2-sdk AS build
    WORKDIR /src
    COPY . /src
    RUN dotnet publish "jenkinsTest.csproj" -o /out -c Release

    # 生成镜像
    FROM microsoft/dotnet:2.2-aspnetcore-runtime
    WORKDIR /app
    COPY --from=build /out .
    EXPOSE 10002
    ENTRYPOINT [ "dotnet", "jenkinsTest.dll" ]
    ```

### 方案1：集成部署全部在发布服务器

1. 配置全局ssh：
    ![img](http://cdn.go99.top/docs/devops/jenkins/dotnet3.png)

1. 新建job：`jenkinsTest`

1. 配置job里的git：
    ![img](http://cdn.go99.top/docs/devops/jenkins/dotnet3-1.png)
    ![img](http://cdn.go99.top/docs/devops/jenkins/dotnet3-2.png)
    **我这边使用https连接，需要点击`Add`填写`github`的账号密码。最好还是使用`ssh`的方式。**
1. 选择触发方式
    ![img](http://cdn.go99.top/docs/devops/jenkins/dotnet3-3.png)
    * 自己选择需要哪个的构建触发方式，如果需要`Generic WebHook Trigger`需要安装这个插件

1. 配置job里的ssh：
    ![img](http://cdn.go99.top/docs/devops/jenkins/dotnet3-4.png)
    > `Source files`：指需要将哪些文件拷贝到目标位置（相对于当前项目位置,这里指：`/var/jenkins_home/workspace/jenkinsTest`）  
    > `Remote directory`：相对于全局配置`remote directory`中的位置，这里指的位置就是：`/jenkins_websites/jenkinsTest`
    > 注意：由于在使用docker构建镜像的时候在没有缓存镜像时会比较慢，这里需要将执行超时设置长一点。
    ![img](http://cdn.go99.top/docs/devops/jenkins/dotnet3-5.png)

1. 测试运行：
    ![img](http://cdn.go99.top/docs/devops/jenkins/dotnet4.png)
    ![img](http://cdn.go99.top/docs/devops/jenkins/dotnet4-1.png)
    ![img](http://cdn.go99.top/docs/devops/jenkins/dotnet4-2.png)

1. 上面这5步中看到要执行的命令都写在了`Exec command`中，其实也可以在项目中添加`deploy.sh`文件，然后`Exec command`中调用一下`deploy.sh`即可。

    ```bash
    # deploy.sh
    cd /jenkins_websites/jenkinsTest
    image_version=`date +%Y%m%d%H%M`
    echo $image_version;
    if [ $(docker ps --format {{.Names}} | grep jenkinstest) ]
    then
        docker rm -f jenkinstest
    fi
    docker build -t jenkinstest:$image_version .
    docker run -d -p 10002:80 --name jenkinstest jenkinstest:$image_version
    ```

    ```bash
    # Exec commond
    sh /jenkins_websites/jenkinsTest/deply.sh
    ```
1. 执行结果：
    ![img](http://cdn.go99.top/docs/devops/jenkins/dotnet4-3.png)

### 方案2：使用阿里云打包镜像、发布服务器拉取镜像运行容器

#### 阿里云打包镜像

1. 登录阿里云-》选择容器镜像服务-》创建空间（一般用公司名做空间）
1. 创建仓库
    ![img](http://cdn.go99.top/docs/devops/jenkins/dotnet5.png)
1. 绑定github账号
    ![img](http://cdn.go99.top/docs/devops/jenkins/dotnet6.png)
1. 选择代码变更自动构建
1. 进入创建好的仓库选择构建
    ![img](http://cdn.go99.top/docs/devops/jenkins/dotnet7.png)
1. 查看构建日志
    ![img](http://cdn.go99.top/docs/devops/jenkins/dotnet8.png)
1. 查看镜像版本
    ![img](http://cdn.go99.top/docs/devops/jenkins/dotnet9.png)
1. 设置触发器（由于我没有将jenkins映射到外网，这里就不继续了），只需要将触发器的url设置成jenkins的外网的触发url即可（jenkins里要安装`Generic WebHook Trigger`插件，并做相关配置）

#### 发布服务器配置

只需要将jenkins的`Exec commond`脚本改为如下内容即可

```bash
# 拉取最新镜像
docker pull registry.cn-hangzhou.aliyuncs.com/mor/jenkinstest
# 打标记
image_version=`date +%Y%m%d%H%M`
docker tag registry.cn-hangzhou.aliyuncs.com/mor/jenkinstest jenkinstest:$image_version
# 删除旧容器
if [ $(docker ps --format {{.Names}} | grep jenkinstest) ]
then
    docker rm -f jenkinstest
fi
# 启动新容器
docker run --restart=always --name jenkinstest jenkinstest:$image_version
# 删除没有用的镜像
docker rmi registry.cn-hangzhou.aliyuncs.com/mor/jenkinstest
docker rmi $(docker images | grep none | awk '{print $3}')
```

#### 总结执行流程

1. git仓库代码变化
1. 阿里云容器构建服务启动
1. 构建好镜像之后触发webhook
1. jenkins收到阿里云的webhook之后触发job执行部署脚本
1. 部署脚本使用阿里云镜像run起来