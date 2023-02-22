# K8s常用命令

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

    # 获取kube-system命名空间下的pods
    kubectl -n kube-system get pods
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
    kubectl get deployments

    # 获取kube-system命名空间下的
    kubectl -n kube-system get deployments
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
# 查看Token列表
$ kubeadm token list
TOKEN                     TTL         EXPIRES                USAGES                   DESCRIPTION                                                EXTRA GROUPS
abcdef.0123456789abcdef   22h         2022-10-26T07:43:01Z   authentication,signing   <none>                                                     system:bootstrappers:kubeadm:default-node-token
jgqg88.6mskuadei41o0s2d   40m         2022-10-25T09:43:01Z   <none>                   Proxy for managing TTL for the kubeadm-certs secret        <none>
 
# 查询节点运行状态
$ kubectl get nodes
NAME           STATUS   ROLES                  AGE   VERSION
k8s-master01   Ready    control-plane,master   81m   v1.22.10
k8s-master02   Ready    control-plane,master   71m   v1.22.10
k8s-master03   Ready    control-plane,master   69m   v1.22.10
 
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