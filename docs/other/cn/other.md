# 其他资料

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