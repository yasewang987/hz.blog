# nginx国产环境适配
## 源码编译

源码下载地址： https://nginx.org/en/download.html ，可以选择下载自己需要的版本。

解压压缩包，并进入对应文件夹，使用下面命令编译

```bash
# 配置编译生成的目录
./configure –prefix=/opt/mytest/nginx

# 编译
make && make install
```

生成之后所有的文件都在 `/opt/mytest/nginx` 目录，运行命令

```bash
sbin/nginx
```

## rpm包制作

```text
%global mname nginx
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