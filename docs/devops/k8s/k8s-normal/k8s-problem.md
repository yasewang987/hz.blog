# K8s问题排查

## k8s问题定位

1. 查看所有pod运行情况
    
    ```bash
    kubectl -n kube-system get pods
    ```
1. 获取有问题的pod节点报错信息

    ```bash
    kubectl -n kube-system logs -f coredns-6967fb4995-k9ts2
    ```
1. 根据报错信息查找解决方案

## connect: no route to host
    [参考资料](https://github.com/kubernetes/kubeadm/issues/193)
    
    ```bash
    systemctl stop kubelet
    systemctl stop docker
    iptables --flush
    iptables -tnat --flush
    systemctl start kubelet
    systemctl start docker
    ```

## no kind "Deployment" is registered for version "apps/v1"

将`apiVersion`改成 `extensions/v1beta1`

