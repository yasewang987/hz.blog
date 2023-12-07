# minio国产环境适配

## 源码编译
官方源码git地址：https://github.com/minio/minio

官方包（二进制，rpm，deb）下载地址：https://min.io/download#/linux

`loongarch`官方下载地址：https://github.com/Loongson-Cloud-Community/minio/releases

启动命令：

```bash
# 指定账号密码
MINIO_ROOT_USER=admin MINIO_ROOT_PASSWORD=password ./minio server /mnt/data --console-address ":9001" --address ":28004"

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

```text
%global mname minio
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