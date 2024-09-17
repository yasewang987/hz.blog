# K8s基础信息

## gpu使用

对应 k8s 环境，需要额外安装对应的 device-plugin 使得 kubelet 能够感知到节点上的 GPU 设备，以便 k8s 能够进行 GPU 管理。

注：一般在 k8s 中使用都会直接使用 gpu-operator 方式进行安装，本文主要为了搞清各个组件的作用，因此进行手动安装。

* `gpu-device-plugin`: 用于管理 GPU，device-plugin 以 DaemonSet 方式运行到集群各个节点，以感知节点上的 GPU 设备，从而让 k8s 能够对节点上的 GPU 设备进行管理。
* `gpu-exporter`：用于监控 GPU

只需要在集群中安装 device-plugin 和 监控即可使用。

大致工作流程如下：

* 每个节点的 kubelet 组件维护该节点的 GPU 设备状态（哪些已用，哪些未用）并定时报告给调度器，调度器知道每一个节点有多少张 GPU 卡可用。
* 调度器为 pod 选择节点时，从符合条件的节点中选择一个节点。
* 当 pod 调度到节点上后，kubelet 组件为 pod 分配 GPU 设备 ID，并将这些 ID 作为参数传递给 NVIDIA Device Plugin
* NVIDIA Device Plugin 将分配给该 pod 的容器的 GPU 设备 ID 写入到容器的环境变量 NVIDIA_VISIBLE_DEVICES 中，然后将信息返回给 kubelet。
* kubelet 启动容器。
* NVIDIA Container Toolkit 检测容器的 spec 中存在环境变量 NVIDIA_VISIBLE_DEVICES，然后根据环境变量的值将 GPU 设备挂载到容器中。

上面的DaemonSet里会使用`hostPath`将物理机器上的`docker、gpu驱动`等映射到pod中。

### 手动安装所有组件

```bash
#### 手动安装
# 安装 NVIDIA 的 k8s-device-plugin
kubectl create -f https://raw.githubusercontent.com/NVIDIA/k8s-device-plugin/v0.15.0/deployments/static/nvidia-device-plugin.yml
# 查看device-plugin pod
kgo get po -l app=nvidia-device-plugin-daemonset
# 查看node节点可分配gpu（nvidia.com/gpu这个数据）
k describe node test|grep Capacity -A7
Capacity:
  cpu:                48
  ephemeral-storage:  460364840Ki
  hugepages-1Gi:      0
  hugepages-2Mi:      0
  memory:             98260824Ki
  nvidia.com/gpu:     2
  pods:               110

# 安装 GPU 监控（监控集群 GPU 资源使用情况）
# 需要安装 DCCM exporter[6] 结合 Prometheus 输出 GPU 资源监控信息

helm repo add gpu-helm-charts \
  https://nvidia.github.io/dcgm-exporter/helm-charts

helm repo update


helm install \
  --generate-name \
  gpu-helm-charts/dcgm-exporter

# 查看 metrics
curl -sL http://127.0.0.1:8080/metrics
# HELP DCGM_FI_DEV_SM_CLOCK SM clock frequency (in MHz).# TYPE DCGM_FI_DEV_SM_CLOCK gauge# HELP DCGM_FI_DEV_MEM_CLOCK Memory clock frequency (in MHz).# TYPE DCGM_FI_DEV_MEM_CLOCK gauge# HELP DCGM_FI_DEV_MEMORY_TEMP Memory temperature (in C).# TYPE DCGM_FI_DEV_MEMORY_TEMP gauge
...
DCGM_FI_DEV_SM_CLOCK{gpu="0", UUID="GPU-604ac76c-d9cf-fef3-62e9-d92044ab6e52",container="",namespace="",pod=""} 139
DCGM_FI_DEV_MEM_CLOCK{gpu="0", UUID="GPU-604ac76c-d9cf-fef3-62e9-d92044ab6e52",container="",namespace="",pod=""} 405
DCGM_FI_DEV_MEMORY_TEMP{gpu="0", UUID="GPU-604ac76c-d9cf-fef3-62e9-d92044ab6e52",container="",namespace="",pod=""} 9223372036854775794
...

## 在 k8s 创建 Pod 要使用 GPU 资源很简单，和 cpu、memory 等常规资源一样，在 resource 中 申请即可
apiVersion: v1
kind: Pod
metadata:
  name: gpu-pod
spec:
  restartPolicy: Never
  containers:
    - name: cuda-container
      image: nvcr.io/nvidia/k8s/cuda-sample:vectoradd-cuda10.2
      resources:
        limits:
          nvidia.com/gpu: 1 # requesting 1 GPU
## 启动后，查看日志，正常应该会打印 测试通过的信息
kubectl logs gpu-pod
[Vector addition of 50000 elements]
Copy input data from the host memory to the CUDA device
CUDA kernel launch with 196 blocks of 256 threads
Copy output data from the CUDA device to the host memory
Test PASSED
Done
```

## gpu-operator自动安装

* `NFD(Node Feature Discovery)`：用于给节点打上某些标签，这些标签包括 cpu id、内核版本、操作系统版本、是不是 GPU 节点等，其中需要关注的标签是`nvidia.com/gpu.present=true`，如果节点存在该标签，那么说明该节点是 GPU 节点。
* `GFD(GPU Feature Discovery)`:用于收集节点的 GPU 设备属性（GPU 驱动版本、GPU 型号等），并将这些属性以节点标签的方式透出。在 k8s 集群中以 DaemonSet 方式部署，只有节点拥有标签nvidia.com/gpu.present=true时，DaemonSet 控制的 Pod 才会在该节点上运行。新版本 GFD 迁移到了 NVIDIA/k8s-device-plugin
* `NVIDIA Driver Installer`：基于容器的方式在节点上安装 NVIDIA GPU 驱动，在 k8s 集群中以 DaemonSet 方式部署，只有节点拥有标签nvidia.com/gpu.present=true时，DaemonSet 控制的 Pod 才会在该节点上运行。
* `NVIDIA Container Toolkit Installer`：能够实现在容器中使用 GPU 设备，在 k8s 集群中以 DaemonSet 方式部署，同样的，只有节点拥有标签nvidia.com/gpu.present=true时，DaemonSet 控制的 Pod 才会在该节点上运行。
* `NVIDIA Device Plugin`：NVIDIA Device Plugin 用于实现将 GPU 设备以 Kubernetes 扩展资源的方式供用户使用，在 k8s 集群中以 DaemonSet 方式部署，只有节点拥有标签nvidia.com/gpu.present=true时，DaemonSet 控制的 Pod 才会在该节点上运行。
`DCGM Exporter`：周期性的收集节点 GPU 设备的状态（当前温度、总的显存、已使用显存、使用率等）并暴露 Metrics，结合 Prometheus 和 Grafana 使用。在 k8s 集群中以 DaemonSet 方式部署，只有节点拥有标签nvidia.com/gpu.present=true时，DaemonSet 控制的 Pod 才会在该节点上运行。

```bash
# NFD 添加的 label 以   feature.node.kubernetes.io 作为前缀
feature.node.kubernetes.io/cpu-cpuid.ADX=true
feature.node.kubernetes.io/system-os_release.ID=ubuntu
feature.node.kubernetes.io/system-os_release.VERSION_ID.major=22
feature.node.kubernetes.io/system-os_release.VERSION_ID.minor=04
feature.node.kubernetes.io/system-os_release.VERSION_ID=22.04
#  GFD 则主要记录 GPU 信息
nvidia.com/cuda.runtime.major=12
nvidia.com/cuda.runtime.minor=2
nvidia.com/cuda.driver.major=535
nvidia.com/cuda.driver.minor=161
nvidia.com/gpu.product=Tesla-T4
nvidia.com/gpu.memory=15360
```

安装gpu-operator

```bash
# GPU 节点必须运行相同的操作系统(手动安装就不需要了)
# GPU 节点必须配置相同容器引擎，例如都是 containerd 或者都是 docker
# 如果使用了 Pod Security Admission (PSA) ，需要为 gpu-operator 标记特权模式
kubectl create ns gpu-operator
kubectl label --overwrite ns gpu-operator pod-security.kubernetes.io/enforce=privileged
# 集群中不要安装 NFD，如果已经安装了需要再安装 gpu-operator 时禁用 NFD 部署(返回 true 则说明集群中安装了 NFD)
kubectl get nodes -o json | jq '.items[].metadata.labels | keys | any(startswith("feature.node.kubernetes.io"))'

#### 使用 Helm 部署
# 添加 nvidia helm 仓库并更新
helm repo add nvidia https://helm.ngc.nvidia.com/nvidia \
    && helm repo update

# 以默认配置安装
helm install --wait --generate-name \
    -n gpu-operator --create-namespace \
    nvidia/gpu-operator

# 如果提前手动安装了 gpu 驱动，operator 中要禁止 gpu 安装
helm install --wait --generate-name \
     -n gpu-operator --create-namespace \
     nvidia/gpu-operator \
     --set driver.enabled=false

# 查看状态
kubectl -n gpu-operator get po
NAME                                                           READY   STATUS      RESTARTS      AGE
gpu-feature-discovery-jdqpb                                    1/1     Running     0             35d
gpu-operator-67f8b59c9b-k989m                                  1/1     Running     6 (35d ago)   35d
nfd-node-feature-discovery-gc-5644575d55-957rp                 1/1     Running     6 (35d ago)   35d
nfd-node-feature-discovery-master-5bd568cf5c-c6t9s             1/1     Running     6 (35d ago)   35d
nfd-node-feature-discovery-worker-sqb7x                        1/1     Running     6 (35d ago)   35d
nvidia-container-toolkit-daemonset-rqgtv                       1/1     Running     0             35d
nvidia-cuda-validator-9kqnf                                    0/1     Completed   0             35d
nvidia-dcgm-exporter-8mb6v                                     1/1     Running     0             35d
nvidia-device-plugin-daemonset-7nkjw                           1/1     Running     0             35d
nvidia-driver-daemonset-5.15.0-105-generic-ubuntu22.04-g5dgx   1/1     Running     5 (35d ago)   35d
nvidia-operator-validator-6mqlm                                1/1     Running     0      
# 然后进入nvidia-driver-daemonset-xxx Pod，该 Pod 负责 GPU Driver 的安装，在该 Pod 中可以执行 nvidia-smi命令,比如查看 GPU 信息
kubectl -n gpu-operator exec -it nvidia-driver-daemonset-5.15.0-105-generic-ubuntu22.04-g5dgx -- nvidia-smi
# 查看pod日志
kubectl -n gpu-operaator logs -f nvidia-driver-daemonset-5.15.0-105-generic-ubuntu22.04-g5dgx
# 最后再查看 Pod 信息(主要看nvidia.com/gpu)
kubectl get node xxx -oyaml
```