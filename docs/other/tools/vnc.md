# VNC

## Ubuntu18.04

先将系统源改成清华源或者国内其他的源

* 安装 xubuntu-desktop
```bash
apt install xubuntu-desktop
```

* 安装VNC Server
```bash
apt install install tightvncserver
#启动VNCServer(并输入密码，同时会生成初始配置文件)
vncserver
#关掉已启动的进程
vncserver -kill :1
```

* 修改VNC Server配置文件,`vim ~/.vnc/xstartup`
```bash
#!/bin/sh
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
 
[ -x /etc/vnc/xstartup ] && exec /etc/vnc/xstartup
[ -r $HOME/.Xresources ] && xrdb $HOME/.Xresources
xsetroot -solid grey

vncconfig -iconic &

xfce4-session & startxfce4 & 

x-terminal-emulator -geometry 80x24+10+10 -ls -title "$VNCDESKTOP Desktop" &

sesion-manager & xfdesktop & xfce4-panel &
xfce4-menu-plugin &
xfsettingsd &
xfconfd &
xfwm4 &
```

* 打开防火墙(如有需要)
```bash
iptables -I INPUT -p tcp --dport 5900 -j ACCEPT
iptables -I INPUT -p tcp --dport 5901 -j ACCEPT
```

* 设置vnc开机自启动
```bash
touch /etc/init.d/vncserver 
chmod +x /etc/init.d/vncserver
cat > /etc/init.d/vncserver << EOF
#!/bin/bash
 
### BEGIN INIT INFO
# Provides:          vnc4server
# Required-Start:    $local_fs $network
# Required-Stop:     $local_fs
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: VNC
# Description:       VNC Service
### END INIT INFO
case "$1" in
start)
su  -c "vncserver -depth 16 -geometry 1440x900" root
;;
stop)
vncserver -kill :1
;;
*)
echo $"Usage: $0 {start|stop}"
exit 1
esac
EOF
```

* 需再次打开文件确认`$0`和`$1`两个内容有没有被漏掉或转义

* 启动VNC服务器

```bash
/etc/init.d/vncserver start
```

* 安装字体输入法

```bash
apt install ttf-arphic-* scim-pinyin im-switch
```

* 安装中文支持

```bash
apt install zhcon
```

* 删除xubuntu-desktop

```bash
sudo apt purge xubuntu-desktop xubuntu-icon-theme xfce4-*
sudo apt purge plymouth-theme-xubuntu-logo plymouth-theme-xubuntu-text
sudo apt autoremove
```

* 修改VNC密码

```bash
vncpasswd
```

* 手动启动VNC并设置分辨率

```bash
vncserver -depth 16 -geometry 1440x900
```

## 银河麒麟V10