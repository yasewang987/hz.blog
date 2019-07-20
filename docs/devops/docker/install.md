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
