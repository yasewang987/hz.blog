# redis国产环境适配

## 源码编译

源码地址：https://github.com/redis/redis

注意事项：`一定要查看pagesize`

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
make %{?_smp_mflags}
%install
rm -rf %{buildroot}/opt/%{name}
mkdir -p %{buildroot}/opt/%{name}
make install PREFIX=%{buildroot}/opt/%{name}

%post

%postun

%clean
#rm -rf %_builddir/%{name}
%files
%defattr(-,root,root,0755)
/opt/%{name}
```

## deb包制作