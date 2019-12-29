# Proxmox

## 系统安装

直接官网下载iso安装包刻录好u盘之后直接安装即可

## 磁盘挂载

1. 在磁盘中看下哪个是你挂载的硬盘，这里挂载目录为/dev/sdb
1. 在shell中输入`mkdir /mnt/sdb` 创建sdb文件夹用来给磁盘挂载
1. 输入`mkfs -t ext4 /dev/sdb1`格式化
1. 输入`mount /dev/sdb1 /mnt/sdb`进行挂载
1. 输入`vi /etc/fstab`编辑这文件，在最后追加一行 `/dev/sdb1 /mnt/sdb ext4 defaults 0 0`
1. 然后登入到proxmox web页面操作,依次点击数据中心-存储-添加-目录,ID随意，目录输入刚才挂载的目录`/mnt/sdb`，内容都选上，点添加,最后点os查看一下是否能识别，就OK了