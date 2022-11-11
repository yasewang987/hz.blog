# redis国产环境适配

## 源码编译

* `x86,arm`源码地址：https://github.com/redis/redis , 点击 `tags` 选择对应的版本下载源码即可。
* `loongarch`官方源码地址: `https://github.com/Loongson-Cloud-Community/redis/releases`，选择对应版本下载。

注意事项：一定要查看`pagesize`, 命令 `getconf PAGESIZE`,尽量在pagesize大的环境里面打包，因为pagesize小的环境打出来的包在大的环境中无法使用。

```bash
# 编译打 /mypath/redis 目录，会在该目录下生成bin文件夹，里面包含了所有可执行文件
make PREFIX=/mypath/redis install
```

命令

```bash
# 启动redis
./redis-server ../redis.conf

# 后台启动，修改redis.conf
daemonize yes
logfile "redis.log"

# reids-cli链接
./redis-cli
redis> set foo bar
OK
redis> get foo
"bar"
```

## rpm包制作

```text
%global mname redis
%global mpath base/%{mname}
Name: funcun-%{mname}
Version: 2022.11
Summary: funcun %{mname}
Release: 1
License: GPLv3+
Group: System Enviroment/Base
AutoReqProv:no

%description
funcun %{mname}

%prep

%build

%install
rm -rf %{buildroot}
mkdir -p %{buildroot}/opt/funcun/%{mpath}
cp -rf %{_builddir}/funcun/%{mpath}/* %{buildroot}/opt/funcun/%{mpath}

%post

%clean

%files
%defattr(-,root,root,0775)
/opt/funcun/%{mpath}
```

## deb包制作