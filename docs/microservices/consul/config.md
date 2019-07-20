# Consul配置文件

* [Consul常用配置文件](#configfile)
* [Consul配置文件参数](#configparams)
* [Consul多集群配置](#configwan)

---

<h2 id="configfile">Consul常用配置文件<h2>

### 一、服务端配置文件

1. 配置文件【`server_config.json`】：
    ```json
    {
        "datacenter": "Aliyun",
        "node_name": "Aliyun.Server",
        "data_dir": "./Server/data",
        "server": true,
        "bootstrap": true,
        "ui": true,
        "ports": {
            "http": 28500,
            "dns": 28600,
            "grpc": 28400,
            "server": 28300,
            "serf_lan": 28301,
            "serf_wan": 28302
        },
        "client_addr": "0.0.0.0",
        "bind_addr": "10.25.39.83", // 内网地址
        "advertise_addr_wan": "139.196.148.x"  // 外网地址
    }
    ```
1. Linux服务器运行命令：`consul agent -config-file server_config.json`
1. Windows注册自动启动服务【`RegisterConsulServer.bat`】：
    ```bat
    sc create Consul-Server binPath= "E:\TCSOFT\consul_1.4.4_windows_amd64\consul.exe agent -config-file E:\TCSOFT\consul_1.4.4_windows_amd64\Server\server_config.json" start= auto
    ```

### 二、客户端配置文件

1. 配置文件【`client_config.json`】：
    ```json
    {
        "datacenter": "Aliyun",
        "node_name": "Aliyun.Client",
        "data_dir": "./Client/data",
        "bind_addr": "10.25.39.83", // 服务的绑定地址，要让consul服务端内访问到（不是同一局域网的，使用外网地址）
        "retry_join": ["10.25.39.83:28301"], // 与consul服务端不在同一局域网，需要使用consul服务端的外网地址注册
        "services": [
            {
                "id": "Aliyun.TC.PayService01",
                "name" : "TC.PayService",
                "tags": ["Aliyun","PayService"],
                "address": "10.25.39.83", // 同bind_addr
                "port": 20201,
                "checks": [
                    {
                        "name": "payservice01_check",
                        "http": "http://10.25.39.83:20201/health", // 同bind_addr
                        "interval": "10s",
                        "timeout": "5s"
                    }
                ]
            }
        ]
    }
    ```
    > 我这边的客户端与服务器在同一台服务器（只要内网可以访问到consul服务端），所以在join的时候使用内网地址，如果不是同一个局域网的，需要使用consul外网地址join。
1. Linux服务器运行命令：`consul agent -config-file client_config.json`
1. Windows注册自动启动服务【`RegisterConsulClient.bat`】：
    ```bat
    sc create Consul-Client binPath= "E:\TCSOFT\consul_1.4.4_windows_amd64\consul.exe agent -config-file E:\TCSOFT\consul_1.4.4_windows_amd64\Client\client_config.json" start= auto
    ```
---

<h2 id="configparams">Consul常用配置文件</h2>

* 参考官网即可：https://www.consul.io/docs/agent/options.html

参数含义：  
* -server表示启动一个服务
* -bootstrap-expect 1表示等待多少个节点再启动，这里1个，就是自己一个就启动了
* -node=localServer 就是给consul服务起个别名为localServer
* -bind=172.18.32.24x 绑定内网ip
* -advertise-wan=120.77.45.1x绑定外网ip
* -data-dir /opt/data1 数据存储目录为/opt/data1
* -dc=ali-dc1给数据中心起个别名ali-dc1

---

<h2 id="configwan">Consul多集群配置</h2>

注意：对于不在同一局域网集群的节点，需要在每个局域网开通一个consul server，通过server同步数据。

阿里云:
```bash
consul agent -server -bootstrap-expect 1 -node=localServer -bind=172.18.32.24x -advertise-wan=120.77.45.1x -data-dir /opt/data1 -dc=ali-dc1
```

腾讯云：
```bash
consul agent -server -bootstrap-expect 1 -node=localServer -bind=0.0.0.0 -advertise-wan=119.29.233.7x -data-dir c:/consul -dc=tx-dc1
```
-bind=0.0.0.0不行话，换成具体ip，0.0.0.0表示任意ip

本地：
```bash
consul agent -server -bootstrap-expect 1 -node=localServer -bind=192.168.0.12x -advertise-wan=58.62.202.4x -data-dir /opt/data1 -dc=deepin-dc1
```

把其余两个节点加入到阿里云节点中
```bash
consul join -wan 120.77.45.1x
```

阿里云 wan链接节点情况:
```bash
root@iZwz96uh8912ewgq9yv5nxZ:~# consul members -wan
Node                    Address             Status  Type    Build  Protocol  DC
localServer.ali-dc1     120.77.45.1x:8302   alive   server  0.9.2  2       ali-dc1
localServer.deepin-dc1  58.62.202.4x:8302   alive   server  0.9.2  2     deepin-dc1
localServer.tx-dc1      119.29.233.7x:8302  alive   server  0.9.2  2       tx-dc1
```