# minio国产环境适配

## 源码编译
官方源码git地址：https://github.com/minio/minio

官方包（二进制，rpm，deb）下载地址：https://min.io/download#/linux

启动命令：

```bash
# 指定账号密码
MINIO_ROOT_USER=admin MINIO_ROOT_PASSWORD=password ./minio server /mnt/data --console-address ":9001" --adress ":28004"

# 后台
nohup ./minio server /mnt/data --console-address :9001 --address :28004 > /mnt/data/minio.log 2>&1 &
```

### make命令编译

需要提前安装go环境

mips64架构编译，需要修改`buildscripts/checkdeps.sh`代码，添加 `mips64el`：

```sh
assert_is_supported_arch() {
    case "${ARCH}" in 
        x86_64 | amd64 | aarch64 | ppc64le | arm* | s390x | mips64 )
            return
            ;;
        *)
            echo "Arch '${ARCH}' is not supported. Supported Arch: [x86_64, amd64, aarch64, ppc64le, arm*, s390x]"
            exit 1
    esac
}
```
### go交叉编译

```go
CGO_ENABLED=0 GOOS=linux GOARCH=mips64le go build
```
## rpm包制作

### make命令编译

```text
%global mname minio
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

### 交叉编译后直接打包

```text
Name: minio
Version: 1.0.0
Summary: funcun minio
Release: 1
#Source0: minio
Packager: funcun
#BuildRequires: 
#Requires:
AutoReqProv:no 
 
License: GPLv3+
Group: System Enviroment/Base
 
%description
funcun minio
 
%prep
#%setup -q 
%build
%install
rm -rf %{buildroot}/opt/%{name}
mkdir -p %{buildroot}/opt/%{name}
chmod +x %_topdir/BUILD/%{name}
cp -rf %_topdir/BUILD/%{name} %{buildroot}/opt/%{name}

%post
#nohup /opt/minio/minio server /opt/minio > /opt/minio/minio.log 2>&1 &
 
%postun
rm -rf /opt/%{name}
 
%clean
#rm -rf %_builddir/%{name}
rm -rf %{buildroot}
%files
/opt/%{name}
```

## deb包制作