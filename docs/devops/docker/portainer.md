# Portainer容器管理系统

## 安装Portainer

```bash
# 下载镜像
docker pull portainer/portainer-ce

# 创建目录
mkdir /opt/portainer

# 启动容器
docker run -d --restart=always \
-p 19002:9000 \
-v /opt/portainer:/data \
-v /var/run/docker.sock:/var/run/docker.sock \
--name portainer portainer/portainer-ce
```

容器启动之后，通过 `http://ip:19002` 访问，第一次需要设置管理员账号密码

## 添加管理服务器

修改服务器的 `docker.service` 文件，在 `ExecStart` 后添加 `tcp://0.0.0.0:2375`, 这里最好不要用 `0.0.0.0`，用本机的ip

修改完成后重启docker服务

```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

登录 portainer 系统后，选择 `Environments > Add environment` ,选择 `Docker API` 填写如下信息:

```
Name: 服务器名
Environment URL: tcp://服务器ip:2375
Public IP: 服务器ip
```

添加之后即可。
