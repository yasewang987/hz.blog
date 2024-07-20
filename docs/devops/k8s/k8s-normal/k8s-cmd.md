# K8s常用命令

## 其他

```bash
# 查看集群信息
kubectl cluster-info

# 创建命名空间
kubectl create namespace <namespace>
# 删除命名空间
kubectl delete namespace mem-example
# 查看命名空间信息
kubectl describe namespace <namespace-name>
```

## crictl容器管理

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

## Node节点命令

```bash

# 查看节点列表
kubectl get nodes
kubectl get nodes -o wide
# 查看节点详细信息
kubectl describe nodes
# 查看所有节点标签
kubectl get nodes --show-labels
# 查看指定节点标签
kubectl get node nodename --show-labels
# 给节点添加标签
kubectl label nodes node1 accelerator=example-gpu-x100
# 取消节点标签
kubectl label nodes <node-name> <key>-
# 查看集群资源使用情况
kubectl top nodes

# 查看token
kubeadm token list
TOKEN                     TTL         EXPIRES                USAGES                   DESCRIPTION                                                EXTRA GROUPS
abcdef.0123456789abcdef   22h         2022-10-26T07:43:01Z   authentication,signing   <none>                                                     system:bootstrappers:kubeadm:default-node-token

# 查看证书到期时间
$ kubeadm certs check-expiration
CERTIFICATE                EXPIRES                  RESIDUAL TIME   CERTIFICATE AUTHORITY   EXTERNALLY MANAGED
admin.conf                 Oct 25, 2122 07:40 UTC   99y             ca                      no      
apiserver                  Oct 25, 2122 07:40 UTC   99y             ca                      no 
CERTIFICATE AUTHORITY   EXPIRES                  RESIDUAL TIME   EXTERNALLY MANAGED
ca                      Oct 22, 2032 07:40 UTC   99y             no      
etcd-ca                 Oct 22, 2032 07:40 UTC   99y             no      
 
# 查看kubeadm初始化控制平面配置信息
$ kubeadm config print init-defaults
apiVersion: kubeadm.k8s.io/v1beta3
bootstrapTokens:
...
---
apiServer:
  timeoutForControlPlane: 4m0s
apiVersion: kubeadm.k8s.io/v1beta3
certificatesDir: /etc/kubernetes/pki
clusterName: kubernetes
...
```

## Service命令

```bash
# 创建服务（推荐使用yaml文件）
kubectl create service clusterip my-service --tcp=80:8080
# 编辑服务
kubectl edit service <service-name> -n <namespace>
# 更改服务类型
kubectl patch service <service-name> -p '{"spec": {"type": "NodePort"}}'

# 获取default命名空间下的
kubectl get services
kubectl get services  -o wide
# 获取kube-system命名空间下的
kubectl -n kube-system get services
# 获取详情
kubectl describe service my-service
kubectl describe service <service-name> -n <namespace>
# 删除service
kubectl delete service xxxx
kubectl -n kube-system delete service xxxx

# 临时调试，端口转发（27017是服务端口，28015是本机端口）
kubectl port-forward service/mongo 28015:27017
```

## Deployment命令

```bash
# 创建deployment（一般都是通过yaml文件创建）
kubectl create deployment <deployment-name> --image=<container-image>
kubectl apply -f xxx-deployment.yaml
# 【一般不推荐，可以通过service.yaml文件去配置】自动创建Service指向Deployment的所有Pods
kubectl expose deployment <deployment-name> --type=LoadBalancer --port=80 --target-port=8080
# 升级
kubectl apply -f xxxx-deloyment.yaml --record
# 检查服务更新状态
kubectl rollout status deployment xxxx-deployment
# 查看升级历史记录
kubctl rollout history deployment xxxx-deployment
# 回滚版本1
kubectl rollout undo deployment --to-revision=1
# 扩大或缩小副本数量
kubectl scale deployment <deployment-name> --replicas=5

# 获取default命名空间下的
kubectl get deployments -o wide
# 获取kube-system命名空间下的
kubectl -n kube-system get deployments
# 显示该 Deployment 的相关信息
kubectl describe deployment <deployment-name> -n <namespace>
# 删除deployment
kubectl delete deployment nginx-deployment
kubectl -n kube-system delete deployment xxxx

# 临时调试端口转发
kubectl port-forward deployment/mongo 28015:27017
```

## Pod命令

```bash
# 获取default命名空间下的pods
kubectl get pods
kubectl get pods -o wide
kubectl get pods --all-namespaces
# 获取kube-system命名空间下的pods
kubectl -n kube-system get pods
# 获取指定label的所有pod（deployment.yaml里面设置的label）
kubectl get pods -l app=nginx
# 查看 Pod 相关的详细信息yaml
kubectl get pod memory-demo --output=yaml --namespace=mem-example
# 查看关于该 Pod 历史的详细信息
kubectl describe pod memory-demo-2 --namespace=mem-example
# 查看pod事件
kubectl describe pod <pod-name> -n <namespace> | grep -i events
# 获取该 Pod 的指标数据（cpu、内存）
kubectl top pod memory-demo --namespace=mem-example
# 删除pod
kubectl delete pod memory-demo --namespace=mem-example
# 强制删除pod
kubectl delete pod <pod-name> -n <namespace> --force --grace-period=0

# 列出pod里用到的所有镜像
# .items[*]: 对于每个返回的值
# .spec: 获取 spec
# ['initContainers', 'containers'][*]: 对于每个容器
# .image: 获取镜像
kubectl get pods --all-namespaces -o jsonpath="{.items[*].spec.containers[*].image}" |\
tr -s '[[:space:]]' '\n' |\
sort |\
uniq -c

### 进入容器
kubectl exec -n namespacename pod-name -c container-name -it -- bash
### 查看日志(-f 持续查看  -l app=nginx --all-containers=true：查看指定标签的所有容器)
kubectl logs -n namespacename pod-name -c container-name --tail 2000
### 运行一个临时pod去调试集群中的其他pod或者service
kubectl run -i --tty --image busybox:1.28 dns-test --restart=Never --rm
# 这将启动一个新的 Shell。在新 Shell 中运行
nslookup web-0.nginx
```

## PV/PVC管理

`Persistent Volumes (PVs)` 提供了持久化的存储资源，PV类型多种多样，支持不同的存储后端，如本地存储、网络存储（如NFS、GlusterFS、Ceph等）。

```bash
# 列出所有PV
kubectl get pv
# 查看PV详细信息
kubectl describe pv <pv-name>
# 列出所有PVC
kubectl get pvc
# 查看PVC详细信息
kubectl describe pvc <pvc-name>
```

```yaml
###### 本地pv
apiVersion: v1
kind: PersistentVolume
metadata:
  name: local-pv-example
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: local-storage
  local:
    path: /mnt/data
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - node01  # 指定节点名称

#### 创建NFS PV
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nfs-pv-example
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Recycle
  storageClassName: nfs
  nfs:
    server: <nfs-server-ip> # nfs服务ip
    path: "/exports/data"   # nfs共享目录

### pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: myclaim
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: local-storage  # 或 nfs，需与PV的storageClassName匹配
```

## ConfigMap管理

用来存储配置数据，如应用的配置文件，以键值对形式挂载到Pod中，方便应用程序读取和分离配置与代码。

```bash
# 创建ConfigMap
kubectl create configmap <my-configmap> --from-literal=KEY1=VALUE1
# 查看ConfigMap
kubectl get configmaps
# 删除ConfigMap
kubectl delete configmap  <my-configmap>
```

## api接口常用命令

```bash
# 要先在master节点启动proxy
kubectl proxy --address='0.0.0.0' --port=8001 --disable-filter=true

# 获取所有节点信息
curl http://127.0.0.1:8001/api/v1/nodes

# 调整deployment中的pod副本数量
curl -X PATCH -H 'Content-Type: application/strategic-merge-patch+json' --data '{"spec":{"replicas": 2}}' http://127.0.0.1:8001/apis/apps/v1/namespaces/default/deployments/fc-deployment
```