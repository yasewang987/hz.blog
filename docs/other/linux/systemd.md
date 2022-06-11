# Linux守护进程管理Systemd

## Systemd简介

Systemd即为`system daemon`，是linux的一种init软件，用来启动和管理守护进程，它替代initd成为系统的第一个进程(PID=1)。管理后台服务的软件还有python开发的supervisor等。

`Systemd`管理系统资源时，所有的资源统称为`Unit`(单元)。每一个`Unit`都有一个配置文件，用于告诉`Systemd`怎么启动这个`Unit`。开机时`Systemd`从目录`/etc/systemd/system/`读取配置文件，该目录里面存放的大部分文件都是符号链接，指向目录`/lib/systemd/system/`(这个地址在不同系统中可能是不一致的，可以通过`whereis systemd 查看所有systemd的目录`)，真正的配置文件存放在`/lib/systemd/system/`目录下。


看一下Systemd管理防火墙的命令：`systemctl enable firewalld`这条命令的作用是让防火墙开机自启，执行这条命令时会在`/etc/systemd/system/`添加一个符号链接，指向`/lib/systemd/system`下的`firewalld.service`。开机时只会执行`/etc/systemd/system/`目录下的配置文件,通过防火墙配置文件的符号链接，执行`/lib/systemd/system`下的`firewalld.service`。相对的`systemctl disable firewalld`用于让防火墙开机不自启，实质上就是撤销`/etc/systemd/system/`目录下的符号链接。

通过`systemctl list-unit-files`查看配置文件
![img](http://cdn.go99.top/docs/other/linux/systemd1.png)
绿色的enabled表示开机启动，红色的disabled表示开机不启动，static表示不能执行，只能作为其他配置文件的依赖，masked表示禁止执行。

## Unit配置文件

我们这边使用一个netcore应用程序作为示例

1. 在`/lib/systemd/system/`目录中添加`Unit`配置文件`netcoretest.service`
1. 编辑Unit配置文件：

    ```bash
    [Unit]
    # 简单描述
    Description=run MySite on Centos

    [Service]
    # 工作目录
    WorkingDirectory=/var/www/MySite
    # 开启时执行的命令
    ExecStart=/usr/bin/dotnet /var/www/MySite1/MySite1.dll
    # 出错造成服务停止时重启
    Restart=on-failure # 服务崩溃时，十秒钟重启一次
    RestartSec=10
    # 用户
    User=hzgod

    [Install]
    # 该服务所在的target
    # 这里符号链接放在/usr/lib/systemd/system/multi-user.target.wants目录下
    WantedBy=multi-user.target
    ```
1. 启动服务：`sudo systemctl start netcoretest.service`
1. 设置开机启动：`sudo systemctl enable netcoretest.service`
1. 查看服务是否启动成功`sudo systemctl status netcoretest.service`
    ![img](http://cdn.go99.top/docs/other/linux/systemd2.png)

## 配置参数详解

### Unit
通常是配置文件的第一个区块，用来定义 Unit 的元数据，以及配置与其他 Unit 的关系。它的主要字段如下:

    Description：简短描述
    Documentation：文档地址
    Requires：当前 Unit 依赖的其他 Unit，如果它们没有运行，当前 Unit 会启动失败
    Wants：与当前 Unit 配合的其他 Unit，如果它们没有运行，当前 Unit 不会启动失败
    BindsTo：与Requires类似，它指定的 Unit 如果退出，会导致当前 Unit 停止运行
    Before：如果该字段指定的 Unit 也要启动，那么必须在当前 Unit 之后启动
    After：如果该字段指定的 Unit 也要启动，那么必须在当前 Unit 之前启动
    Conflicts：这里指定的 Unit 不能与当前 Unit 同时运行
    Condition...：当前 Unit 运行必须满足的条件，否则不会运行
    Assert...：当前 Unit 运行必须满足的条件，否则会报启动失败

### [Install]

通常是配置文件的最后一个区块，用来定义如何启动，以及是否开机启动。它的主要字段如下：

    WantedBy：它的值是一个或多个 Target，当前 Unit 激活时（enable）符号链接会放入/etc/systemd/system目录下面以 Target 名 + .wants后缀构成的子目录中
    RequiredBy：它的值是一个或多个 Target，当前 Unit 激活时，符号链接会放入/etc/systemd/system目录下面以 Target 名 + .required后缀构成的子目录中
    Alias：当前 Unit 可用于启动的别名
    Also：当前 Unit 激活（enable）时，会被同时激活的其他 Unit


### [Service]

用来 Service 的配置，只有 Service 类型的 Unit 才有这个区块。它的主要字段如下:

    Type：定义启动时的进程行为。它有以下几种值。
    Type=simple：默认值，执行ExecStart指定的命令，启动主进程
    Type=forking：以 fork 方式从父进程创建子进程，创建后父进程会立即退出
    Type=oneshot：一次性进程，Systemd 会等当前服务退出，再继续往下执行
    Type=dbus：当前服务通过D-Bus启动
    Type=notify：当前服务启动完毕，会通知Systemd，再继续往下执行
    Type=idle：若有其他任务执行完毕，当前服务才会运行
    ExecStart：启动当前服务的命令
    ExecStartPre：启动当前服务之前执行的命令
    ExecStartPost：启动当前服务之后执行的命令
    ExecReload：重启当前服务时执行的命令
    ExecStop：停止当前服务时执行的命令
    ExecStopPost：停止当其服务之后执行的命令
    RestartSec：自动重启当前服务间隔的秒数
    Restart：定义何种情况 Systemd 会自动重启当前服务，可能的值包括always（总是重启）、on-success、on-failure、on-abnormal、on-abort、on-watchdog
    TimeoutSec：定义 Systemd 停止当前服务之前等待的秒数
    Environment：指定环境变量

注意：一旦修改配置文件，就要让 Systemd重新加载配置文件，然后重新启动，否则修改不会生效，命令如下：

    ```bash
    sudo systemctl daemon-reload  
    sudo systemctl restart xxx.service
    ```

## Systemd常用命令

Systemctl是Systemd的主命令，我们经常用到的命令如下：

```bash
# 立即启动一个服务
$ sudo systemctl start firewalld.service

# 立即停止一个服务
$ sudo systemctl stop firewalld.service

# 重启一个服务
$ sudo systemctl restart firewalld.service

# 杀死一个服务的所有子进程
$ sudo systemctl kill firewalld.service

# 重新加载一个服务的配置文件
$ sudo systemctl reload firewalld.service

# 重载所有修改过的配置文件
$ sudo systemctl daemon-reload

# 显示某个 Unit 的所有底层参数
$ systemctl show firewalld.service
```

## python示例

* 在`/root`创建`xx`文件

```py
#!/usr/bin/python
import time
i=0
while True:
    print (i)
    i+=1
    time.sleep(20)
```

* 在`/root`目录创建 `xx.service`

```txt
[Unit]
Description=xx service
[Service]
ExecStart=python3 /root/xx
[Install]
WantedBy=multi-user.target
```

* 设置`systemctl`

```bash
# 开机启动
systemctl -f enable /root/xx.service

# 启动xx服务
systemctl start xx

# 查看状态
systemctl status xx
```