# Kubernetes - 集群管理

kubectl 本质上是一个与 kube-apiserver 做 7 层通信的客户端工具。

## kubectl安装

参考资料：https://kubernetes.io/zh-cn/docs/tasks/tools/install-kubectl-linux/#install-kubectl-binary-with-curl-on-linux

```bash
#### linux-amd
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl.sha256"
echo "$(cat kubectl.sha256)  kubectl" | sha256sum --check
# 输出如下说明ok
kubectl: OK
# 安装
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
# 没有目标系统的 root 权限
chmod +x kubectl
mkdir -p ~/.local/bin
mv ./kubectl ~/.local/bin/kubectl
# 之后将 ~/.local/bin 附加（或前置）到 $PATH

# 查看版本
kubectl version --client
```

## kubectl管理单集群

默认情况下，`kubectl` 在 `$HOME/.kube` 目录下查找名为 `config` 的文件。 你可以通过设置 `KUBECONFIG` 环境变量或者设置 `--kubeconfig` 参数来指定其他 `kubeconfig` 文件。

所以可以拷贝对应k8s集群的kubeconfig文件到本地的 `$HOME/.kube` 目录下，默认读取 config 文件

```bash
# 使用指定的kubeconfig
export KUBECONFIG=config-cluster1

# 或者在执行命令的时候加上参数
kubectl --kubeconfig config-cluster2 get nodes
```

## 管理多集群

```yaml
apiVersion: v1
# 可以配置多个集群信息
clusters:
- cluster:
    certificate-authority-data: abc123
    server: https://10.111.6.141:6443
  name: dev-cluster
- cluster:
    certificate-authority-data: abc123
    server: https://172.16.2.190:6443
  name: test-cluster

# 配置上下文，管理集群就是使用该上下文名称切换
contexts:
- context:
    cluster: dev-cluster
    user: "uername"
  name: dev
- context:
    cluster: test-cluster
    user: "uername"
  name: test-cluster
current-context: test
kind: Config
preferences: {}

# 集群中对应的用户信息
users:
- name: "uername"
  user:
    client-certificate-data: abc456
    client-key-data: abc123
```

> 也可以通过命令行修改, 使用帮助命令 `kubectl config -h` 查看具体方法

## 选定要使用的集群

```bash
kubectl config use-context ${Context_Name}
```
