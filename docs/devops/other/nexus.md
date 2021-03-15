# Nexus

一站式私有仓库管理（NuGet、Maven、npm、Docker、go等）

## Nexus安装

```bash
docker run -d -p 8083:8081 -p 8082:8082 -v $PWD/data:/nexus-data --restart=always --name nexus sonatype/nexus3
```

* 8082 端口的映射目的是为了推送 docker 镜像。
* 如果运行的时候提示没有权限创建目录、文件，需要修改文件夹权限
    
    ```bash
    chmod 777 $PWD/data
    ```

安装完成之后直接访问  http://ip:8083 登陆

登陆账号admin，密码在data目录的 admin.password 中


## Docker镜像仓库

在 Repositories 功能中创建 docker 的私有仓库 DockerTest ,仓库模板选择 docker(hosted) 

![1](http://cdn.go99.top/docs/devops/other/nexus1.jpg)

* 勾选 http，设置端口为 8082 ，此处的端口为创建 Nexus 容器时设置的 8082 端口 ；
* 勾选允许匿名拉取镜像；
* 勾选运行客户端通过 API 访问。

在 Nexus 的 Realms 模块进行设置，将 Docker Bearer Token Realm 选到右边的 Active 栏中。

![2](http://cdn.go99.top/docs/devops/other/nexus2.jpg)

在 CentOS 7 系统中安装 Docker ，然后再 /etc/docker/ 目录中创建 daemon.json 文件，内容如下：

```json
{
   "insecure-registries": ["aa.bb.cc:8083"]
}
```

执行下面命令进行配置的加载。

```bash
systemctl daemon-reload
systemctl restart docker
```

在 root 目录中创建 nexus-docker 目录，目录中创建 Dockerfile 文件用来构建一个新的镜像，内容如下：

```bash
FROM nginx:latest
COPY . /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

执行下面命令进行镜像的构建和推送到服务端。

```bash
# 构建镜像
docker build -t nexus-docker .
# 将镜像 tag 成服务端的地址
docker tag nexus-docker-test:latest aa.bb.cc:8082/nexus-docker-test:latest
# 进行登录 
docker login -u test -p 000000 aa.bb.cc:8082
# 推送镜像
docker push aa.bb.cc:8082/nexus-docker-test:latest
```

使用镜像的时候，只要服务器进行了第三步中的地址注册，就可以使用 docker pull aa.bb.cc:8082/nexus-docker-test:latest 进行镜像拉取。
