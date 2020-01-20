# K8s问题排查

## k8s.gcr.io镜像无法拉取问题

将镜像名的`k8s.gcr.io`改为`gcr.azk8s.cn/google-containers`

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

##  Unable to connect to the server: x509: certificate signed by unknown authority (possibly because of “crypto/rsa: verification error” while trying to verify candidate authority certificate “kubernetes”)

在`/etc/profile`文件中添加如下内容
```bash
export KUBECONFIG=/etc/kubernetes/kubelet.conf
```

## etcd容器无法启动

```bash
sudo kubeadm reset
sudo kubeadm init phase certs all
sudo kubeadm init phase kubeconfig all
sudo kubeadm init phase control-plane all --pod-network-cidr 10.244.0.0/16
sudo sed -i 's/initialDelaySeconds: [0-9][0-9]/initialDelaySeconds: 240/g' /etc/kubernetes/manifests/kube-apiserver.yaml
sudo sed -i 's/failureThreshold: [0-9]/failureThreshold: 18/g'             /etc/kubernetes/manifests/kube-apiserver.yaml
sudo sed -i 's/timeoutSeconds: [0-9][0-9]/timeoutSeconds: 20/g'            /etc/kubernetes/manifests/kube-apiserver.yaml
sudo kubeadm init --v=1 --skip-phases=certs,kubeconfig,control-plane --ignore-preflight-errors=all --pod-network-cidr 10.244.0.0/16
```

