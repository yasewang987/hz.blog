# sh脚本常用操作

## 判断Docker容器是否存在

```sh
if [ ! $(docker ps -a --format {{.Names}} | grep schoolpal.aggregate.api.builder) ]
then
    docker run -d -i -v /home:/dotnet --name schoolpal.aggregate.api.builder mcr.microsoft.com/dotnet/core/sdk:2.2
fi
```

## 获取当前日期时间

```sh
version=`date +%y%m%d%H%M%s`
```

## 复制文件到远程服务器目录

前提是要做好免密登录

```sh
scp -r $(pwd) root@192.168.20.71:/home/erpaggregateservice

#把192.168.0.10机器上的source.txt文件拷贝到本地的/home/work目录下
scp -P 1234 work@192.168.0.10:/home/work/source.txt /home/work/
```

## 执行远程服务器脚本

```sh
ssh -tt root@192.168.20.71 << closessh
chmod u+x /home/erpaggregateservice/Build.sh
source /home/erpaggregateservice/Build.sh
exit
closessh
```

## 查看系统编码

```bash
# 查看所有编码
locale -a

# 查看系统当前使用编码
locale
```