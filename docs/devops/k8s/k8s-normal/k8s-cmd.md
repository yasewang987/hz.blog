# K8s常用命令

## k8s容器管理

资料地址：https://kubernetes.io/zh-cn/docs/tasks/debug/debug-cluster/crictl/

```bash
# 查看镜像列表
crictl images
# 根据仓库打印镜像清单：
crictl images nginx
# 只打印镜像 ID：
crictl images -q
# 拉取镜像
crictl pull 10.0.0.1:5000/<image>:<tag>

# 打印所有 Pod 的清单
crictl pods
# 根据名称打印 Pod 清单
crictl pods --name nginx-65899c769f-wv2gp
# 根据标签打印 Pod 清单：
crictl pods --label run=nginx
# 打印所有容器清单：
crictl ps -a
# 打印正在运行的容器清单
crictl ps
# 启动容器
crictl start 3e025dd50a72d956c4f14881fbb5b1080c9275674e95fb67f965f6478a957d60
# 在正在运行的容器上执行命令
crictl exec -i -t 1f73f2d81bf98 ls
# 获取容器日志
crictl logs 87d3992f84f74
crictl logs --tail=1 87d3992f84f74

##### 运行 Pod 沙盒
# pod-config.json
{
  "metadata": {
    "name": "nginx-sandbox",
    "namespace": "default",
    "attempt": 1,
    "uid": "hdishd83djaidwnduwk28bcsb"
  },
  "log_directory": "/tmp",
  "linux": {
  }
}
# 使用 crictl runp 命令应用 JSON 文件并运行沙盒
crictl runp pod-config.json
```

## node节点命令

```bash
# 创建命名空间
kubectl create namespace <namespace>
# 删除命名空间
kubectl delete namespace mem-example

# 查看节点列表
kubectl get nodes
kubectl get nodes -o wide
# 查看节点详细信息
kubectl describe nodes
# 查看节点标签
kubectl get nodes --show-labels
# 给节点添加标签

```

## 创建服务

```bash
# 创建
kubectl create xxx.yaml --validate=false

# 重启
kubectl replace xxx.yaml --force --validate=false
```

## 获取Pod信息

```bash
# 获取default命名空间下的pods
kubectl get pods
kubectl get pods -o wide
# 获取kube-system命名空间下的pods
kubectl -n kube-system get pods
# 查看 Pod 相关的详细信息yaml
kubectl get pod memory-demo --output=yaml --namespace=mem-example
# 查看关于该 Pod 历史的详细信息
kubectl describe pod memory-demo-2 --namespace=mem-example
# 获取该 Pod 的指标数据（cpu、内存）
kubectl top pod memory-demo --namespace=mem-example
# 删除pod
kubectl delete pod memory-demo --namespace=mem-example
# 获取指定label的所有pod（deployment.yaml里面设置的label）
kubectl get pods -l app=nginx
```

## 获取service信息

```bash
# 获取default命名空间下的
kubectl get services

# 获取kube-system命名空间下的
kubectl -n kube-system get services
```

## 获取Deployment信息

```bash
# 获取default命名空间下的
kubectl get deployments -o wide
# 获取kube-system命名空间下的
kubectl -n kube-system get deployments
# 显示该 Deployment 的相关信息
kubectl describe deployment <deployment-name>
# 删除deployment
kubectl delete deployment nginx-deployment
```

## 删除信息

```bash
# 删除defalut命名空间下的
kubectl delete pod xxxx
kubectl delete service xxxx
kubectl delete deployment xxxx

# 删除kube-system命名空间下的
kubectl -n kube-system delete pod xxxx
kubectl -n kube-system delete service xxxx
kubectl -n kube-system delete deployment xxxx
```

## 版本升级、回滚

```bash
# 升级，修改yaml内容
kubectl apply -f xxxx-deloyment.yaml --record

# 检查服务更新状态
kubectl rollout status deployment xxxx-deployment

# 查看升级历史记录
kubctl rollout history deployment xxxx-deployment

# 回滚版本1
kubectl rollout undo deployment --to-revision=1
```

## 其他

```bash
# 查询节点运行状态
$ kubectl get nodes
NAME           STATUS   ROLES                  AGE   VERSION
k8s-master01   Ready    control-plane,master   81m   v1.22.10
k8s-master02   Ready    control-plane,master   71m   v1.22.10
k8s-master03   Ready    control-plane,master   69m   v1.22.10

# 查看Token列表
$ kubeadm token list
TOKEN                     TTL         EXPIRES                USAGES                   DESCRIPTION                                                EXTRA GROUPS
abcdef.0123456789abcdef   22h         2022-10-26T07:43:01Z   authentication,signing   <none>                                                     system:bootstrappers:kubeadm:default-node-token
jgqg88.6mskuadei41o0s2d   40m         2022-10-25T09:43:01Z   <none>                   Proxy for managing TTL for the kubeadm-certs secret        <none>

# 查看证书到期时间
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
 
# 查看kubeadm初始化控制平面配置信息
$ kubeadm config print init-defaults
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
  advertiseAddress: 1.2.3.4
  bindPort: 6443
nodeRegistration:
  criSocket: /var/run/dockershim.sock
  imagePullPolicy: IfNotPresent
  name: node
  taints: null
---
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
imageRepository: k8s.gcr.io
kind: ClusterConfiguration
kubernetesVersion: 1.22.0
networking:
  dnsDomain: cluster.local
  serviceSubnet: 10.96.0.0/12
scheduler: {}
 
# 查看kube-system空间Pod运行状态
$ kubectl get pod --namespace=kube-system
NAME                                       READY   STATUS             RESTARTS      AGE
calico-kube-controllers-86c9c65c67-j7pv4   1/1     Running            0             47m
calico-node-8mzpk                          1/1     Running            0             47m
calico-node-tkzs2                          1/1     Running            0             47m
calico-node-xbwvp                          1/1     Running            0             47m
coredns-7f6cbbb7b8-96hp9                   1/1     Running            0             82m
coredns-7f6cbbb7b8-kfmnn                   1/1     Running            0             82m
etcd-k8s-master01                          1/1     Running            0             82m
etcd-k8s-master02                          1/1     Running            0             72m
etcd-k8s-master03                          1/1     Running            0             70m
haproxy-k8s-master01                       1/1     Running            0             36m
haproxy-k8s-master02                       1/1     Running            0             67m
haproxy-k8s-master03                       1/1     Running            0             66m
keepalived-k8s-master01                    1/1     Running            0             82m
keepalived-k8s-master02                    1/1     Running            0             67m
keepalived-k8s-master03                    1/1     Running            0             66m
kube-apiserver-k8s-master01                1/1     Running            0             82m
kube-apiserver-k8s-master02                1/1     Running            0             72m
kube-apiserver-k8s-master03                1/1     Running            0             70m
kube-controller-manager-k8s-master01       1/1     Running            0             23m
kube-controller-manager-k8s-master02       1/1     Running            0             23m
kube-controller-manager-k8s-master03       1/1     Running            0             23m
kube-proxy-cvdlr                           1/1     Running            0             70m
kube-proxy-gnl7t                           1/1     Running            0             72m
kube-proxy-xnrt7                           1/1     Running            0             82m
kube-scheduler-k8s-master01                1/1     Running            0             23m
kube-scheduler-k8s-master02                1/1     Running            0             23m
kube-scheduler-k8s-master03                1/1     Running            0             23m
metrics-server-5786d84b7c-5v4rv            1/1     Running            0             8m38s
```