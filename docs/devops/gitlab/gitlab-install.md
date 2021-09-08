# Gitlab安装

## 使用Docker安装gitlab

```bash
docker run -d --name gitlab --restart always \
    -p 2443:443 -p 2280:2280 -p 2222:2222 \
    -v $PWD/conf:/etc/gitlab \
    -v $PWD/logs:/var/log/gitlab \
    -v $PWD/data:/var/opt/gitlab \
    gitlab/gitlab-ce:latest
```

* 注意不要把宿主机的22端口映射到容器的22端口

进入容器

```bash
docker exec -it gitlab bash
```


修改配置文件 `/etc/gitlab/gitlab.rb`

```conf
# external_url 为对外展示的 HTTP 地址，包括 HTTP 方式的克隆地址和仓库文件的跳转链接中的域名。
# 这个地址可以携带端口，可以使用 IP 也可以使用域名，无论你 GitLab 服务前端还有没有设置反向代理来做域名解析，这里只需要是你最终需要展示在 GitLab 页面里的 HTTP 链接即可。
# 如果有前置的nginx做反向代理也可以使用域名  external_url 'http://aa.bb.com:2280'
external_url 'http://192.168.31.43:2280'

# nginx 的监听端口号需要改成 80。
# 默认情况下 nginx 的监听端口号会从 external_url 中取，也就是 2280
nginx['listen_port'] = 2280

# 修改 SSH 方式克隆地址
# SSH 方式克隆地址中的域名部分会从 external_url 中取，我们这里需要再修改一下端口号。
gitlab_rails['gitlab_shell_ssh_port'] = 2222

# 修改时区
gitlab_rails['time_zone'] = 'Asia/Shanghai'

# 新用户默认不可创建项目组
gitlab_rails['gitlab_default_can_create_group'] = false
```

生效配置文件

```bash
gitlab-ctl reconfigure
```

登陆gitlab之后做一些其他配置

1. 关闭公开注册

    关闭后台登录界面的注册入口，禁止人员打开后台自行注册，只有管理员可以手动注册新用户。

    管理员登录后台之后依次点击：

    Admin Area -> Settings -> Genenal -> Sign-up restrictions -> Sign-up enabled

    取消打勾并保存。

1. 关闭 Auto DevOps
    
    新建的项目默认会开启 Auto DevOps。提交代码时，如果项目仓库内找不到 CI 配置文件，则会运行 Auto DevOps 流水线。

    管理员登录后台之后依次点击：

    Admin Area -> Settings -> CI/CD -> Continuous Integration and Deployment -> Default to Auto DevOps pipeline for all projects

    取消打勾并保存。

## 问题总结

* `Gitlab Docker`容器中SSH端口失效问题：

    在 Gitlab 配置文档`/home/gitlab/config/gitlab.rb` 中，将 `SSH` 协议的端口设置为 `2222` 了，但是在一些情况下会出现用 `SSH` 协议的 `Url` 执行网络同步操作时提示"访问被拒，可能是权限问题" .

    例如在我在服务器上`sudo docker rm gitlab` 之后再重新 `sudo docker run`之后就会重现以上问题。

    到服务器上查看ssh进程状态`sudo ps -aux | grep sshd`,一般会有一条信息 `/usr/sbin/sshd -D -f /assets/sshd_config -e` ,但是在物理机上一般默认的配置路径是`/etc/ssh/sshd_config`，所以应该是容器里面的ssh。

    `docker exec -it gitlab bash` 进入容器之后修改配置文件 `vim /assets/sshd_config`, 将里面的 `Port 22` 改成 `Port 2222` 保存退出。然后重启ssh服务`service ssh restart`。


