# Code-Server部署

```bash
# 下载镜像
docker pull codercom/code-server

# 准备文件夹
mkdir -p /home/coder/.config && cd /home/coder
docker run -itd --name code-server -p 18083:8080 \
-v "$HOME/.config:/home/coder/.config" \
-v "$PWD:/home/coder/project" \
-u "$(id -u):$(id -g)" \
-e "DOCKER_USER=$USER" \
-e PASSWORD='123456'
codercom/code-server:latest


# 切换 root 用户
sudo su
# 更新源
sed -i "s/archive.ubuntu.com/mirrors.aliyun.com/g" /etc/apt/sources.list && apt update
# 安装 python
apt install -y python
# 安装 nodejs，自行调整版本
curl -sL https://deb.nodesource.com/setup_14.x | sudo bash
apt install -y nodejs
# 安装 jdk
apt install -y openjdk-8-jdk
```

## 基于镜像打包对应环境的镜像包

清华源替换参考资料：https://mirrors.tuna.tsinghua.edu.cn/help/debian/

以 `python` 为例 `dockerfile1`:

```Dockerfile
FROM codercom/code-server
RUN sudo mv /etc/apt/sources.list /etc/apt/sources.list.bak \
    && echo 'deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bullseye main contrib non-free' >> /home/coder/sources.list \
    && echo 'deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bullseye-updates main contrib non-free' >> /home/coder/sources.list \
    && echo 'deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bullseye-backports main contrib non-free' >> /home/coder/sources.list \
    && echo 'deb https://mirrors.tuna.tsinghua.edu.cn/debian-security bullseye-security main contrib non-free' >> /home/coder/sources.list \
    && sudo mv /home/coder/sources.list /etc/apt/ \
    && sudo apt-get update && sudo apt-get upgrade -y && sudo apt-get install -y fonts-powerline python3 python3-pip vim \
    && sudo apt-get clean
```

```bash
docker build -t code-server:python -f dockerfile1 --no-cache .
```