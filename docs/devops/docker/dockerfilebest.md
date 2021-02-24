# Dockerfile最佳实践

## 选择基础镜像

* 使用官方提供的基础镜像(offical)
* 基础镜像应该提供足够的支持，使得Dockerfile尽量简单 (easy enough)
* 基础镜像要足够精简，尽量不要包含不需要的内容（simple enough）
* 使用指定标签（版本）的基础镜像，不使用latest标签的基础镜像 （explicit）

## 把最少改动的步骤放在最前面

也就是准备应用的**COPY步骤要放在安装工具和准备环境的RUN命令之后**，能够重用前面构建的层的cache，防止每次都要重复构建。

Dockerfile的步骤中只有 `RUN、COPY、ADD` 才会创建层，其它指令的先后顺序主要是根据Dockerfile的语法、逻辑结构和习惯。

```dockerfile
# 选择基础镜像，比如：
FROM openjdk:8-jdk-stretch

# 安装Dockerfile后面步骤需要用到的工具和docker execdebug时需要用到的工具，比如：
RUN apt-get update && apt-get upgrade -y && apt-get install -y git curl && rm -rf /var/lib/apt/lists/*
# 其他的一些准备环境步骤，比如：
RUN curl -fsSL ${JENKINS_URL} -o /usr/share/jenkins/jenkins.war \
&& echo "${JENKINS_SHA} /usr/share/jenkins/jenkins.war" | sha256sum -c -

# 准备应用，比如：
COPY jenkins.sh /usr/local/bin/jenkins.sh

# 声明程序的入口点，比如：
ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/jenkins.sh"]

# 暴露端口，比如：
EXPOSE 8080
```

> ADD和COPY: 推荐使用更为简单的COPY指令。ADD命令虽然可以提供额外的下载和解压等功能，但是下载可以通过curl命令，解压可以通过tar -zxvf指令来操作。

参考文档：https://github.com/jenkinsci/docker/blob/master/Dockerfile

## 减少Docker镜像层的数量

Dokcerfile中的RUN、COPY和ADD命令才会创建镜像层，因此减少Docker镜像层的数量就是要减少这几个命令的次数，特别是RUN命令的次数。

在安装工具时可以在一句命令中安装多个工具：

```dockerfile
# 正例：
apt-get install -y git curl
#反例：
apt-get install -y git
apt-get install -y curl

# 用&&拼接多个命令：
# 正例：
RUN apt-get update && apt-get upgrade -y && apt-get install -y git curl
# 反例：
RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get install -y git curl

# 用\来在拼接多个命令时换行，增加可读性
RUN curl -fsSL https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini-static-$(dpkg --print-architecture) -o /sbin/tini \
&& curl -fsSL https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini-static-$(dpkg --print-architecture).asc -o /sbin/tini.asc \
&& gpg --no-tty --import ${JENKINS_HOME}/tini_pub.gpg \
&& gpg --verify /sbin/tini.asc \
&& rm -rf /sbin/tini.asc /root/.gnupg \
&& chmod +x /sbin/tini
```

## Docker构建上下文中不要包含不需要的文件

运行 `docker build [options] PATH` 构建Docker镜像时，Docker会将PATH路径下的全部内容作为构建上下文传给Docker Daemon。

如果PATH路径下的内容太多，会导致镜像构建很慢，如果Dockerfile书写不当，还会引入不必要的文件，从而导致镜像变大，影响镜像构建和拉取速度。可以通过 `.dockerignore` 文件在Docker构建时不要将指定内容包含在构建上下文中。

.dockerignore例子：

```bash
# ignore .git and .cache folders
.git
.cache
# ignore all *.class files in all folders, including build root
**/*.class
# ignore all markdown files (md)
*.md
```
还可以将Dockerfile和制品包（比如.jar）放到一个干净的新目录下，再来构建镜像.

参考文档：

https://docs.docker.com/engine/reference/builder/#dockerignore-file
https://codefresh.io/docker-tutorial/not-ignore-dockerignore/

## 多阶段构建

Docker提供了多阶段构建（multistag-builds）的功能，但是一般在做多阶段构建时不需要这么复杂，只需要分成以下2步：

1. 先构建出应用制品包，比如用Maven构建出应用的.jar包
1. 在docker build构建Docker镜像时，将上一步生成的.jar包复制到镜像中

## 一次构建，多环境运行

在Dockerfile中使用`ENV`指令定义环境变量并可设置缺省值，通过`docker run -e`指定运行时环境变量。

## 使用专门的user和group

如果不以root用户来运行应用，则可以使用专门的user和group。

以Jenkins为例，Jenkins镜像使用了jenkins(1000)/jenkins(1000)的user(uid)/group(gid):

```dockerfile
ARG user=jenkins
ARG group=jenkins
ARG uid=1000
ARG gid=1000
ARG JENKINS_HOME=/var/jenkins_home

RUN mkdir -p $JENKINS_HOME \
&& chown ${uid}:${gid} $JENKINS_HOME \
&& groupadd -g ${gid} ${group} \
&& useradd -d "$JENKINS_HOME" -u ${uid} -g ${gid} -m -s /bin/bash ${user}

USER ${user}
```
```bash
# 查看Jenkins的user／group信息：
# 进入容器
docker exec -it <cotainer_id> /bin/bash

# 查看user ／ group信息
cat /etc/passwd | grep jenkins

# 每行7个字段，以:隔开
# 1. Username: jenkins
# 2. Password: x表示加密的密码
# 3. User ID(UID): 1000
# 4. Group ID(GID): 1000
# 5. User ID Info: User描述信息
# 6. Home directory: Home目录
# 7. Command／Shell: Command或Shell的绝对路径，比如/bin/bash，为/bin/false表示不允许执行bash
jenkins:x:1000:1000:Linux User,,,:/var/jenkins_home:/bin/bash
```

## 容易混淆的Dockerfile的指令

1. ADD和COPY

    推荐使用更为简单的COPY指令。

    ADD命令虽然可以提供额外的下载和解压等功能，但是下载可以通过curl命令，解压可以通过tar -zxvf指令来操作。

    ```dockerfile
    # 可以从远程位置下载文件复制到容器中
    ADD https://www.python.org/ftp/python/3.5.1/python-3.5.1.exe /temp/python-3.5.1.exe
    ```

1. VOLUME

    在Dockerfile中VOLUME指令在docker run 时会在宿主机下的/var/lib/docker/volumes目录下新建`<volume_id>`的持久卷目录。如果是下次docker start时则会重用之前的持久卷。

    ```bash
    # 列出持久卷
    docker volume ls
    # 查看某个容器的持久卷
    docker inspect <container_id> | less
    # 查找Mounts关键字
    使用docker run -v可以在运行容器时指定持久卷目录，也可以使用已存在的目录。
    ```
1. CMD和ENTRYPOINT

    CMD语法：CMD ["executable", "param1", "param2"…]

    ENTRYPOINT语法：ENTRYPOINT ["executable", "param1", "param2"…]

    **Dockerfile中应该只包含一个CMD或一个ENTRYPOINT。**

    包含多个CMD时，只有最后一个CMD才会生效，并会让Dockerfile难懂。

    同时包含CMD和ENTRYPOINT时，CMD中的参数其实是ENTRYPOINT的参数，让Dockerfile难懂。
1. ARG和ENV

    ARG是构建时参数，通过 `docker build --build-arg arg=value` 指定。

    ENV是运行时参数，通过docker run -e var=value指定。

    在Dockerfile中也可以用ARG来给ENV赋值，例如：

    ```dockerfile
    ARG JENKINS_HOME=/var/jenkins_home
    ENV JENKINS_HOME $JENKINS_HOME

    ARG JENKINS_VERSION
    ENV JENKINS_VERSION ${JENKINS_VERSION:-2.121.1}
    ```

