# jdk国产环境适配

## 源码编译

* `arm`源码地址： https://github.com/AdoptOpenJDK/openjdk-aarch64-jdk8u
* `x86`源码地址： https://github.com/AdoptOpenJDK/openjdk-jdk8u

`arm、x86`官方下载安装包地址（非源码）：https://adoptopenjdk.net/releases.html?variant=openjdk8&jvmVariant=hotspot  ，选择对应版本之后直接下载压缩包解压就可以用了。

`mips`官方下载地址：http://www.loongnix.cn/zh/api/java/ ，进入页面之后选择对应版本

例如下载 aarch64 版本的压缩包： https://github.com/adoptium/temurin8-binaries/releases/download/jdk8u302-b08/OpenJDK8U-jdk_aarch64_linux_hotspot_8u302b08.tar.gz  ，使用这个地址会比较慢，这个时候可以将 `githu.com` 替换成国内的加速源，替换后 https://hub.fastgit.org/adoptium/temurin8-binaries/releases/download/jdk8u302-b08/OpenJDK8U-jdk_aarch64_linux_hotspot_8u302b08.tar.gz

源码编译资料参考地址（未测试）：https://blog.csdn.net/quantum7/article/details/102737165

## rpm包制作

```text
%global mname jdk
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