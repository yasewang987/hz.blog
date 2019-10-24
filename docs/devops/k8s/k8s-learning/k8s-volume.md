# Kubernetes - Volume

k8s和docker一样也提供了数据持久化方案，存储模型Volume。其本质也是一个目录。

需要注意的是：k8s Volume的生命周期独立于容器，Pod中的容器可能被销毁、重建，但是volume会报保留

当volume被挂载到pod上时，pod中的所有容器都能访问该volume。

k8s中支持的volume类型：emptyDir,hostPath,NFS,Ceph以及阿里云等云服务商提供的存储，不管哪种类型的volume，pod认为所有的volume就是一个目录。

## 使用Volume

* emptyDir：属于k8s最基础的持久化方案，emptyDir提供的持久化是相对于容器来说的，但是对于pod来说不是持久的，因为在pod删除的时候，Volume的内容也会一起被删除，emptyDir Volume生命周期与Pod一致，所以在实际应用中基本上不会用这种类型。

* hostPath：相对于emptyDir来说，hostPath方式解决了emptyDir的生命周期问题，pod删除时，Volume中的内容不会被删除，但是如果Node节点Down掉，hostPath也无法访问了。