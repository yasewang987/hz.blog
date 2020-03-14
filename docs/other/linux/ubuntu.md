# Ubuntu服务器常用操作


## 修改IP，DNS

```bash
vim /etc/netplan/xx-netcfg.yaml

# DNS修改(修改文件中的nameservers)
nameservices:
  addresses: [8.8.8.8,114.114.114.114]
# 生效
netplan apply
```

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