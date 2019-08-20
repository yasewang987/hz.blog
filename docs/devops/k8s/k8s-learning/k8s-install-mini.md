# K8s - Minikube

## Minikube - Kubernetes本地实验环境

* [参考资料地址](https://yq.aliyun.com/articles/221687)

### 先决条件

* 需要先安装`kubectl`(最好使用root用户安装，不然可能有权限问题):

    ```bash
    # arch linux
    pacman -Ss kubectl # 查看包名
    pacman -S kubectl # 安装kubectl

    # centos
    yum search kubectl # 查看包名
    yum install kubernetes-client.x86_64 # 安装kubectl

    # ubuntu
    apt-get search kubectl
    apt-get install kubectl
    ```
* 安装`minikube`,Minikube在不同操作系统上支持不同的驱动

    ```bash
    # linux
    VirtualBox 或 KVM
    ```
    > **NOTE:** Minikube 也支持 --vm-driver=none 选项来在本机运行 Kubernetes 组件，这时候需要本机安装了 Docker。在使用 0.27版本之前的 none 驱动时，在执行 minikube delete 命令时，会移除 /data 目录，请注意，问题说明；另外 none 驱动会运行一个不安全的API Server，会导致安全隐患，不建议在个人工作环境安装
* 由于minikube复用了docker-machine，在其软件包中已经支持了相应的VirtualBox, VMware Fusion驱动
* VT-x/AMD-v 虚拟化必须在 BIOS 中开启
* 在Windows环境下，如果开启了Hyper-V，不支持VirtualBox方式

### 安装minikube

```bash
curl -Lo minikube http://kubernetes.oss-cn-hangzhou.aliyuncs.com/minikube/releases/v1.2.0/minikube-linux-amd64 && chmod +x minikube && sudo mv minikube /usr/local/bin/
```

* 如果要使用最新的版本，可以Github上获取项目自行构建
* 需要本地已经安装配置好 Golang 开发环境和Docker引擎

```bash
git clone https://github.com/AliyunContainerService/minikube
cd minikube
git checkout aliyun-v1.2.0
make
sudo cp out/minikube /usr/local/bin/
```

### 启动minikube

```bash
# 缺省Minikube使用VirtualBox驱动来创建Kubernetes本地环境,这里使用docker启动`vm-driver=none`
minikube start --registry-mirror=https://registry.docker-cn.com --vm-driver=none

# 启动之后需要检查所有pod是否正常运行
kubectl -n kube-system get pods

# 打开控制台(这个只有在minikube的安装机器上才可以用)
minikube dashboard

# 安装Kubernetes v1.12.1
minikube start --registry-mirror=https://registry.docker-cn.com --kubernetes-version v1.12.1

# 打开局域网访问dashboard功能(如果防火墙开启需要把8001端口放开)
kubectl proxy --address='0.0.0.0' --disable-filter=true
```

* 开启局域网访问之后访问地址 http://your_api_server_ip:8001/api/v1/namespaces/kube-system/services/http:kubernetes-dashboard:/proxy/ 即可。

### minikube更新

如需更新minikube，需要更新 minikube 安装包  
`minikube delete` 删除现有虚机，删除 `~/.minikube` 目录缓存的文件  
重新创建 minikube 环境

### minikube运行原理

![1](./img/install-1.jpeg)
