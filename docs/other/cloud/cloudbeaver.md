# Cloudbeaver

cloudbeaver是一款云数据库管理软件

官方地址：https://cloudbeaver.io/

## Cloudbeaver部署

* docker:

  ```bash
  # 拉镜像
  sudo docker pull dbeaver/cloudbeaver:latest

  mikdir -p /var/cloudbeaver/workspace

  # 运行测试
  sudo docker run --name cloudbeaver --rm -ti -p 4444:8978 -v /var/cloudbeaver/workspace:/opt/cloudbeaver/workspace dbeaver/cloudbeaver:latest

  # 守护模式（docker启动运行）
  sudo docker run --name cloudbeaver --rm -d --restart unless-stopped -p 4444:8978 -v /var/cloudbeaver/workspace:/opt/cloudbeaver/workspace dbeaver/cloudbeaver:latest

  # 允许访问本机数据库服务
  sudo docker run --name cloudbeaver --rm -d --restart unless-stopped --network host -p 4444:8978 -v /var/cloudbeaver/workspace:/opt/cloudbeaver/workspace dbeaver/cloudbeaver:latest

  # 其他设置参考官网
  ```

* podman（命令与docker一致）:

  ```bash
  mikdir -p /var/cloudbeaver/workspace

  podman run --name cloudbeaver -d -p 4444:8978 -v /var/cloudbeaver/workspace:/opt/cloudbeaver/workspace dbeaver/cloudbeaver:latest
  ```

## Cloudbeaver访问

http://localhost:4444