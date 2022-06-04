# VNC虚拟桌面

## X11VNC部署虚拟桌面

需要先准备好 `python` 和 `docker` 环境

git地址：https://github.com/x11vnc/x11vnc-desktop ，自己构建镜像可以参考这个文档

```bash
# 下载启动文件
wget https://raw.githubusercontent.com/x11vnc/x11vnc-desktop/master/x11vnc_desktop.py

# 查看参数含义
python x11vnc_desktop.py -h

# 执行，这个过程会自动下载镜像，并启动docker容器
# 如果遇到报错一般是使用root账号的原因，可以删除相关的检测代码
# 也可以修改py文件修改里面默认的6080等端口
python x11vnc_desktop.py -t zh_CN --password 'abc123456'

# 启动之后即可通过浏览器或者vncview等软件连接
web: http://localhost:30008/vnc.html
vncview: localhost:5950 with password bc9900956
ssh: ssh -X -p 2222 ubuntu@localhost -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no
```