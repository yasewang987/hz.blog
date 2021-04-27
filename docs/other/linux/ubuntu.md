# Ubuntu服务器常用操作

## 下载源修改

参考：https://mirrors.tuna.tsinghua.edu.cn/help/ubuntu/

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
sudo vim /etc/systemd/resolved.conf

DNS=114.114.114.114 233.5.5.5 8.8.8.8
```

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

## 禁用休眠

查看是否休眠

```bash
systemctl status sleep.target

# 内容如下
● sleep.target - Sleep
    Loaded: loaded (/lib/systemd/system/sleep.target; static; vendor preset: enabled)
    Active: inactive (dead)
      Docs: man:systemd.special(7)
 Feb 24 13:18:08 xps systemd[1]: Reached target Sleep.
 Feb 26 13:29:31 xps systemd[1]: Stopped target Sleep.
 Feb 26 13:29:57 xps systemd[1]: Reached target Sleep.
 Feb 26 13:30:19 xps systemd[1]: Stopped target Sleep.
```

禁止休眠设置：

```bash
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target
# 输出
Created symlink /etc/systemd/system/sleep.target → /dev/null.
Created symlink /etc/systemd/system/suspend.target → /dev/null.
Created symlink /etc/systemd/system/hibernate.target → /dev/null.
Created symlink /etc/systemd/system/hybrid-sleep.target → /dev/null.

# 检查是否成功
systemctl status sleep.target
# 输出
● sleep.target
   Loaded: masked (Reason: Unit sleep.target is masked.)
   Active: inactive (dead)
```