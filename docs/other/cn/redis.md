# redis国产环境适配

## 源码编译

源码地址：https://github.com/redis/redis

注意事项：一定要查看`pagesize`, 命令 `getconf PAGESIZE`,尽量在pagesize大的环境里面打包，因为pagesize小的环境打出来的包在大的环境中无法使用。

命令

```bash
# 启动redis
./redis-server ../redis.conf

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
Name: mytest-%{mname}
Version: 1.0.0
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
mkdir -p %{buildroot}/opt/mytest/%{mpath}
cp -rf %{_builddir}/mytest/%{mpath}/* %{buildroot}/opt/mytest/%{mpath}

%post

%clean

%files
%defattr(-,root,root,0775)
/opt/mytest/%{mpath}
```

## deb包制作