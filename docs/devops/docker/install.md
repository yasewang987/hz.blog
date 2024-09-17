# Docker安装

## 安装
* 参考docker官网教程：
  > https://docs.docker.com/  
  > Ubuntu: 其实可以直接使用命令`sudo apt install docker.io`直接安装
  <!-- more -->
  > CentOS: 
     1. 查看linux内核版本：`uname -r`
          > 3.10 版本的内核，可能无法正常运行 18.06.x 及以上版本的 docker（解决方法：升级内核或者降低 docker 版本），可能报下面的错误：  
          docker: Error response from daemon: OCI runtime create failed: container_linux.go:344: starting container process caused "process_linux.go:293: copying bootstrap data to pipe caused "write init-p: broken pipe"": unknown. 
     1. 安装Docker
          ```bash
          # 更新到最新 yum 包
          yum update -y

          # 卸载旧版本（如果安装过旧版本的话）
          yum remove docker docker-common docker-selinux docker-engine docer-io

          # 安装需要的软件包
          # yum-util 提供 yum-config-manager 功能， 另外两个是 devicemapper 驱动依赖
          yum install -y yum-utils device-mapper-persistent-data lvm2

          # 设置 yum 源
          yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

          # 查看所有仓库中所有 docker 版本，并选择特定版本安装
          yum list docker-ce --showduplicates | sort -r

          # 由于 repo 中默认只开启 stable 的仓库，故这里安装的是最新稳定版（18.09.2）
          # 由于内核是 3.10 无法正常运行 18.06.x 及以上版本的 docker，所以不这么安装
          # yum install -y docker-ce

          # 经过测试发现，3.10 内核可以运行 18.03.1.ce
          # yum install -y <FQPN>
          yum install -y docker-ce-18.03.1.ce

          # 启动并加入开机启动
          systemctl start docker
          systemctl enable docker

          # 验证安装是否成功（有 client 和 service 两部分表示 docker 安装启动都成功了）
          docker version
          ```
     1. `yum install -y docker-ce-18.03.1.ce` 失败
          ```bash
          Transaction check error:
               file /usr/bin/docker from install of docker-ce-18.03.1.ce-1.el7.centos.x86_64 conflicts with file from package docker-common-2:1.12.6-68.gitec8512b.el7.centos.x86_64
               file /usr/bin/docker-containerd from install of docker-ce-18.03.1.ce-1.el7.centos.x86_64 conflicts with file from package docker-common-2:1.12.6-68.gitec8512b.el7.centos.x86_64
               file /usr/bin/docker-containerd-shim from install of docker-ce-18.03.1.ce-1.el7.centos.x86_64 conflicts with file from package docker-common-2:1.12.6-68.gitec8512b.el7.centos.x86_64
               file /usr/bin/dockerd from install of docker-ce-18.03.1.ce-1.el7.centos.x86_64 conflicts with file from package docker-common-2:1.12.6-68.gitec8512b.el7.centos.x86_64
          ```
          * 如果出现上面的报错，需要卸装旧版本：`yum erase docker-common-2:1.12.6-68.gitec8512b.el7.centos.x86_64`，再安装其他版本：`yum install -y docker-ce-18.03.1.ce`

* 修改国内镜像源
  1. 登录阿里云管理控制台
  1. 打开镜像加速器里面会有教程
  1. 通过修改daemon配置文件`/etc/docker/daemon.json`来使用加速器(如果没有新建文件)
     ```bash
     sudo mkdir -p /etc/docker
     sudo vim /etc/docker/daemon.json
     {
          "registry-mirrors": ["https://hs89vff4.mirror.aliyuncs.com"]
          # 获取使用中国的Image仓库：https://registry.docker-cn.com
     }
     sudo systemctl daemon-reload
     sudo systemctl restart docker
     ```
* 国内镜像仓库
  > 镜像仓库可以自己搭建私人仓库，也可以使用国内阿里云等提供的镜像仓库。
  1. 阿里云容器服务-镜像仓库（根据教程操作即可）

## docker离线安装

* arm版本下载地址: https://download.docker.com/linux/static/stable/aarch64/
* amd版本滴在地址：https://download.docker.com/linux/static/stable/x86_64/

```bash
# 解压压缩包
tar -zxvf docker-20.10.9.tgz

# 转移到执行目录
cp -p docker/* /usr/bin

# 创建docker.service
cat >/usr/lib/systemd/system/docker.service <<EOF 
[Unit] 
Description=Docker Application Container Engine 
Documentation=http://docs.docker.com 
After=network.target docker.socket 
[Service] 
Type=notify 
EnvironmentFile=-/run/flannel/docker 
WorkingDirectory=/usr/local/bin 
ExecStart=/usr/bin/dockerd  -H tcp://0.0.0.0:4243 -H unix:///var/run/docker.sock --selinux-enabled=false --log-opt max-size=1g 
ExecReload=/bin/kill -s HUP $MAINPID 
# Having non-zero Limit*s causes performance problems due to accounting overhead 
# in the kernel. We recommend using cgroups to do container-local accounting. 
LimitNOFILE=infinity 
LimitNPROC=infinity 
LimitCORE=infinity 
# Uncomment TasksMax if your systemd version supports it. 
# Only systemd 226 and above support this version. 
#TasksMax=infinity 
TimeoutStartSec=0 
# set delegate yes so that systemd does not reset the cgroups of docker containers 
Delegate=yes 
# kill only the docker process, not all processes in the cgroup 
KillMode=process 
Restart=on-failure 
[Install] 
WantedBy=multi-user.target 
EOF

# 启动服务
systemctl start docker

# 开机启动
systemctl enable docker

# 关闭selinux
setenforce=0
# 永久关闭，设置SELINUX=disabled
vim /etc/selinux/config
```

## Docker-Compose安装

参考资料，选择plugin方式安装：https://docs.docker.com/compose/install/

```bash
#### 在线
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

apt-get install docker-compose-plugin


### 离线
curl -L "https://github.com/docker/compose/releases/download/v2.26.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

## docker容器使用显卡驱动

* 安装 [nvidia container toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html#installing-on-ubuntu-and-debian)
    
```bash
# dockeer19.03版本之后只需要安装 `nvidia-container-toolkit` 即可

#### ubuntu
# 如果安装不成功，可以一步一步执行，到第二行的时候如果报错，根据报错点开github网页，参考网页上的去安装执行
distribution=$(. /etc/os-release;echo $ID$VERSION_ID) \
    && curl -s -L https://nvidia.github.io/nvidia-container-runtime | sudo apt-key add -

# 安装
sudo apt-get update \
    && sudo apt-get install -y nvidia-container-runtime

#### centos
distribution=$(. /etc/os-release;echo $ID$VERSION_ID) \
&& curl -s -L https://nvidia.github.io/nvidia-container-runtime/$distribution/nvidia-container-runtime.list | \
&& sudo tee /etc/apt/sources.list.d/nvidia-container-runtime.list

sudo yum install -y nvidia-container-runtime

# 重启容器
systemctl daemon-reload
systemctl restart docker
# 验证
sudo docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi
# 指定使用显卡1
sudo docker run --rm --gpus "device=1,2" nvidia/cuda:11.0-base nvidia-smi
```

* 查看内核显卡版本：`cat /proc/driver/nvidia/version`
* 查看安装的显卡驱动信息： `dpkg --list | grep nvidia`

执行如下命令确认是否安装成功，如果有显卡信息展示说明成功：

```bash
nvidia-smi
```

## 离线安装nvidia-container-runtime

### centos
```bash
# 在上网机更新nvidia-container-runtime的yum源
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-container-runtime/$distribution/nvidia-container-runtime.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-container-runtime.list
# 离线下载nvidia-container-runtime安装包
yum install nvidia-container-runtime --downloadonly --downloaddir=./

# 无序安装
sudo rpm -ivh ./* --nodeps

systemctl restart docker
# 验证
sudo docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi
```

### ubuntu

离线包地址：https://mirror.cs.uchicago.edu/nvidia-docker/libnvidia-container/stable/ubuntu20.04/amd64/

```bash
# 一般依赖如下几个东西
libnvidia-container1_1.8.1-1_amd64.deb
libnvidia-container-tools_1.8.1-1_amd64.deb
nvidia-container-toolkit_1.8.1-1_amd64.deb
nvidia-container-runtime_3.8.1-1_all.deb

# 配置文件调整  
cat /etc/docker/daemon.json
{
    "default-runtime": "nvidia",
    "runtimes": {
        "nvidia": {
            "path": "/usr/bin/nvidia-container-runtime",
            "runtimeArgs": []
        }
    }
}
```

## ubuntu离线安装nvidia-container-toolkit

参考：https://nvidia.github.io/nvidia-container-runtime/

```bash
curl -s -L https://nvidia.github.io/nvidia-container-runtime/gpgkey | \
  sudo apt-key add -
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-container-runtime/$distribution/nvidia-container-runtime.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-container-runtime.list
sudo apt-get update

# 下载nvidia-container-toolkit安装包
# 默认下载目录：/var/cache/apt/archives/
apt install nvidia-container-toolkit --download-only
apt-get download package_name


# 拷贝下载目录下的所有deb包，然后复制到离线机器，执行如下命令
dpkg -i ./*.deb

#### 如果遇到如下报错
GPG error: https://developer.download.nvidia.cn/compute/cuda/repos/ubuntu1804/x86_64 InRelease: The following signatures couldnt be verified because the public key is not available: NO_PUBKEY A4B469963BF863CC
# 则执行后面的，需要将命令中的密钥替换为出现在错误消息中的实际密钥
apt-key adv --keyserver keyserver.ubuntu.com --recv-keys A4B469963BF863CC
apt-get update
# 如果上面提示 gnupg 没有安装 gnupg1或2
apt install gnupg1
```

* 递归下载所有依赖包

```bash
#!/bin/bash

logfile=$PWD/log

ret=""

function getDepends() {
    echo "fileName is" $1 >>$logfile
    # use tr to del < >
    ret=$(apt-cache depends $1 | grep Depends | cut -d: -f2 | tr -d "<>")
    echo $ret | tee -a $logfile
}

# 需要获取其所依赖包的包
libs="docker-ce" # 或者用$1，从命令行输入库名字

# download libs dependen. deep in 3

i=0

while [ $i -lt 3 ]; do
    let i++
    echo $i
    # download libs
    newlist=" "
    for j in $libs; do
        added="$(getDepends $j)"
        newlist="$newlist $added"
        apt install $added --reinstall -d -y
    done
    libs=$newlist
done
```

## 私有镜像仓库-registry

```bash
# 安装
docker run --restart=always -d -p 5000:5000 -v /opt/fc/registry:/var/lib/registry --name myregistry registry

# 查看镜像仓库中的镜像列表
curl http://localhost:5000/v2/_catalog
# 列出指定镜像的所有标签
curl http://localhost:5000/v2/<imagename>/tags/list

# 设置docker使用私有仓库
cat <<EOF > /etc/docker/daemon.json
{
  "insecure-registries": ["10.10.10.10:5000"]
}

# 要将镜像推送到私有仓库，需要修改镜像名称
docker tag <image>:<tag> 10.10.10.10:5000/<image>:<tag>
docker push 10.10.10.10:5000/<image>:<tag>
```
