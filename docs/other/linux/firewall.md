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
# 重启
service iptables restart
```

## ufw防火墙

规则存放目录：`/etc/ufw`

```bash
# 查看状态
sudo ufw status

# 允许 http 访问
$ sudo ufw allow 80
# 拒绝 smtp 访问
$ sudo ufw deny 25

# 范围端口开放(所有协议)
ufw allow 7100:7200/tcp

# 直接使用服务名称开放防火墙
sudo ufw allow http
sudo ufw allow https

# 阻止来自一个 IP 地址的连接
sudo ufw deny from 208.176.0.50

# 允许 IP 地址(192.168.1.1 到 192.168.1.254)，通过 3360(MySQL)
sudo ufw allow from 192.168.1.0/24 to any port 3306

# 禁止从23.24.25.0/24对80和443端口的访问
sudo ufw deny proto tcp from 23.24.25.0/24 to any port 80,443

# 删除老配置
sudo ufw delete allow 8069

# 禁用ufw
sudo ufw disable
# 启用ufw
sudo ufw enable
# 重置 UFW 将会禁用 UFW，删除所有激活的规则。
sudo ufw reset
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


