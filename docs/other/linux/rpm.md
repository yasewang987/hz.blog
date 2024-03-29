# rpm包制作

rpm 的版本 `<=4.4.x`，`rpmbuid` 工具其默认的工作路径是 `/usr/src/redhat`。因为权限的问题，普通用户不能制作 rpm 包，制作 rpm 软件包时必须切换到 `root` 身份才可以。

rpm 从 `4.5.x` 版本开始，将 `rpmbuid` 的默认工作路径移动到用户家目录下的 `rpmbuild` 目录里，即 `$HOME/rpmbuild` ，并且推荐用户在制作 rpm 软件包时尽量不要以 root 身份进行操作。

如果想发布 `rpm` 格式的源码包或者是二进制包，就要使用 `rpmbuild` 工具（ rpm 最新打包工具）。如果我们已经根据本地源码包的成功编译安装而写了 `spec` 文件（该文件要以 `.spec` 结束），那我们就可以建立一个打包环境，也就是目录树的建立，一般是在 `~/rpmbuild` 目录下建立 5 个目录。它门分别是：

`BUILD`：源码包被解压至此，并在该目录的子目录完成编译
`SOURCES` ：保存源码包（如 .tar 包）和所有 patch 补丁
`SPECS`：保存 RPM 包配置（.spec）文件
`SRPMS`：生成/保存源码 RPM 包(SRPM)
`RPMS`：生成/保存二进制 RPM 包
`BUILDROOT`：保存 `%install` 阶段安装的文件，临时存放制作软件包文件目录

```bash
# centos
yum install rpm-build  -y 
yum install -y rpmdevtools
# 生成文件夹（会在用户目录下生成rpmbuild以及配置文件.rpmmacros）
rpmdev-setuptree

# ubuntu
apt-get install rpm

# 创建文件夹
mkdir -pv  ~/rpmbuild/{BUILD,RPMS,SOURCES,SPECS,SRPMS,BUILDROOT}
```

## 常用命令

```bash
# 安装本地包
sudo rpm -ivh xxxx.rpm
# 强制安装（已经安装过的会重新安装）
rpm -ivh --force xxxx.rpm
# 批量安装
rpm -Uvh *.rpm --nodeps --force
# 或者
yum localinstall xxxx.rpm

# 更新包
rpm -Uvh *.rpm --nodeps --force

# 删除软件
rpm -e xxx

# 查看包中的内容
rpm -qpl xxxx.rpm

# 查看包中的执行脚本（反编译）
rpm -qp --scripts nginx-1.8.1-1.el7.ngx.x86_64.rpm
```


## rpmbuild 命令选项

```bash
# 构建命令
rpmbuild -ba 软件名-版本.spec 

-bp 只解压源码及应用补丁
-bc 只进行编译
-bi 只进行安装到%{buildroot}
-bb 只生成二进制 rpm 包
-bs 只生成源码 rpm 包
-ba 生成二进制 rpm 包和源码 rpm 包
--target 指定生成 rpm 包的平台
–-buildroot 一般在centos5等低版本的系统中需要制定这个位置
```

例如要构建龙芯平台的 `rpm` 包，则 `–-target=mipsel`，但是这样在打包的过程中将无法获得 `%_arch` 的值，所以 `rpmbuild` 无法定位 `BUILDROOT` 下的目标目录。这个时候，可以用 `--define` 参数来手动定义 `%_arch` 宏。

```bash
rpmbuild -bb –-target=mipsel –-define="%_arch mipsel" SPECS/codeblocks.spec
```

## 宏

比如我们要查看`%{_bindir}`的路径，就可以使用命令`rpm --eval "%{ _bindir}"`来查看

所有的宏都可以在`/usr/lib/rpm/macros`里找到

```
%{_topdir}            %{getenv:HOME}/rpmbuild
%{_builddir}          %{_topdir}/BUILD
%{_rpmdir}            %{_topdir}/RPMS
%{_sourcedir}         %{_topdir}/SOURCES
%{_specdir}           %{_topdir}/SPECS
%{_srcrpmdir}         %{_topdir}/SRPMS
%{_buildrootdir}      %{_topdir}/BUILDROOT

%{_sysconfdir}        /etc
%{_prefix}            /usr
%{_exec_prefix}       %{_prefix}
%{_bindir}            %{_exec_prefix}/bin
%{_lib}               lib (lib64 on 64bit systems)
%{_libdir}            %{_exec_prefix}/%{_lib}
%{_libexecdir}        %{_exec_prefix}/libexec
%{_sbindir}           %{_exec_prefix}/sbin
%{_sharedstatedir}    /var/lib
%{_datadir}           %{_prefix}/share
%{_includedir}        %{_prefix}/include
%{_oldincludedir}     /usr/include
%{_infodir}           /usr/share/info
%{_mandir}            /usr/share/man
%{_localstatedir}     /var
%{_initddir}          %{_sysconfdir}/rc.d/init.d

%{_var}               /var
%{_tmppath}           %{_var}/tmp
%{_usr}               /usr
%{_usrsrc}            %{_usr}/src
%{_docdir}            %{_datadir}/doc
```

## spec文件详解

下面以解压完可以直接进行运行的hadoop为例:

```txt
%define __os_install_post %{nil} //这个对于python和java不需要编译的项目特别重要，不需要解压、压缩、自动编译python和jar包这些操作。
%define debug_package %{nil}		//忽略debug的错误信息
Name: hadoop		//软件包名称
Version: 2.7.0		//软件版本号
Summary: The Apache© Hadoop project develops open-source software for reliable, scalable, distributed computing.		//软件描述
Release: 1		//编译版本
Source0: hadoop-2.7.0.tar.gz		//软件包所存放的位置,一般在SOURCES目录
Packager: Eason Xu			//软件包制作者
#BuildRequires:				//包构建所需依赖，空值表示默认
#Requires:					//包安装所需依赖，空值表示默认
AutoReqProv:no  //不需要检查软件依赖信息
Prefix:     /usr/local/hadoop-2.7.0

License: GPLv3+		//遵循开源软件公有认证第三版以上
Group: System Enviroment/Base			//基于系统的基础运行环境

%description			//对于软件的相关描述，同上summary一致
The Apache© Hadoop project develops open-source software for reliable, scalable, distributed computing.

// 读取位于 %_sourcedir 目录的源代码和 patch 。之后，解压源代码至 %_builddir 的子目录并应用所有 patch。
%prep
%setup -q			//对SOURCES里面的软件源进行静默方式解压至BUILD目录

// 编译位于 %_builddir 构建目录下的文件。通过执行类似 ./configure && make 的命令实现。
%build
CFLAGS="-pipe -O2 -g -W -Wall -Wpointer-arith -Wno-unused-parameter -Werror" ./configure --prefix=%{prefix}
# make后面的意思是：如果是多处理器，则并行编译
make %{?_smp_mflags}

// 读取位于 %_builddir 构建目录下的文件并将其安装至 %_buildrootdir 目录。这些文件就是用户安装 RPM 后，最终得到的文件。注意一个奇怪的地方: 最终安装目录 不是 构建目录。通过执行类似 make install 的命令实现。
%install
make install DESTDIR=%{buildroot}
rm -rf %{buildroot}/opt/%{name}			//构建前先删除原先存在的同名文件目录
mkdir -p %{buildroot}/opt/%{name}		//创建BUILDROOT目录下的文件目录
cp -rf %_topdir/BUILD/%{name}-%{version}/* %{buildroot}/opt/%{name}		//将BUILD目录解压文件复制进软件包制作临时目录

// 以下一段脚本作用是安装完毕后创建一个hadoop运行的文件存储位置
%post
if [[ $1 == 1 ]];then
    mkdir -p /opt/data/tmp	 //创建hadoop环境的文件存储位置，可以根据core-site.xml的dfs设定
fi

// 由于hadoop正常运行后，再卸载该软件会有残留，因此运行该脚本清理卸载完毕后的残留
%postun
if [[ $1 == 0 ]];then
    rm -rf /opt/%{name}	//卸载hadoop时，清理残留，本实例hadoop安装目录为/opt/hadoop
    rm -rf /opt/data	//删除hadoop文件存储位置,本实例为/opt/data目录。
fi

// 安装包做完之后清理
%clean
rm -rf %_builddir/%{name}-%{version}	//构建完毕软件包后的清理，清理BUILD目录
rm -rf %{buildroot}		//清理临时存放软件包构建的目录

%files // 主要用来说明会将%{buildroot}目录下的哪些文件和目录最终打包到rpm包里
%defattr(文件权限,用户名,组名,目录权限)
/opt/%{name}
%exclude dic_name

%changelog	//软件包构建信息以及联系方式。
* Sat May 22 2021 Eason Xu<xumin@kylinos.cn> - 1.0.0
  - Add detail for apache hadoop package
```

关于`%{buildroot}`这里进行解释一下，`%{buildroot}`是`文件名`+`版本号`+`编译版本号`+`系统架构类型`的目录，它存放在`BUILDROOT`目录下。列如示例中`hadoop-2.7.0.tar.gz`软件包。它的`%{buildroot}`目录具体所指是`/root/rpmbuild/BUILDROOT/hadoop-2.7.0-1.x86_64`这个目录。

## 自定义命令示例

```text
Name:           hello
Version:        1.0.0
Release:        1%{?dist}
Summary:        hello test

Group:          hz
License:        GPLV3+

%description
hello test


%prep

%build

%install
rm -rf %{buildroot}/opt/%{name}
mkdir -p %{buildroot}/opt/%{name}
cp -f %{_builddir}/hz/hello.sh %{buildroot}/opt/%{name}
rm -rf %{buildroot}/usr/local/bin/hellohz
mkdir -p %{buildroot}/usr/local/bin
cp -rf %{_builddir}/hz/hellohz %{buildroot}/usr/local/bin

%files
# 修改文件和目录权限
%defattr (0777,root,root,0777)
/opt/%{name}
/usr/local/bin/hellohz



%changelog

%clean
```

## 报错处理

* `SyntaxError: invalid syntax`: 在spec文件中添加如下内容

```text
%global _python_bytecompile_errors_terminate_build 0
%global __python %{__python3}
```

* `ELF load command address not properly aligned`

1. `torch`: 使用 `1.8.1` 版本

* `Arch dependent binaries in noarch package`

加上`BuildArch:noarch`报上面错误，需要在 `spec` 文件最上面添加 `%define _binaries_in_noarch_packages_terminate_build 0`

* `/bin/sh is needed by  xxx.rpm`

在安装rpm包的时候加上 `--nodeps` 参数

## rpm、deb包互相转换

使用debian系统，修改完清华源之后进行如下操作：

```bash
# 安装alien
apt install -y alien
# -d #转为deb（一定要加上--scripts不然无法将post、postun等脚本转换过来）
alien -d --scripts xxx.rpm
# -r #转为rpm
alien -r --scripts xxx.deb

# 安装rpm包
alien -i xxxx.rpm

# 查看deb包详细脚本内容
dpkg -e somefile.deb somefolder
```