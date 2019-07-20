# Consul常用操作

需要了解Consul常用操作记录可以使用`consul -h`命令查看

1. 查看`Consul`集群成员
    ```bash
    # consul部署在独立服务器
    $ consul members

    # consul部署在docker中
    $ docker exec container-name consul members
    ```

1. 退出`Consul`集群
    ```bash
    # 服务器
    $ consul leave

    # docker
    $ docker exec container-name consul leave
    ```
