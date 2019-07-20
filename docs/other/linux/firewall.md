# Linux防火墙设置

## iptables防火墙

### 1. 基本操作

```bash
# 查看防火墙状态
service iptables status  
# 停止防火墙
service iptables stop  
# 启动防火墙
service iptables start  
# 重启防火墙
service iptables restart  
# 永久关闭防火墙
chkconfig iptables off  
# 永久关闭后重启
chkconfig iptables on
```
<!-- more -->

### 2. 开启指定端口

```bash
 vim /etc/sysconfig/iptables
# 加入如下代码
-A INPUT -m state --state NEW -m tcp -p tcp --dport 80 -j ACCEPT
```

## firewall防火墙

```bash
# 查看状态
systemctl status firewalld
firewall-cmd --state
# 开启、重启、关闭
service firewalld start
service firewalld restart
service firewalld stop

systemctl start firewalld
systemctl restart firewalld
systemctl stop firewalld

# 查看规则
firewall-cmd --list-all
# 查询开放的端口服务
firewall-cmd --permanent --list-services

# 查询、开放、关闭端口
firewall-cmd --query-port=8080/tcp
firewall-cmd --permanent --add-port=80/tcp
# 开放8080-8085tcp端口
firewall-cmd --permanent --add-port=8080-8085/tcp
# 关闭8080-8085tcp端口
firewall-cmd --permanent --remove-port=8080-8085/tcp
firewall-cmd --permanent --remove-port=8080/tcp

# 重启防火墙（修改配置后需要重启才能生效）
firewall-cmd --reload

# 参数解释
1、firwall-cmd：是Linux提供的操作firewall的一个工具；
2、--permanent：表示设置为持久；
3、--add-port：标识添加的端口；
```


