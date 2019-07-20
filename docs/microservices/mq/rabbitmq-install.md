
# RabbitMQ安装

* 官网: https://www.rabbitmq.com/

## Docker安装

DockerHub地址：https://hub.docker.com/_/rabbitmq/

1. 选择安装带web管理页面的版本：`docker pull rabbitmq:3.7.14-management`(hub页面上能查到版本信息，尽量选择安装稳定版本)

1. 运行容器：
    ```bash
    $ docker run -d -p 5672:5672 -p 15672:15672 -v /data/rabbitmq/pos:/var/lib/rabbitmq --hostname pos --name rabbit-pos -e RABBITMQ_DEFAULT_USER=pos -e RABBITMQ_DEFAULT_PASS=cc324100 -e RABBITMQ_DEFAULT_VHOST=pos_vhost rabbitmq:3-management
    ```
    > 说明：-v（将数据保存到宿主机的`/data/rabbitmq/pos`里），-e指定环境变量（RABBITMQ_DEFAULT_VHOST：默认虚拟机名；RABBITMQ_DEFAULT_USER：默认的用户名；RABBITMQ_DEFAULT_PASS：默认用户名的密码）
1. 查看容器运行状态：`docker ps`
1. 打开web管理端：`http://ServerIP:15672`