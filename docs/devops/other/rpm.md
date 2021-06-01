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

# 创建文件夹
mkdir -pv  ~/rpmbuild/{BUILD,RPMS,SOURCES,SPECS,SRPMS,BUILDROOT}
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
--target 指定生成 rpm 包的平台，默认会生成 i686 和 x86_64 的 rpm 包，但一般我只需要 x86_64 的 rpm 包
```

## spec文件详解

下面以解压完可以直接进行运行的hadoop为例:

```txt
Name: hadoop		//软件包名称
Version: 2.7.0		//软件版本号
Summary: The Apache© Hadoop project develops open-source software for reliable, scalable, distributed computing.		//软件描述
Release: 1		//编译版本
Source0:hadoop-2.7.0.tar.gz		//软件包所存放的位置,一般在SOURCES目录
Packager: Eason Xu			//软件包制作者
#BuildRequires:				//包构建所需依赖，空值表示默认
#Requires:					//包安装所需依赖，空值表示默认
AutoReqProv:no  //不需要检查软件依赖信息

License: GPLv3+		//遵循开源软件公有认证第三版以上
Group: System Enviroment/Base			//基于系统的基础运行环境

%description			//对于软件的相关描述，同上summary一致
The Apache© Hadoop project develops open-source software for reliable, scalable, distributed computing.

%prep			//开始进行软件包构建
%global debug_package %{nil}		//忽略debug的错误信息
%setup -q			//对SOURCES里面的软件源进行静默方式解压至BUILD目录
%build		//开始构建软件包
%install		//进行构建中的相关操作
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
%files
/opt/%{name}	//软件包制作完成后软件的安装位置,此实例hadoop软件安装在/opt/hadoop目录下

%changelog	//软件包构建信息以及联系方式。
* Sat May 22 2021 Eason Xu<xumin@kylinos.cn> - 1.0.0
  - Add detail for apache hadoop package
```

关于`%{buildroot}`这里进行解释一下，`%{buildroot}`是软件解压后的`文件名`加`版本号`再加上`编译版本号`和`系统架构类型`的目录，它存放在`BUILDROOT`目录下。列如示例中`hadoop-2.7.0.tar.gz`软件包。它的`%{buildroot}`目录具体所指是`/root/rpmbuild/BUILDROOT/hadoop-2.7.0-1.x86_64`这个目录。

## 安装rpm包

```bash
sudo rpm -ivh xxxx.rpm
```