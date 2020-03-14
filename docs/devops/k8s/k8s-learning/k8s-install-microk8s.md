# MicroK8s安装

## 参考资料

官网地址：https://microk8s.io/docs/

## 安装步骤

```bash
# 1安装
sudo snap install microk8s --classic --channel=1.16/stable

# 2检查状态
microk8s.status --wait-ready

# 如果报告microk8s is not running,(需要重启microk8s)【sudo microk8s.reset】
/var/snap/microk8s/current/args/containerd.toml:
/var/snap/microk8s/current/args/containerd-template.toml:
k8s.gcr.io 替换为： gcr.azk8s.cn/google-containers

# 查看信息
microk8s.kubectl get nodes
microk8s.kubectl get services

# 修改命名别名
vim ~/.bash_aliases
alias kubectl='microk8s.kubectl'
source ~/.bash_aliases

# 启动addons组件
microk8s.enable dns dashboard
```

启用系统自带的dashboard会有几个镜像拉不下来，没有找到修改镜像地址的地方