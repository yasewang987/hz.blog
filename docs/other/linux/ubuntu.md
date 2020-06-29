# Ubuntu服务器常用操作

## 下载源修改

```bash

# 查看系统版本
lsb_release -a

# 根据查到的版本去阿里的镜像源中找对应版本
http://mirrors.aliyun.com/

默认下载源很慢，改成阿里的下载速度超快
sudo vim /etc/apt/sources.list

将文件内容替换成 国内源

更新
sudo apt-get update
sudo apt-get upgrade
```

## 修改IP，DNS

```bash
vim /etc/netplan/xx-netcfg.yaml

# DNS修改(修改文件中的nameservers)
nameservices:
  addresses: [8.8.8.8,114.114.114.114]
# 生效
netplan apply
```

## SNAP

* 输入`snap help`查看具体命令  
安装snap: `sudo apt install snapd`  
启动snap安装的程序：`snap run xxxx`  
查看snap安装的程序：`snap list`  

---

## NFS

```bash
sudo apt-get install nfs-kernel-server

vim /etc/exports
# 加入如下内容 *表示所有ip都可以访问
/data/fileshare   *(rw,sync,no_subtree_check,no_root_squash)

mkdir -p   /data/fileshare

# nfs是一个RPC程序，第一步安装成功后，使用它时需要映射提前映射好端口，映射端口，通过rpcbind 设定
sudo /etc/init.d/rpcbind restart

# 重启nfs服务
sudo /etc/init.d/nfs-kernel-server restart 

#---------------
# 挂载上面的共享
vim /etc/fstab
# 添加
192.168.22.22:/data/fileshare /data/fileshare               nfs    rw,tcp,soft  0  0
# 保存
# 执行
mount -a
# 取消挂载
umount   /data/fileshare   
```