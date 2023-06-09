# 其他资料

* 龙芯的适配开源地址：`https://github.com/Loongson-Cloud-Community`
* 龙芯系统仓库地址：`http://pkg.loongnix.cn/loongnix-server/8.4/AppStream/loongarch64/release/Packages/`
* 龙芯python仓库地址：`https://pypi.loongnix.cn/`
* 龙芯官放开源社区：`http://www.loongnix.cn/zh/proj/`

## 国产系统信息记录

### 银河麒麟v10

适配镜像：arm和x86用 `python:3.7.4`, mips用 `python:3.7.7`

* 支持平台：arm，x86,mips64
* 安装包：【安全管理平台】rpm包
* python信息：3.7.4，/usr/bin/python3
* gcc版本：8.3.0
* cmake版本：3.12.1
* 其他：自带了mariadb

资源下载地址：

1. 银河麒麟高级服务器操作系统V10

兆芯版 海光版 AMD64版

下载地址：http://distro-images.kylinos.cn:8802/web_pungi/download/share/wA7vpuh4S5ZrxLWRXVBgGO0d9TfJqijD

提取码：NA

飞腾版 鲲鹏版

下载地址： http://distro-images.kylinos.cn:8802/web_pungi/download/share/BP9pZlFhKjANkwoWrsgETDMXLmOxait1

提取码：NA

龙芯-MIPS64el

下载地址： http://distro-images.kylinos.cn:8802/web_pungi/download/share/aru2QCiVKcZYlHpfnqX4AzLJBxNGsUvt

提取码：NA

龙芯-LoongArch64

下载地址：http://distro-images.kylinos.cn:8802/web_pungi/download/share/eqGsIRMaf1uU02SHovQrJCnj6DikBmNz

提取码：NA

申威版

下载地址：https://pan.baidu.com/s/1S8Myz_YxZyYi4rPxNw1DiQ

提取码：j2sa

2. 银河麒麟桌面操作系统V10

兆芯版 海光版

下载地址：http://distro-images.kylinos.cn:8802/web_pungi/download/share/9nl7ve2CSfEaQyqXYt8bRWUFdTBgj5hJ

提取码：NA

飞腾版 鲲鹏版

下载地址：http://distro-images.kylinos.cn:8802/web_pungi/download/share/tXbGgIYCdQEv5z0lPypmKTqAse2rojJx

提取码：NA

龙芯3a4000版

下载地址：http://distro-images.kylinos.cn:8802/web_pungi/download/share/EKvckinmNw1p9HXAsxLhB5Mf3eDUJ0VW

提取码：NA

龙芯3a5000版

下载地址：http://distro-images.kylinos.cn:8802/web_pungi/download/share/wrmC6ciOgptjAn5eMy1uhxfN8B7q9XRK

提取码：NA

申威版

AMD64版 intel版

下载地址：http://distro-images.kylinos.cn:8802/web_pungi/download/share/HXDYtGjZm3daA4UvOTLkiPl1nB9ErM0c

提取码：NA

海思麒麟

下载地址：https://pan.baidu.com/s/1oUvKP7xGbdXnD8aZTs95fA

提取码：rn8q

### 中科方德-SVS2.16.2

适配镜像：`python:3.6.8`

* 支持平台：arm，x86
* 安装包：【安全管理平台】rpm包
* python信息：3.6.8，/usr/bin/python3
* 其他：自带了mariadb

## 清理make源码编译

```bash
# 清理make命令所产生的object文件及可执行文件
make clean
# 同时也将configure生成dao的文件全部删除掉
make distclean
```

## 其他spec

### 永中插件

```conf
%define _binaries_in_noarch_packages_terminate_build 0
Name: funcun-yozo
Version: 2023.05
Release:        1
Summary:        funcun yozo

Group:          funcun
License:        GPLv3+
BuildArch: noarch

%description
funcun yozo

%prep


%build

%install
rm -rf %{buildroot}/opt/Yozosoft/Yozo_Office/Plugins/fcwy
mkdir -p %{buildroot}/opt/Yozosoft/Yozo_Office/Plugins/fcwy
cp -rf %{_builddir}/funcun/fcwy/* %{buildroot}/opt/Yozosoft/Yozo_Office/Plugins/fcwy

%files
/opt/Yozosoft/Yozo_Office/Plugins/fcwy



%changelog
```

### so库打包

```conf
%define __os_install_post %{nil}
%define debug_package %{nil}
%global mname funcun-libs
Name: %{mname}
Version: 2023.6
Summary: %{mname}
Release: 1
License: GPLv3+
Group: System Enviroment/Base
AutoReqProv: no

%description
funcun %{mname}

%prep

%build

%install
rm -rf %{buildroot}
mkdir -p %{buildroot}/usr/lib
cp -rf %{_builddir}/funcun/libs/* %{buildroot}/usr/lib

%post

%clean

%files
/usr/lib
```

### 通用打包（数据/代码）

```text
%global mcompany funcun
%global mname data
%global mpath %{mcompany}/%{mname}
Name: %{mcompany}-%{mname}
Version: 2022.07
Release:        1
Summary:        %{mcompany} %{mname}

Group:          %{mcompany}
License:        GPLv3+
BuildArch: noarch

%description
%{mcompany} %{mname}

%prep


%build

%install
rm -rf %{buildroot}/opt/%{mpath}
mkdir -p %{buildroot}/opt/%{mpath}
cp -rf %{_builddir}/%{mpath}/* %{buildroot}/opt/%{mpath}

%files
/opt/%{mpath}
```