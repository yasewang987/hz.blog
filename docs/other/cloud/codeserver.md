# Code-Server部署

```bash
# 下载镜像
docker pull codercom/code-server

# 准备文件夹
mkdir -p /home/coder/.config && cd /home/coder
docker run -itd --name code-server -p 127.0.0.1:18083:8080 \
  -v "$HOME/.config:/home/coder/.config" \
  -v "$PWD:/home/coder/project" \
  -u "$(id -u):$(id -g)" \
  -e "DOCKER_USER=$USER" \
  -e PASSWORD='123456'
  codercom/code-server:latest
```

## 基于镜像打包对应环境的镜像包

以 `python` 为例 `dockerfile1`:

```Dockerfile
FROM codercom/code-server
RUN sudo mv /etc/apt/sources.list /etc/apt/sources.list.bak \
    && echo 'deb https://mirrors.tuna.tsinghua.edu.cn/debian/ buster main contrib non-free' >> /home/coder/sources.list \
    && echo 'deb https://mirrors.tuna.tsinghua.edu.cn/debian/ buster-updates main contrib non-free' >> /home/coder/sources.list \
    && echo 'deb https://mirrors.tuna.tsinghua.edu.cn/debian/ buster-backports main contrib non-free' >> /home/coder/sources.list \
    && echo 'deb https://mirrors.tuna.tsinghua.edu.cn/debian-security buster/updates main contrib non-free' >> /home/coder/sources.list \
    && sudo mv /home/coder/sources.list /etc/apt/ \
    && sudo apt-get update && sudo apt-get upgrade -y && sudo apt-get install -y fonts-powerline python3 python3-pip vim \
    && sudo apt-get clean
```

```bash
docker build -t code-server:python -f dockerfile1 --no-cache .
```