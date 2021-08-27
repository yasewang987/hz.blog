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

```
Name: funcun-redis
Version: 6.2.5
Summary: funcun redis
Release: 1
Source0: redis-%{version}.tar.gz
Packager: funcun
#BuildRequires:
#Requires:
AutoReqProv:no

License: GPLv3+
Group: System Enviroment/Base

%description
funcun redis

%prep
%setup -q -n redis-%{version}
%build
make install PREFIX=output
%install
rm -rf %{buildroot}/opt/%{name}
mkdir -p %{buildroot}/opt/%{name}
cp -rf %{_builddir}/redis-%{version}/output/* %{buildroot}/opt/%{name}

%post

%postun

%clean
#rm -rf %_builddir/%{name}
%files
%defattr(-,root,root,0755)
/opt/%{name}
```

## deb包制作