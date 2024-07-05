# Kubernetes - 集群部署Kubeadm

官方参考地址：https://kubernetes.io/zh-cn/docs/setup/production-environment/tools/kubeadm/install-kubeadm/

搭建K8S环境有几种常见的方式如下：

（1）Minikube

Minikube是一个工具，可以在本地快速运行一个单点的K8S，供初步尝试K8S或日常开发的用户使用，不能用于生产环境。

安装参考：[K8s - Minikube](./k8s-install-mini.md)


（2）Kubeadm

Kubeadm是K8S官方社区推出的一套用于简化快速部署K8S集群的工具，Kubeadm的设计目的是为新用户开始尝试K8S提供一种简单的方法。

K8s官网安装参考：https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/

（3）二进制包

除了以上两种方式外，我们还可以通过从官方下载二进制包，手动部署每个组件组成K8S集群，这也是目前企业生产环境中广为使用的方式，但对K8S管理人员的要求较高。

本次学习实践我们主要借助Kubeadm工具搭建K8S集群，以便后续实践部署ASP.NET Core应用集群。

## 重启没有启动恢复

```bash
# 停止docker（参考docker常用命令）
# 关闭 swap（k8s不支持swap）
swapoff -a && sed -i 's/^.*swap/#&/g' /etc/fstab

# 查看状态（发现loaded状态没有启动成功）
systemctl status kubelet

# 重新启动
systemctl start kubelet
```

## 一、环境准备

我这边使用的是vmware，服务器版本用的是`ubuntu 18.04 server`，一共准备3台虚拟机，2核2G最基础的配置

名称|内存|ip|安装
---|---|---|---
xb-master|2G|99.99.99.100|docker,kubeadm,kubelet,kubectl
xb-node1|2G|99.99.99.101|docker,kubeadm,kubelet
xb-node2|2G|99.99.99.102|docker,kubeadm,kubelet

### 安装Containerd

```bash
# 可以通过安装docker自动安装containerd

# (如果已经安装docker)删除docker
apt-get remove docker docker-engine docker.io
systemctl disable docker.service --now

# 安装：https://github.com/containerd/containerd/blob/main/docs/getting-started.md

# 安装完之后
mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml
# 修改配置（cgroups-systemd）
  [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
    SystemdCgroup = true
# 重载沙箱（pause）镜像
[plugins."io.containerd.grpc.v1.cri"]
  sandbox_image = "registry.aliyuncs.com/google_containers/pause:3.9"

systemctl start containerd
```

### 其他准备工作（也可以参考k8s官网安装步骤）

```bash
#### 手动启用 IPv4 数据包转发
# 验证ipv4转发是否开启（1:已开启），没有开启的话按照如下步骤操作
sysctl net.ipv4.ip_forward
# 设置所需的 sysctl 参数，参数在重新启动后保持不变
cat <<EOF | tee /etc/sysctl.d/k8s.conf
net.ipv4.ip_forward = 1
EOF
# 应用 sysctl 参数而不重新启动
sysctl --system

#### 关闭 swap（k8s不支持swap）
swapoff -a && sed -i 's/^.*swap/#&/g' /etc/fstab
```

### 安装 kubelet kubeadm kubectl

版本：v1.30(如果需要的话可以配置一下阿里云镜像仓库)

```bash
apt-get update && apt-get install -y apt-transport-https ca-certificates curl gpg
# 下载用于 Kubernetes 软件包仓库的公共签名密钥。
mkdir -p -m 755 /etc/apt/keyrings
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.30/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
# 添加 Kubernetes apt 仓库
# 此操作会覆盖 /etc/apt/sources.list.d/kubernetes.list 中现存的所有配置。
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.30/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list
# 更新 apt 包索引，安装 kubelet、kubeadm 和 kubectl
apt-get update
apt-get install -y kubelet kubeadm kubectl
# 锁定其版本
apt-mark hold kubelet kubeadm kubectl
# 设置kubelet开机启动
sudo systemctl enable kubelet

### 阿里云配置（待更新）
curl https://mirrors.aliyun.com/kubernetes/apt/doc/apt-key.gpg | sudo apt-key add -
# 创建文件 `/etc/apt/sources.list.d/kubernetes.list` 添加如下内容：
deb https://mirrors.aliyun.com/kubernetes/apt/ kubernetes-xenial main
```

## 二、部署控制平面Master

过程中会用到一些列镜像文件，这些文件在 Google 的镜像仓库，可以通过 `kubeadm config images pull` 命令验证网络是否能够正常拉取镜像。国内环境，十有八九无法直接连接，可从其他镜像仓库下载，然后再修改镜像标签，以便启动相关 pod。

### 初始化控制平面节点

控制平面节点是控制平面组件运行的机器，包括etcd（集群数据库）和 API server （kubectl CLI与之通信）。

需要安装pod网络插件，才能使得集群 pod 间可以相互通信，必须在任何应用程序之前部署 pod 网络。此外，CoreDNS将不会在安装网络之前启动。kubeadm仅支持基于容器网络接口（CNI）的网络，有几个项目使用CNI提供了Kubernetes pod网络，其中一些还支持网络策略。有关可用网络加载项的完整列表，请参阅 [网络组件页面](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/#pod-network)。

另外，请注意，Pod网络不得与任何主机网络重叠，因为这可能会导致问题。如果发现网络插件的首选Pod网络与某些主机网络之间发生冲突，应为 `kubeadm init` 指定 `--pod-network-cidr` 参数配置网络网络，并在网络插件的YAML中修改相应信息。

这里选择 `calico` 网络，根据 calico 文档说明，我们需为 kubeadm init 指定 `--pod-network-cidr=192.192.0.0/16` 参数。现在运行 `kubeadm init <args>`

```bash
#### 初始化 或 重置（--kubernetes-version不设置默认用最新的）
kubeadm init --kubernetes-version v1.30.1 --apiserver-advertise-address=99.99.99.100 --pod-network-cidr=192.192.0.0/16 --image-repository registry.aliyuncs.com/google_containers
# 如果一切正常，安装成功，将输入类似下面的结果信息
Your Kubernetes control-plane has initialized successfully!

To start using your cluster, you need to run the following as a regular user:

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

Alternatively, if you are the root user, you can run:

  export KUBECONFIG=/etc/kubernetes/admin.conf

You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/

Then you can join any number of worker nodes by running the following on each as root:

kubeadm join 99.99.99.100:6443 --token xxxx.xxxxxx --discovery-token-ca-cert-hash sha256:xxxxxxxxxx
# 根据提示消息，依次执行以下命令：
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
# 注意记录输出结果中的 kubeadm join *** 信息，随后在添加工作节点到集群时需要用到，可以复制后暂存在某个地方。

# 稍微等几分钟之后就可以查看服务运行情况了
kubectl get services -n kube-system

#### 手动下载依赖的镜像包（直接用kubeadm会超时）
# 查看kubernetes版本
kubelet --version
# 使用 `kubeadm config images list` 查看需要的镜像
kubeadm config images list
# list
registry.k8s.io/kube-apiserver:v1.30.1
registry.k8s.io/kube-controller-manager:v1.30.1
registry.k8s.io/kube-scheduler:v1.30.1
registry.k8s.io/kube-proxy:v1.30.1
registry.k8s.io/coredns/coredns:v1.11.1
registry.k8s.io/pause:3.9
registry.k8s.io/etcd:3.5.12-0
# 新建`pullk8s.sh`文件，添加如下内容，并且执行拉取需要的镜像
for  i  in  `kubeadm config images list`;  do
  imageName=${i#registry.k8s.io/}
  docker pull registry.aliyuncs.com/google_containers/$imageName
  docker tag registry.aliyuncs.com/google_containers/$imageName registry.k8s.io/$imageName
  docker rmi registry.aliyuncs.com/google_containers/$imageName
done;
# 拉取镜像
chmod +x pullk8s.sh
sh pullk8s.sh
#----------------------------------
  ```

### 安装网络

1. 通过 `kubectl get pods --all-namespaces` 命令，应该可以看到 `CoreDNS pod` 处于 pending 状态，安装网网络以后，它才能处于 running 状态。我们选择 calico 为 pod 提供网络，pod 网络组件本身以 k8s 应用的形式运行，执行下面命令进行安装

```bash
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.28.0/manifests/tigera-operator.yaml
# 这里需要注意一下需要把yaml文件下载下来，然后修改网路192.192.0.0/16，要与kubeadm init 中设置的一致。
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.28.0/manifests/custom-resources.yaml
# 查看网络运行状态（确保所有的pod都是running状态）
kubectl get pods -n calico-system
# 删除管理节点不允许调度的限制
kubectl taint nodes --all node-role.kubernetes.io/control-plane-
# 查看节点状态是否能看到
kubectl get nodes -o wide
NAME              STATUS   ROLES    AGE   VERSION   INTERNAL-IP   EXTERNAL-IP   OS-IMAGE             KERNEL-VERSION    CONTAINER-RUNTIME
<your-hostname>   Ready    master   52m   v1.12.2   10.128.0.28   <none>        Ubuntu 18.04.1 LTS   4.15.0-1023-gcp   docker://18.6.1
```
1. 安装了pod网络后，可以通过`kubectl get pods --all-namespaces`检查 CoreDNS pod 是否在输出中运行来确认它是否正常工作(这里需要等几分钟)

```bash
NAME                                       READY   STATUS    RESTARTS   AGE
calico-kube-controllers-65b8787765-gqxxg   1/1     Running   0          157m
calico-node-dwr6k                          1/1     Running   0          157m
coredns-bccdc95cf-hxqb6                    1/1     Running   0          163m
coredns-bccdc95cf-w5w45                    1/1     Running   0          163m
etcd-xb-master                             1/1     Running   0          162m
kube-apiserver-xb-master                   1/1     Running   0          162m
kube-controller-manager-xb-master          1/1     Running   0          162m
kube-proxy-kzvn4                           1/1     Running   0          163m
kube-scheduler-xb-master                   1/1     Running   0          162m
```

## 三、加入工作节点Node

CoreDNS pod 启动并运行后，我们可以为集群添加工作节点。工作节点服务器需安装 `containerd 、kubeadm 、kubelet`，安装过程请参考 master 节点部署流程

### 拉取镜像

工作节点服务器需要至少启动两个 pod ，用到的镜像为 `kube-proxy 、 pause` ，同理我们无法直接从 k8s.grc.io 下载，需要提前拉取镜像并修改 tag ，执行下面命令：

```bash
for  i  in  `kubeadm config images list`;  do
  imageName=${i#k8s.gcr.io/}
  docker pull registry.aliyuncs.com/google_containers/$imageName
  docker tag registry.aliyuncs.com/google_containers/$imageName k8s.gcr.io/$imageName
  docker rmi registry.aliyuncs.com/google_containers/$imageName
done;
```

### 加入集群

* 注意，如果需要重新执行 `kubeadm join` ，需在控制平面节点删除该节点 `kubectl delete node node-name`，并在工作节点上执行 `kubeadm reset` 进行清理工作。

```bash
kubeadm join <master-ip>:<master-port> --token <token> --discovery-token-ca-cert-hash sha256:<hash>
# 在控制平面节点检查查看pod状态
watch kubectl get pods --all-namespaces -o wide

# 如果忘记 token 和 discovery-token-ca-cert-hash 可以通过如下方法查看
# 默认情况下，令牌会在 24 小时后过期。
kubeadm token list
openssl x509 -pubkey -in /etc/kubernetes/pki/ca.crt | openssl rsa -pubin -outform der 2>/dev/null | \
openssl dgst -sha256 -hex | sed 's/^.* //'

# 重新生成token
kubeadm token create
```

### 检查工作节点

工作节点加入集群后，随着工作节点上相应 pod 的正常启动，工作节点状态会由 `NotReady` 切换到 `Ready`，Pod 启动需要时间，请耐心等待。所有节点正常加入集群后，可以通过命令查看节点状态：

```bash
kubectl get nodes

#结果
NAME        STATUS   ROLES    AGE     VERSION
xb-master   Ready    master   7h37m   v1.15.2
xb-node1    Ready    <none>   17m     v1.15.2
xb-node2    Ready    <none>   16m     v1.15.2
```

## 四、安装Dashboard

Dashboard的版本与k8s要匹配，具体的版本对应关系查看dashboard的 [dashboard github release](https://github.com/kubernetes/dashboard/releases) 介绍

1. 由于我们用的是1.15.2版本的k8s,那就下载最新的dashboard

    ```bash
    wget https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0-beta3/aio/deploy/recommended.yaml
    ```

1. 修改配置文件`recommended.yaml`

    ```bash
    vim recommended.yaml
    ```

    ```yaml
    kind: Service
    apiVersion: v1
    metadata:
      labels:
        k8s-app: kubernetes-dashboard
      name: kubernetes-dashboard
      namespace: kubernetes-dashboard
      annotations:
        kubernetes.io/ingress.class: traefik
    spec:
      type: NodePort   # here
      ports:
        - port: 443
          targetPort: 8443
          nodePort: 30001 # here
      selector:
        k8s-app: kubernetes-dashboard
    ```
1. 创建dashboard

    ```bash
    kubectl apply -f recommended.yaml
    ```
1. 等几分钟，查看dashboard运行状态

    ```bash
    kubectl get pods -n kubernetes-dashboard

    # 输出
    NAME                                        READY   STATUS    RESTARTS   AGE
    dashboard-metrics-scraper-fb986f88d-szz7f   1/1     Running   0          88m
    kubernetes-dashboard-7d8b9cc8d-g2cvt        1/1     Running   0          88m
    ```
1. 使用firefox浏览器访问（chrome不行）

    ```text
    https://99.99.99.101:30001
    ```
1. 看到了登录界面，需要我们配置kubeconfig或输入token，这里我们选择后者，通过以下命令获取输出的token

    ```bash
    kubectl create serviceaccount dashboard-admin -n kube-system
    kubectl create clusterrolebinding dashboard-admin --clusterrole=cluster-admin --serviceaccount=kube-system:dashboard-admin
    kubectl describe secrets -n kube-system $(kubectl -n kube-system get secret | awk '/dashboard-admin/{print $1}')
    ```
1. 拿到token在登录界面的令牌区域输入，然后点击登录
    ![install-adm1](http://cdn.go99.top/docs/devops/k8s/k8s-learning/install-1.jpeg)

## 五、重置配置，重新部署集群

参考官方reset资料：https://kubernetes.io/docs/reference/setup-tools/kubeadm/kubeadm-reset/

## 六、使用私有镜像仓库

这里使用docker官方的`registry`仓库，部署仓库参考docker安装教程里的镜像仓库部署。

```bash
#### containerd

# 修改 /etc/containerd/config.toml
vim /etc/containerd/config.toml
# 找到registry部分，修改如下
...
    [plugins."io.containerd.grpc.v1.cri".registry]
      config_path = ""

      [plugins."io.containerd.grpc.v1.cri".registry.auths]

      [plugins."io.containerd.grpc.v1.cri".registry.configs]
        [plugins."io.containerd.grpc.v1.cri".registry.configs."10.3.5.23:5000".tls]  # here
          insecure_skip_verify = true # here

      [plugins."io.containerd.grpc.v1.cri".registry.headers]

      [plugins."io.containerd.grpc.v1.cri".registry.mirrors]
        [plugins."io.containerd.grpc.v1.cri".registry.mirrors."10.3.5.23:5000"] # here
          endpoint = ["http://10.3.5.23:5000"] # here
...
# 重启
systemctl restart containerd
# 然后使用k8s自带的镜像管理命令验证
crictl pull 10.3.5.23:5000/<image>:<tag>

#### docker
vim /etc/docker/daemon.json
{
  "insecure-registries": [
    "10.3.5.23:5000"
  ]
}
systemctl restart docker

#### cri-o
vim /etc/crio/crio.conf 
insecure_registries = ["test.registry.com"]
systemctl restart crio
```

# K8s高可用集群部署-KubeAdm

Etcd与其他组件共同运行在多台控制平面（Master）机器上，构建Etcd集群关系以形成高可用的Kubernetes集群。

先决条件：

* 最少三个或更多奇数Master节点；
* 最少三个或更多Node节点；
* 集群中所有机器之间的完整网络连接（公共或专用网络）；
* 使用超级用户权限；
* 在集群中的任何一个节点上都可以使用SSH远程访问；
* Kubeadm和Kubelet已经安装到机器上。

使用这种方案可以减少要使用机器的数量，降低成本，降低部署复杂度；多组件服务之间竞争主机资源，可能导致性能瓶颈，以及当Master主机发生故障时影响到所有组件正常工作。

* 主机系统：CentOS Linux release 7.7.1908 (Core)
* Kubernetes版本：1.22.10
* Docker CE版本：20.10.17
* 管理节点运行服务：etcd、kube-apiserver、kube-scheduler、kube-controller-manager、docker、kubelet、keepalived、haproxy

主机名|主机地址|VIP地址|主机角色
---|---|---|---
k8s-master01|192.168.0.5|192.168.0.10|Master（Control Plane）
k8s-master01|192.168.0.6|192.168.0.10|Master（Control Plane）
k8s-master01|192.168.0.7|192.168.0.10|Master（Control Plane）

确认如下端口未被占用：

```bash
ss -alnupt |grep -E '6443|10250|10259|10257|2379|2380'
ss -alnupt |grep -E '10250|3[0-2][0-7][0-6][0-7]'
```

## k8s安装

服务器内核升级，官方镜像仓库下载地址：http://mirrors.coreix.net/elrepo-archive-archive/kernel/el7/x86_64/RPMS/

```bash
# 安装4.19.9-1版本内核
$ rpm -ivh http://mirrors.coreix.net/elrepo-archive-archive/kernel/el7/x86_64/RPMS/kernel-ml-4.19.9-1.el7.elrepo.x86_64.rpm
$ rpm -ivh http://mirrors.coreix.net/elrepo-archive-archive/kernel/el7/x86_64/RPMS/kernel-ml-devel-4.19.9-1.el7.elrepo.x86_64.rpm
 
# 查看内核启动顺序
$ awk -F \' '$1=="menuentry " {print i++ " : " $2}' /etc/grub2.cfg
0 : CentOS Linux (3.10.0-1062.12.1.el7.x86_64) 7 (Core)
1 : CentOS Linux (4.19.9-1.el7.elrepo.x86_64) 7 (Core)
2 : CentOS Linux (3.10.0-862.el7.x86_64) 7 (Core)
3 : CentOS Linux (0-rescue-ef219b153e8049718c374985be33c24e) 7 (Core)
 
# 设置系统启动默认内核
$ grub2-set-default "CentOS Linux (4.19.9-1.el7.elrepo.x86_64) 7 (Core)"
$ grub2-mkconfig -o /boot/grub2/grub.cfg
 
# 查看默认内核
$ grub2-editenv list
CentOS Linux (4.19.9-1.el7.elrepo.x86_64) 7 (Core)
 
# 重启系统使其生效
$ reboot
```

系统初始化

```bash
#### 设置主机名称
# 在master01上执行
$ hostnamectl set-hostname k8s-master01
# 在master02上执行
$ hostnamectl set-hostname k8s-master02
# 在master03上执行
$ hostnamectl set-hostname k8s-master03

#### 添加hosts名称解析
### 在所有主机上执行
$ cat >> /etc/hosts << EOF
192.168.0.5 k8s-master01
192.168.0.6 k8s-master02
192.168.0.7 k8s-master03
EOF

#### 安装常用软件
### 在所有主机上执行
$ yum -y install epel-release.noarch nfs-utils net-tools bridge-utils \
ntpdate vim chrony wget lrzsz

#### 设置主机时间同步
# 在k8s-master01上设置从公共时间服务器上同步时间
systemctl stop ntpd 
timedatectl set-timezone Asia/Shanghai
ntpdate ntp.aliyun.com && /usr/sbin/hwclock
vim /etc/ntp.conf
# 当该节点丢失网络连接，采用本地时间作为时间服务器为集群中的其他节点提供时间同步
server 127.127.1.0
Fudge  127.127.1.0 stratum 10
# 注释掉默认时间服务器，改为如下地址
server cn.ntp.org.cn prefer iburst minpoll 4 maxpoll 10
server ntp.aliyun.com iburst minpoll 4 maxpoll 10
server time.ustc.edu.cn iburst minpoll 4 maxpoll 10
server ntp.tuna.tsinghua.edu.cn iburst minpoll 4 maxpoll 10
 
systemctl start ntpd
systemctl enable ntpd
ntpstat          
synchronised to NTP server (203.107.6.88) at stratum 3
   time correct to within 202 ms
   polling server every 64 s

#### 配置其它主机从k8s-master01同步时间
### 在除k8s-master01以外的所有主机上执行
$ systemctl stop ntpd
$ timedatectl set-timezone Asia/Shanghai
$ ntpdate k8s-master01 && /usr/sbin/hwclock
$ vim /etc/ntp.conf 
# 注释掉默认时间服务器，改为如下地址
server k8s-master01 prefer iburst minpoll 4 maxpoll 10
 
$ systemctl start ntpd
$ systemctl enable ntpd
$ ntpstat 
synchronised to NTP server (192.168.0.5) at stratum 4
   time correct to within 217 ms
   polling server every 16 s


#### 关闭防火墙
### 在所有节点上执行
# 关闭SElinux
$ sed -i 's/^SELINUX=enforcing$/SELINUX=disabled/' /etc/selinux/config
$ setenforce 0
# 关闭Fileworld防火墙
$ systemctl stop firewalld.service
$ systemctl disable firewalld.service


#### 系统优化
### 在所有节点上执行
# 关闭swap
$ swapoff -a
$ sed -i "s/^[^#].*swap/#&/g" /etc/fstab
 
# 启用bridge-nf功能
$ cat > /etc/modules-load.d/k8s.conf << EOF
overlay
br_netfilter
EOF
$ modprobe overlay && modprobe br_netfilter
 
# 设置内核参数
$ cat > /etc/sysctl.d/k8s.conf << EOF
# 配置转发 IPv4 并让 iptables 看到桥接流量
net.ipv4.ip_forward                 = 1
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
 
# 加强握手队列能力
net.ipv4.tcp_max_syn_backlog        = 10240
net.core.somaxconn                  = 10240
net.ipv4.tcp_syncookies             = 1
 
# 调整系统级别的能够打开的文件句柄的数量
fs.file-max=1000000
 
# 配置arp cache 大小
net.ipv4.neigh.default.gc_thresh1   = 1024
net.ipv4.neigh.default.gc_thresh2   = 4096
net.ipv4.neigh.default.gc_thresh3   = 8192
 
# 令TCP窗口和状态追踪更加宽松
net.netfilter.nf_conntrack_tcp_be_liberal = 1
net.netfilter.nf_conntrack_tcp_loose = 1
 
# 允许的最大跟踪连接条目，是在内核内存中netfilter可以同时处理的“任务”（连接跟踪条目）
net.netfilter.nf_conntrack_max      = 10485760
net.netfilter.nf_conntrack_tcp_timeout_established = 300
net.netfilter.nf_conntrack_buckets  = 655360
 
# 每个网络接口接收数据包的速率比内核处理这些包的速率快时，允许送到队列的数据包的最大数目。
net.core.netdev_max_backlog         = 10000
 
# 默认值: 128 指定了每一个real user ID可创建的inotify instatnces的数量上限
fs.inotify.max_user_instances       = 524288
# 默认值: 8192 指定了每个inotify instance相关联的watches的上限
fs.inotify.max_user_watches         = 524288
EOF
$ sysctl --system 
 
# 修改文件打开数
$ ulimit -n 65545
$ cat >> /etc/sysctl.d/limits.conf << EOF
*               soft    nproc           65535
*               hard    nproc           65535
*               soft    nofile          65535
*               hard    nofile          65535
EOF
$ sed -i '/nproc/ s/4096/65535/' /etc/security/limits.d/20-nproc.conf

#### 安装docker
### 在所有节点上执行
# 安装Docker
$ yum install -y yum-utils device-mapper-persistent-data lvm2
$ yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
$ sed -i 's+download.docker.com+mirrors.aliyun.com/docker-ce+' /etc/yum.repos.d/docker-ce.repo && yum makecache fast
$ yum -y install docker-ce-20.10.17
 
# 优化docker配置
$ mkdir -p /etc/docker && cat > /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
      "https://hub-mirror.c.163.coma",
      "https://docker.mirrors.ustc.edu.cn",
      "https://p6902cz5.mirror.aliyuncs.com"
  ],
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m"
  },
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ],
  "bip": "172.38.16.1/24"
}
EOF
 
# 启动并配置开机自启
$ systemctl enable docker
$ systemctl restart docker
$ docker version


#### 安装Kubernetes
### 在所有Master节点执行
# 配置yum源
cat > /etc/yum.repos.d/kubernetes.repo <<EOF
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF
 
# 安装kubeadm、kubelet和kubectl
$ yum install -y kubelet-1.22.10 kubeadm-1.22.10 kubectl-1.22.10 --disableexcludes=kubernetes --nogpgcheck
$ systemctl enable --now kubelet
 
# 配置kubelet参数
$ cat > /etc/sysconfig/kubelet <<EOF
KUBELET_EXTRA_ARGS="--fail-swap-on=false"
EOF
```

## 配置HA负载均衡

当存在多个控制平面时，`kube-apiserver`也存在多个，可以使用`HAProxy+Keepalived`这个组合，因为`HAProxy`可以提高更高性能的四层负载均衡功能。

官方文档提供了两种运行方式（此案例使用选项2）：
* 选项1：在操作系统上运行服务
* 选项2：将服务作为静态pod运行

参考文档：https://github.com/kubernetes/kubeadm/blob/main/docs/ha-considerations.md#options-for-software-load-balancing

将keepalived作为静态pod运行，在引导过程中，`kubelet`将启动这些进程，以便集群可以在启动时使用它们。这是一个优雅的解决方案，特别是在堆叠（Stacked）etcd 拓扑下描述的设置。

创建`keepalived.conf`配置文件

```conf
### 在k8s-master01上设置：
$ mkdir /etc/keepalived && cat > /etc/keepalived/keepalived.conf <<EOF
! /etc/keepalived/keepalived.conf
! Configuration File for keepalived
global_defs {
    router_id k8s-master01
}
vrrp_script check_apiserver {
  script "/etc/keepalived/check_apiserver.sh"
  interval 3
  weight -2
  fall 10
  rise 2
}
 
vrrp_instance VI_1 {
    state MASTER
    interface eth0
    virtual_router_id 51
    priority 100
    authentication {
        auth_type PASS
        auth_pass 123456
    }
    virtual_ipaddress {
        192.168.0.10
    }
    track_script {
        check_apiserver
    }
}
EOF
 
### 在k8s-master02上设置：
$ mkdir /etc/keepalived && cat > /etc/keepalived/keepalived.conf <<EOF
! /etc/keepalived/keepalived.conf
! Configuration File for keepalived
global_defs {
    router_id k8s-master02
}
vrrp_script check_apiserver {
  script "/etc/keepalived/check_apiserver.sh"
  interval 3
  weight -2
  fall 10
  rise 2
}
 
vrrp_instance VI_1 {
    state BACKUP
    interface eth0
    virtual_router_id 51
    priority 99
    authentication {
        auth_type PASS
        auth_pass 123456
    }
    virtual_ipaddress {
        192.168.0.10
    }
    track_script {
        check_apiserver
    }
}
EOF
 
### 在k8s-master03上设置：
$ mkdir /etc/keepalived && cat > /etc/keepalived/keepalived.conf <<EOF
! /etc/keepalived/keepalived.conf
! Configuration File for keepalived
global_defs {
    router_id k8s-master03
}
vrrp_script check_apiserver {
  script "/etc/keepalived/check_apiserver.sh"
  interval 3
  weight -2
  fall 10
  rise 2
}
 
vrrp_instance VI_1 {
    state BACKUP
    interface eth0
    virtual_router_id 51
    priority 98
    authentication {
        auth_type PASS
        auth_pass 123456
    }
    virtual_ipaddress {
        192.168.0.10
    }
    track_script {
        check_apiserver
    }
}
EOF
```

创建健康检查脚本

```bash
### 在所有Master控制节点上执行
$ cat > /etc/keepalived/check_apiserver.sh << 'EOF'
#!/bin/sh
 
errorExit() {
    echo "*** $*" 1>&2
    exit 1
}
 
curl --silent --max-time 2 --insecure https://localhost:9443/ -o /dev/null || errorExit "Error GET https://localhost:9443/"
if ip addr | grep -q 192.168.0.10; then
    curl --silent --max-time 2 --insecure https://192.168.0.10:9443/ -o /dev/null || errorExit "Error GET https://192.168.0.10:9443/"
fi
EOF
```

配置haproxy

```bash
### 在所有Master管理节点执行
$ mkdir /etc/haproxy && cat > /etc/haproxy/haproxy.cfg << 'EOF'
# /etc/haproxy/haproxy.cfg
#---------------------------------------------------------------------
# Global settings
#---------------------------------------------------------------------
global
    log /dev/log local0
    log /dev/log local1 notice
    daemon
 
#---------------------------------------------------------------------
# common defaults that all the 'listen' and 'backend' sections will
# use if not designated in their block
#---------------------------------------------------------------------
defaults
    mode                    http
    log                     global
    option                  httplog
    option                  dontlognull
    option http-server-close
    option forwardfor       except 127.0.0.0/8
    option                  redispatch
    retries                 1
    timeout http-request    10s
    timeout queue           20s
    timeout connect         5s
    timeout client          20s
    timeout server          20s
    timeout http-keep-alive 10s
    timeout check           10s
 
#---------------------------------------------------------------------
# Haproxy Monitoring panel
#---------------------------------------------------------------------
listen  admin_status
    bind 0.0.0.0:8888
    mode http
    log 127.0.0.1 local3 err
    stats refresh 5s
    stats uri /admin?stats
    stats realm itnihao\ welcome
    stats auth admin:admin
    stats hide-version
    stats admin if TRUE
 
#---------------------------------------------------------------------
# apiserver frontend which proxys to the control plane nodes
#---------------------------------------------------------------------
frontend apiserver
    bind *:9443
    mode tcp
    option tcplog
    default_backend apiserver
 
#---------------------------------------------------------------------
# round robin balancing for apiserver
#---------------------------------------------------------------------
backend apiserver
    option httpchk GET /healthz
    http-check expect status 200
    mode tcp
    option ssl-hello-chk
    balance     roundrobin
        server k8s-master01 192.168.0.5:6443 check
        server k8s-master02 192.168.0.6:6443 check
        server k8s-master03 192.168.0.7:6443 check
EOF
```

配置静态Pod运行

```bash
### 仅在k8s-master01上创建
$ mkdir -p /etc/kubernetes/manifests
# 配置keepalived清单
$ cat > /etc/kubernetes/manifests/keepalived.yaml << 'EOF'
apiVersion: v1
kind: Pod
metadata:
  creationTimestamp: null
  name: keepalived
  namespace: kube-system
spec:
  containers:
  - image: osixia/keepalived:2.0.17
    name: keepalived
    resources: {}
    securityContext:
      capabilities:
        add:
        - NET_ADMIN
        - NET_BROADCAST
        - NET_RAW
    volumeMounts:
    - mountPath: /usr/local/etc/keepalived/keepalived.conf
      name: config
    - mountPath: /etc/keepalived/check_apiserver.sh
      name: check
  hostNetwork: true
  volumes:
  - hostPath:
      path: /etc/keepalived/keepalived.conf
    name: config
  - hostPath:
      path: /etc/keepalived/check_apiserver.sh
    name: check
status: {}
EOF
# 配置haproxy清单
cat > /etc/kubernetes/manifests/haproxy.yaml << 'EOF'
apiVersion: v1
kind: Pod
metadata:
  name: haproxy
  namespace: kube-system
spec:
  containers:
  - image: haproxy:2.1.4
    name: haproxy
    livenessProbe:
      failureThreshold: 8
      httpGet:
        host: localhost
        path: /healthz
        port: 9443
        scheme: HTTPS
    volumeMounts:
    - mountPath: /usr/local/etc/haproxy/haproxy.cfg
      name: haproxyconf
      readOnly: true
  hostNetwork: true
  volumes:
  - hostPath:
      path: /etc/haproxy/haproxy.cfg
      type: FileOrCreate
    name: haproxyconf
status: {}
EOF
```

## 部署Kubernetes集群

准备镜像，由于国内访问`k8s.gcr.io`存在某些原因下载不了镜像，所以我们可以在国内的镜像仓库中下载它们（比如使用阿里云镜像仓库。阿里云代理镜像仓库地址：`registry.aliyuncs.com/google_containers`

```bash
### 在所有Master控制节点执行
$ kubeadm config images pull --kubernetes-version=v1.22.10 --image-repository=registry.aliyuncs.com/google_containers
```

准备ini配置文件

```ini
### 在k8s-master01上执行
$ kubeadm config print init-defaults > kubeadm-init.yaml
$ vim kubeadm-init.yaml 
apiVersion: kubeadm.k8s.io/v1beta3
bootstrapTokens:
- groups:
  - system:bootstrappers:kubeadm:default-node-token
  token: abcdef.0123456789abcdef
  ttl: 24h0m0s
  usages:
  - signing
  - authentication
kind: InitConfiguration
localAPIEndpoint:
  advertiseAddress: 192.168.0.5
  bindPort: 6443
nodeRegistration:
  criSocket: /var/run/dockershim.sock
  imagePullPolicy: IfNotPresent
  name: k8s-master01
  taints: null
---
controlPlaneEndpoint: "192.168.0.10:9443"
apiServer:
  timeoutForControlPlane: 4m0s
apiVersion: kubeadm.k8s.io/v1beta3
certificatesDir: /etc/kubernetes/pki
clusterName: kubernetes
controllerManager: {}
dns: {}
etcd:
  local:
    dataDir: /var/lib/etcd
imageRepository: registry.aliyuncs.com/google_containers
kind: ClusterConfiguration
kubernetesVersion: 1.22.10
networking:
  dnsDomain: cluster.local
  serviceSubnet: 10.96.0.0/12
scheduler: {}
```

配置说明：

* `localAPIEndpoint.advertiseAddress`：本机apiserver监听的IP地址。
* `localAPIEndpoint.bindPort`：本机apiserver监听的端口。
* `controlPlaneEndpoint`：控制平面入口点地址（负载均衡器VIP地址+负载均衡器端口）。
* `imageRepository`：部署集群时要使用的镜像仓库地址。
* `kubernetesVersion`：部署集群的kubernetes版本。

初始化控制平面节点,`kubeadm`在初始化控制平面时会生成部署Kubernetes集群中各个组件所需的相关配置文件在`/etc/kubernetes`目录下，可以供我们参考。

```bash
### 在k8s-master01上执行
# 由于kubeadm命令为源码安装，需要配置一下kubelet服务。
$ kubeadm init phase kubelet-start --config kubeadm-init.yaml
# 初始化kubernetes控制平面
$ kubeadm init --config kubeadm-init.yaml --upload-certs
 
Your Kubernetes control-plane has initialized successfully!
 
To start using your cluster, you need to run the following as a regular user:
 
  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config
 
Alternatively, if you are the root user, you can run:
 
  export KUBECONFIG=/etc/kubernetes/admin.conf
 
You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/
 
You can now join any number of the control-plane node running the following command on each as root:
 
  kubeadm join 192.168.0.10:9443 --token abcdef.0123456789abcdef \
        --discovery-token-ca-cert-hash sha256:b30e986e80423da7b6b1cbf43ece58598074b2a8b86295517438942e9a47ab0d \
        --control-plane --certificate-key 57360054608fa9978864124f3195bc632454be4968b5ccb577f7bb9111d96597
 
Please note that the certificate-key gives access to cluster sensitive data, keep it secret!
As a safeguard, uploaded-certs will be deleted in two hours; If necessary, you can use
"kubeadm init phase upload-certs --upload-certs" to reload certs afterward.
 
Then you can join any number of worker nodes by running the following on each as root:
 
kubeadm join 192.168.0.10:9443 --token abcdef.0123456789abcdef \
        --discovery-token-ca-cert-hash sha256:b30e986e80423da7b6b1cbf43ece58598074b2a8b86295517438942e9a47ab0d
```

将其它节点加入集群

```bash
### 在另外两台Master控制节点执行：
$ kubeadm join 192.168.0.10:9443 --token abcdef.0123456789abcdef \
      --discovery-token-ca-cert-hash sha256:b30e986e80423da7b6b1cbf43ece58598074b2a8b86295517438942e9a47ab0d \
      --control-plane --certificate-key 57360054608fa9978864124f3195bc632454be4968b5ccb577f7bb9111d96597

### 如有Node工作节点可使用如下命令
$ kubeadm join 192.168.0.10:9443 --token abcdef.0123456789abcdef \
        --discovery-token-ca-cert-hash sha256:b30e986e80423da7b6b1cbf43ece58598074b2a8b86295517438942e9a47ab0d

### 将keepalived和haproxy复制到其它Master控制节点
$ scp /etc/kubernetes/manifests/{haproxy.yaml,keepalived.yaml} root@k8s-master02:/etc/kubernetes/manifests/ 
$ scp /etc/kubernetes/manifests/{haproxy.yaml,keepalived.yaml} root@k8s-master03:/etc/kubernetes/manifests/ 

#### 去掉master污点（可选）
$ kubectl taint nodes --all node-role.kubernetes.io/master-
```

验证集群状态

```bash
### 可在任意Master控制节点执行
# 配置kubectl认证
$ mkdir -p $HOME/.kube
$ cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
 
# 查看节点状态
$ kubectl get nodes
NAME           STATUS     ROLES                  AGE     VERSION
k8s-master01   NotReady   control-plane,master   13m     v1.22.10
k8s-master02   NotReady   control-plane,master   3m55s   v1.22.10
k8s-master03   NotReady   control-plane,master   113s    v1.22.10
 
# 查看pod状态
$ kubectl get pod -n kube-system
NAMESPACE     NAME                                   READY   STATUS    RESTARTS        AGE
kube-system   coredns-7f6cbbb7b8-96hp9               0/1     Pending   0               18m
kube-system   coredns-7f6cbbb7b8-kfmnn               0/1     Pending   0               18m
kube-system   etcd-k8s-master01                      1/1     Running   0               18m
kube-system   etcd-k8s-master02                      1/1     Running   0               9m21s
kube-system   etcd-k8s-master03                      1/1     Running   0               7m18s
kube-system   haproxy-k8s-master01                   1/1     Running   0               18m
kube-system   haproxy-k8s-master02                   1/1     Running   0               3m27s
kube-system   haproxy-k8s-master03                   1/1     Running   0               3m16s
kube-system   keepalived-k8s-master01                1/1     Running   0               18m
kube-system   keepalived-k8s-master02                1/1     Running   0               3m27s
kube-system   keepalived-k8s-master03                1/1     Running   0               3m16s
kube-system   kube-apiserver-k8s-master01            1/1     Running   0               18m
kube-system   kube-apiserver-k8s-master02            1/1     Running   0               9m24s
kube-system   kube-apiserver-k8s-master03            1/1     Running   0               7m23s
kube-system   kube-controller-manager-k8s-master01   1/1     Running   0               18m
kube-system   kube-controller-manager-k8s-master02   1/1     Running   0               9m24s
kube-system   kube-controller-manager-k8s-master03   1/1     Running   0               7m22s
kube-system   kube-proxy-cvdlr                       1/1     Running   0               7m23s
kube-system   kube-proxy-gnl7t                       1/1     Running   0               9m25s
kube-system   kube-proxy-xnrt7                       1/1     Running   0               18m
kube-system   kube-scheduler-k8s-master01            1/1     Running   0               18m
kube-system   kube-scheduler-k8s-master02            1/1     Running   0               9m24s
kube-system   kube-scheduler-k8s-master03            1/1     Running   0               7m22s
 
# 查看kubernetes证书有效期
$ kubeadm certs check-expiration
CERTIFICATE                EXPIRES                  RESIDUAL TIME   CERTIFICATE AUTHORITY   EXTERNALLY MANAGED
admin.conf                 Oct 25, 2122 07:40 UTC   99y             ca                      no      
apiserver                  Oct 25, 2122 07:40 UTC   99y             ca                      no      
apiserver-etcd-client      Oct 25, 2122 07:40 UTC   99y             etcd-ca                 no      
apiserver-kubelet-client   Oct 25, 2122 07:40 UTC   99y             ca                      no      
controller-manager.conf    Oct 25, 2122 07:40 UTC   99y             ca                      no      
etcd-healthcheck-client    Oct 25, 2122 07:40 UTC   99y             etcd-ca                 no      
etcd-peer                  Oct 25, 2122 07:40 UTC   99y             etcd-ca                 no      
etcd-server                Oct 25, 2122 07:40 UTC   99y             etcd-ca                 no      
front-proxy-client         Oct 25, 2122 07:40 UTC   99y             front-proxy-ca          no      
scheduler.conf             Oct 25, 2122 07:40 UTC   99y             ca                      no      
 
CERTIFICATE AUTHORITY   EXPIRES                  RESIDUAL TIME   EXTERNALLY MANAGED
ca                      Oct 22, 2032 07:40 UTC   99y             no      
etcd-ca                 Oct 22, 2032 07:40 UTC   99y             no      
front-proxy-ca          Oct 22, 2032 07:40 UTC   99y             no   
```

查看`HAProxy`控制台集群状态

访问：`http://192.168.0.10:8888/admin?stats` 账号密码都为`admin`

安装CNA插件(`calico`),Calico是一个开源的虚拟化网络方案，支持基础的Pod网络通信和网络策略功能。官方文档：`https://projectcalico.docs.tigera.io/getting-started/kubernetes/quickstart`


```bash
### 在任意Master控制节点执行
# 下载最新版本编排文件
$ kubectl apply -f https://docs.projectcalico.org/manifests/calico.yaml
# 下载指定版本编排文件(可选)
$ curl https://raw.githubusercontent.com/projectcalico/calico/v3.24.0/manifests/calico.yaml -O
# 部署calico
$ kubectl apply -f calico.yaml
 
# 验证安装
$ kubectl get pod -n kube-system | grep calico
calico-kube-controllers-86c9c65c67-j7pv4   1/1     Running   0               17m
calico-node-8mzpk                          1/1     Running   0               17m
calico-node-tkzs2                          1/1     Running   0               17m
calico-node-xbwvp                          1/1     Running   0               17m
```

## 集群优化及组件安装

修改`NodePort`端口范围（可选）

```bash
### 在所有Master管理节点执行
$ sed -i '/- --secure-port=6443/a\    - --service-node-port-range=1-32767' /etc/kubernetes/manifests/kube-apiserver.yaml
```

解决kubectl get cs显示异常问题

```bash
### 在所有Master管理节点执行
$ sed -i 's/^[^#].*--port=0$/#&/g' /etc/kubernetes/manifests/{kube-scheduler.yaml,kube-controller-manager.yaml}
# 验证
$ kubectl get cs
Warning: v1 ComponentStatus is deprecated in v1.19+
NAME                 STATUS    MESSAGE                         ERROR
scheduler            Healthy   ok                              
controller-manager   Healthy   ok                              
etcd-0               Healthy   {"health":"true","reason":""} 
```

解决调度器监控不显示问题

```bash
### 在所有Master管理节点执行
$ sed -i 's#bind-address=127.0.0.1#bind-address=0.0.0.0#g' /etc/kubernetes/manifests/kube-controller-manager.yaml
$ sed -i 's#bind-address=127.0.0.1#bind-address=0.0.0.0#g' /etc/kubernetes/manifests/kube-scheduler.yaml
```

安装`Metric-Server`,指标服务`Metrices-Server`是Kubernetes中的一个常用插件，它类似于`Top`命令，可以查看Kubernetes中`Node`和`Pod`的`CPU和内存`资源使用情况。`Metrices-Server`每15秒收集一次指标，它在集群中的每个节点中运行，可扩展支持多达5000个节点的集群。

参考文档：https://github.com/kubernetes-sigs/metrics-server

```bash
### 在任意Master管理节点执行
$ wget https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml -O metrics-server.yaml
# 修改配置
$ vim metrics-server.yaml 
......
    spec:
      containers:
      - args:
        - --cert-dir=/tmp
        - --secure-port=4443
        - --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname
        - --kubelet-use-node-status-port
        - --metric-resolution=15s
        - --kubelet-insecure-tls  # 不要验证由Kubelets提供的CA或服务证书。
        image: bitnami/metrics-server:0.6.1   # 修改成docker.io镜像
        imagePullPolicy: IfNotPresent
......
# 部署metrics-server
$ kubectl apply -f metrics-server.yaml 
# 查看启动状态
$ kubectl get pod -n kube-system -l k8s-app=metrics-server -w
NAME                             READY   STATUS    RESTARTS   AGE
metrics-server-655d65c95-lvb7z   1/1     Running   0          103s
# 查看集群资源状态
$ kubectl top nodes
NAME           CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%   
k8s-master01   193m         4%     2144Mi          27%       
k8s-master02   189m         4%     1858Mi          23%       
k8s-master03   268m         6%     1934Mi          24%    
```

## 其他

重置节点(危险操作)，当在使用`kubeadm init`或`kubeadm join`部署节点出现失败状况时，可以使用以下操作对节点进行重置！

注：重置会将节点恢复到未部署前状态，若集群已正常工作则无需重置，否则将引起不可恢复的集群故障！

```bash
$ kubeadm reset -f
$ ipvsadm --clear
$ iptables -F && iptables -X && iptables -Z
```