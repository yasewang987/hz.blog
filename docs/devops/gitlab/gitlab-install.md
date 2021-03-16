# Gitlab安装

## 使用Docker安装gitlab

```bash
docker run -d --name gitlab --restart always \
    -p 22443:443 -p 2280:80 -p 2222:22 \
    -v /path/to/conf:/etc/gitlab \
    -v /path/to/logs:/var/log/gitlab \
    -v /path/to/data:/var/opt/gitlab \
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
# 如果有前置的nginx做反向代理也可以使用域名  external_url 'http://aa.bb.com'
external_url 'http://192.168.31.43:2280'

# nginx 的监听端口号需要改成 80。
# 默认情况下 nginx 的监听端口号会从 external_url 中取，也就是 9080。
# 但在启动容器时，我们把宿主机 9080 端口导向了容器的 80 端口，所以容器内 nginx 服务端口应该为 80。
nginx['listen_port'] = 80

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