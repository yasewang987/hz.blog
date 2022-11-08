# 其他资料

* 龙芯的适配开源地址：`https://github.com/Loongson-Cloud-Community`
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

### 中科方德-SVS2.16.2

适配镜像：`python:3.6.8`

* 支持平台：arm，x86
* 安装包：【安全管理平台】rpm包
* python信息：3.6.8，/usr/bin/python3
* 其他：自带了mariadb

## 其他specs

* 通用打包（数据/代码）

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

## 清理make源码编译

```bash
# 清理make命令所产生的object文件及可执行文件
make clean
# 同时也将configure生成dao的文件全部删除掉
make distclean
```