# Kubernetes - Deployment

* 探针配置参考：https://kubernetes.io/zh-cn/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#define-startup-probes
* 内存、cpu配置参考：https://kubernetes.io/zh-cn/docs/tasks/configure-pod-container/assign-memory-resource/

K8S为我们提供的几种应用运行方式：Deployment、DaemonSet与Job，它们是Kubernetes最重要的核心功能提供者。本篇会主要介绍Deployment

## 一、Deployment资源创建

K8S支持两种创建资源的方式，分别是 使用kubectl命令直接创建 与 通过配置文件+kubectl apply创建

### 1.1 Kubectl命令直接创建

```bash
# 如果不存在空间，先创建空间
kubectl create namespace aspnetcore

# 部署了一个具有2个副本的k8s-test示例
kubectl run k8s-test --image=yasewang/k8s-test:latest --replicas=2 --namespace=aspnetcore
```

### 1.2 YAML配置文件创建

配置文件内容
  ```yaml
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: k8s-test-deployment
    namespace: aspnetcore
  spec:
    replicas: 2
    selector:
      matchLabels:
        app: k8s-test_webapi
    template:
      metadata:
        labels:
          app: k8s-test_webapi
      spec:
        containers:
        - name: k8s-test
          image: yasewang/k8stest
          ports:
          - containerPort: 80
  ```

定义完yaml文件之后就可以通过yaml文件来启动Delpoyment资源了，运行如下命令即可：

  ```bash
  kubectl apply -f k8s-test-delpoyment.yaml
  ```

### 1.3 其他补充内容

* 删除Deployment资源：

  ```bash
  kubectl delete deployment k8s-test-deployment

  # 或者通过配置文件删除
  kubectl delete -f k8s-test-deployment.yaml
  ```
* 执行之后，K8S会自动帮我们删除相关Deployment、ReplicaSet（副本集）以及Pod。
* 可以看出，直接通过kubectl创建会比较省力和快捷，但是它无法做到很好的管理，不适合正式的、规模化的部署，因此我们一般会更加倾向于采用配置文件的方式，但是使用配置文件要求我们熟悉yaml的语法，如果存在类似制表符之类的特殊字符都是无法成功执行的。

## 二、Deployment进阶

### 2.1 Deployment类型应用运行

1. 查看`k8s-test-deployment`状态：

  ```bash
  kubectl get deployment k8s-test-deployment -n aspnetcore
  ```
  ![1](http://cdn.go99.top/docs/devops/k8s/k8s-learning/deployment1.png)
  可以看到，对于我们的这个deployment，生成了2个副本且正常运行。
2. 查看更加详细的信息：

  ```bash
  kubectl describe deployment k8s-test-deployment -n aspnetcore
  ```
  ![2](http://cdn.go99.top/docs/devops/k8s/k8s-learning/deployment2.png)
  可以看到，K8S的`Deployment-Controller`为`k8s-test`创建了一个`ReplicaSet`名叫`k8s-test-deployment-8544cfc845`，后面的Pod就是由这个ReplicaSet来管理的。
3. 查看ReplicaSet的状态

  ```bash
  kubectl describe replicaset -n aspnetcore
  ```
  ![3](http://cdn.go99.top/docs/devops/k8s/k8s-learning/deployment3.png)

  从上图可以看出，这个ReplicaSet是由`Deployment k8s-test-deployment` 创建的。

  ![4](http://cdn.go99.top/docs/devops/k8s/k8s-learning/deployment4.png)

  从上图中的日志（Events代表日志）可以看出，两个副本Pod是由ReplicaSet-Controller创建的。
4. 查看Pod状态

  ```bash
  kubectl describe pod -n aspnetcore
  ```
  ![5](http://cdn.go99.top/docs/devops/k8s/k8s-learning/deployment5.png)
  可以看出，此Pod是由`ReplicaSet/k8s-test-deployment-8544cfc845`创建的。下图的日志记录了Pod的启动过程：

  ![6](http://cdn.go99.top/docs/devops/k8s/k8s-learning/deployment6.png)

  从日志中可以看到Pod的启动过程，如果启动过程中发生了异常（比如拉取镜像失败），都可以通过输出的错误信息查看原因。

### 2.2 伸缩Scale

所谓伸缩，是指在线实时增加或减少Pod的副本数量。在刚刚的部署中，我们在配置文件中定义的是2个副本，如下图所示：

![7](http://cdn.go99.top/docs/devops/k8s/k8s-learning/deployment7.png)

可以看到，两个副本分别位于`xb-node1` 和 `xb-node2`上面。一般默认情况下，K8S不会将Pod调度到Master节点上，虽然Master节点也是可以作为Node节点使用。

如果需要将副本数量从2扩展到3，只需要修改配置文件如下(增加、减少副本数量都一样操作)：

  ```yaml
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: k8s-test-deployment
    namespace: aspnetcore
  spec:
    replicas: 3
  ......
  ```
执行apply命令：

  ```bash
  kubectl apply -f k8s-test-deployment.yaml
  ```
  ![8](http://cdn.go99.top/docs/devops/k8s/k8s-learning/deployment8.png)

### 2.3 故障转移FailOver

所谓K8S中的故障转移（FailOver），就是当某个Node节点失效或宕机时，会将该Node上所运行的所有Pod转移到其他健康的Node节点上继续运行。

模拟xb-node2故障，强制关闭该节点：

  ```bash
  shutdown -h now
  ```
  ![9](http://cdn.go99.top/docs/devops/k8s/k8s-learning/deployment9.png)
等待一段时间后，当K8S检测到`xb-node2`不可用，会将`xb-node2`上的Pod最终标记为`Terminating`状态，并在`xb-node1`上新建两个Pod，维持副本总数量为3。

![9.1](http://cdn.go99.top/docs/devops/k8s/k8s-learning/deployment9.1.png)

当然，也可以从Dashboard中直观的看到：
![10](http://cdn.go99.top/docs/devops/k8s/k8s-learning/deployment10.png)
当xb-node2恢复后，Terminating的Pod会自动被删除，不过已经运行在xb-node1的Pod是不会重新调度回xb-node2的。
![11](http://cdn.go99.top/docs/devops/k8s/k8s-learning/deployment11.png)

### 2.4 使用label控制Pod运行的Node节点

默认情况下，K8S的Scheduler会均衡调度Pod到所有可用的Node节点，但是有些时候希望将指定的Pod部署到指定的Node节点。例如，一个I/O密集型的Pod可以尽量部署在配置了SSD的Node节点，又或者一个需要GPU的Pod可以尽量部署在配置了GPU的Node节点上。

不用担心，K8S为我们提供了label来实现这个功能，label是一个key/value对，可以灵活设置各种自定义的属性。比如，我们这里假设我们的k8s-test示例项目是一个I/O密集型的API，还假设xb-node1是一个配置了SSD的Node节点：

  ```bash
  kubectl label node xb-node1 disktype=ssd

  # 查看节点lables
  kubectl get node --show-labels
  ```
  可以看到，现在xb-node1多了一个label => disktype=ssd
  ![12](http://cdn.go99.top/docs/devops/k8s/k8s-learning/deployment12.png)

* 我们在配置文件中为要部署的应用指定label:

  ```yaml
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: k8s-test-deployment
    namespace: aspnetcore
  spec:
    replicas: 2
    selector:
      matchLabels:
        app: k8s-test_webapi
    template:
      metadata:
        labels:
          app: k8s-test_webapi
      spec:
        containers:
        - name: k8s-test
          image: yasewang/k8stest
          ports:
          - containerPort: 80
        nodeSelector:
          disktype: ssd
  ```
* 再次apply创建资源:

  ```bash
  kubectl apply -f k8s-test-deployment.yaml
  ```
  验证一下，所有的k8s-test的Pod全都调度到了xb-node1上面，符合预期：
  ![13](http://cdn.go99.top/docs/devops/k8s/k8s-learning/deployment13.png)
  如果xb-node1不再是配置SSD了，那么我们就可以为其删掉这个label了：

  ```bash
  kubectl label node xb-node1 disktype-
  ```
  注意，这里的 - 就代表删除，而且此时Pod不会重新部署，除非你删除配置文件中的配置然后再次apply

  ### 调度到指定名称的节点

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  nodeName: foo-node # 调度 Pod 到特定的节点
  containers:
  - name: nginx
    image: nginx
    imagePullPolicy: IfNotPresent

```