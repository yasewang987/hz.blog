# Kubernetes - DaemonSet

## DaemonSet介绍

DaemonSet是针对一些特殊场景的应用，例如守护进程

DaemonSet保证 **每个Node上都只运行一个Pod副本**

使用场景：集群日志、监控等信息收集

* 日志收集：fluented, logstash等
* 系统监控：Prometheus Node Exporter等
* 系统程序：kube-proxy,kube-dns等

## K8s中的DaemonSet

在K8S中，就有一些默认的使用DaemonSet方式运行的系统组件，比如我们可以通过下面一句命令查看：

```bash
kubectl get daemonset --namespace=kube-system
```
![1](http://cdn.go99.top/docs/devops/k8s/k8s-learning/daemonset1.png)

可以看到，`calico-node` 和 `kube-proxy` 是K8S以DaemonSet方式运行的系统组件，分别为K8S集群负责提供网络连接支持和代理支持

再查看一下Pod副本在各个节点的分布情况：

```bash
kubectl get pod --namespace=kube-system -o wide
```
![2](http://cdn.go99.top/docs/devops/k8s/k8s-learning/daemonset2.png)
可以看到，它们两分布在各个Node节点上（这里是我的K8S集群中的所有节点了），且每个节点上只有一个Pod副本。

## DaemonSet创建、运行

这里使用`Prometheus Node Exporter`举例（`Prometheus`是流行的系统监控方案，而`Node Exporter`负责收集节点上的metrics监控数据，并将数据推送给`Prometheus`。Prometheus则负责存储这些数据，`Grafana`最终将这些数据通过网页以图形的形式展现给用户）

1. 新建yaml文件，配置DaemonSet资源清单

    ```yaml
    apiVersion: apps/v1
    kind: DaemonSet
    metadata:
      name: exporter-daemonset
      namespace: aspnetcore
    spec:
      selector:
        matchLabels:
          app: prometheus
      template:
        metadata:
          labels:
            app: prometheus
        spec:
          hostNetwork: true
          containers:
          - name: exporter
            image: prom/node-exporter
            imagePullPolicy: IfNotPresent
            command:
            - /bin/node_exporter
            - --path.procfs
            - /host/proc
            - --path.sysfs
            - /host/sys
            -  --collector.filesystem.ignored-mount-points
            - ^/(sys|proc|dev|host|etc)($|/)
            volumeMounts:
            - name: proc
              mountPath: /host/proc
            - name: sys
              mountPath: /host/sys
            - name: root
              mountPath: /rootfs
          volumes:
          - name: proc
            hostPath:
              path: /proc
          - name: sys
            hostPath:
              path: /sys
          - name: root
            hostPath:
              path: / 
    ```
  1. 通过kubectl创建资源：

      ```bash
      kubectl apply -f prometheus-daemonset.yaml
      ```
  1. 等一会儿再去查看DaemonSet的资源状态：

      ```bash
      kubectl get daemonset -n aspnetcore

      # 查看Pod在节点Node中的分布
      kubectl get pod -o wide -n aspnetcore
      ```
      ![3](http://cdn.go99.top/docs/devops/k8s/k8s-learning/daemonset3.png)
      可以看出，我们的Prometheus Node Exporter部署成功，且分别在两个Node节点都只部署了一个Pod副本