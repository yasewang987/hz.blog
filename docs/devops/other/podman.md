# Podman

官方地址：https://podman.io/

## 安装

### 一、WSL2安装podman

1. 先安装podman

    ```bash
    . /etc/os-release
    sudo sh -c "echo 'deb http://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/x${NAME}_${VERSION_ID}/ /' > /etc/apt/sources.list.d/devel:kubic:libcontainers:stable.list"
    wget -nv https://download.opensuse.org/repositories/devel:kubic:libcontainers:stable/x${NAME}_${VERSION_ID}/Release.key -O Release.key
    sudo apt-key add - < Release.key
    sudo apt-get update -qq
    sudo apt-get -qq -y install podman
    sudo mkdir -p /etc/containers
    echo -e "[registries.search]\nregistries = ['docker.io', 'quay.io']" | sudo tee /etc/containers/registries.conf
    ```
1. 修改`containers.conf`配置

    ```bash
    # 如果在： /etc/containers/containers.conf 存在配置文件只需要修改该配置文件即可
    # 如果在位置不存在，则需要从 /usr/share/containers/containers.conf 拷贝文件到 $HOME/.config/containers/containers.conf 或者 /etc/containers/containers.conf

    vim /etc/containers/containers.conf
    
    # 设置下面2个值
    cgroup_manager = "cgroupfs"
    events_logger = "file"
    ```

### 二、podman使用

兼容`docker`命令

如果需要直接使用docker命令则只需要作如下操作：

```bash
echo "alias docker=podman" >> .bashrc
source .bashrc
```