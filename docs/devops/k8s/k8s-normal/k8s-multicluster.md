# Kubernetes - Kubectl多集群管理

kubectl 本质上是一个与 kube-apiserver 做 7 层通信的客户端工具。

## 直接修改配置文件

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
