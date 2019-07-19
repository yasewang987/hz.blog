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
```

## 执行远程服务器脚本

```sh
ssh -tt root@192.168.20.71 << closessh
chmod u+x /home/erpaggregateservice/Build.sh
source /home/erpaggregateservice/Build.sh
exit
closessh
```