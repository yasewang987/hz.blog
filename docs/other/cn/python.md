# python国产环境适配

* 编译python相关依赖库的时候，python的版本一定要和目标机器上的python版本一致。

## 不同服务器迁移

一定要注意一下，如果虚拟环境文件夹的路径变了，需要修改 `bin/activate` 的如下内容：
```bash
VIRTUAL_ENV="/home/venv"
export VIRTUAL_ENV
```

## 激活环境

使用 `virtualenv` 获取 `python3 -m venv` 建立虚拟环境，直接放到涉密服务器即可。

```bash
# 激活虚拟环境
source bin/activate

# 进入python3环境验证包能不能正常用
# 这个特别重要，一定要用虚拟环境的bin目录下的python3，不然找不到包
bin/python3
```
## rpm包制作

`%define __os_install_post %{nil}` 这个对于python和java不需要编译的项目特别重要，不需要解压、压缩、自动编译python和jar包这些操作。

* 虚拟环境`virtualenv`安装之后一起打包（`建议`）

```text
%define __os_install_post %{nil}
%define debug_package %{nil}
%global mname soft-py
Name: %{mname}
Version: 2023.11
Summary: %{mname}
Release: 1
License: GPLv3+
Group: System Enviroment/Base
AutoReqProv: no

%description
soft %{mname}

%prep

%build

%install
rm -rf %{buildroot}
mkdir -p %{buildroot}/opt/soft/base/python
cp -rf %{_builddir}/soft/base/python/* %{buildroot}/opt/soft/base/python

%post

%clean

%files
%defattr(-,root,root,0775)
/opt/soft/base/python
```

* `python业务代码打包`

```text
%define _binaries_in_noarch_packages_terminate_build 0
Name: service-code
Version: 2022.07
Release:        1
Summary:        service code

Group:          service
License:        GPLv3+
BuildArch: noarch

%description
service code

%prep

%build

%install
rm -rf %{buildroot}/opt/service/code
mkdir -p %{buildroot}/opt/service/code
cp -rf %{_builddir}/service/code/* %{buildroot}/opt/service/code

%files
/opt/service/code

%changelog
```

* 编译在开发机，安装在专用机例子（`不建议`）

```
%global buildpath /usr/local/lib/python3.7/dist-packages
%global installpath /usr/lib/python3.7/site-packages
%global pyname scipy
Name:           py-scipy
Version:        1.5.4
Release:        1%{?dist}
Source0:       scipy-1.5.4.tar.gz
Summary:        funcun libs
License: GPLv3+

BuildRequires:  python3-setuptools, python3-devel

%description
funcun libs


%prep
%setup -q -n %{pyname}-%{version}

%build
python3.7 setup.py install --root %{_builddir}/%{pyname}-%{version}/out
%install
rm -rf %{buildroot}%{installpath}
rm -rf %{buildroot}%{_bindir}
mkdir -p %{buildroot}%{installpath}
mkdir -p %{buildroot}%{_bindir}
cp -rf %{_builddir}/%{pyname}-%{version}/out%{buildpath}/* %{buildroot}%{installpath}  
cp -rf %{_builddir}/%{pyname}-%{version}/out/usr/local/bin/* %{buildroot}%{_bindir}

%post

%postun

%clean
#rm -rf %_builddir/%{pyname}-%{version}
#rm -rf %{buildroot}

%files
#%defattr(-,root,root,-)
%{installpath}
%{_bindir}
```


## 源码编译

每个环境最好都是重新编译（建议在低版本的gcc环境下编译）

```bash
# 推荐在python3.6.8的镜像里编译
gcc -v
```

* 安装依赖

```bash
# ubuntu/debian
sudo apt-get install -y make build-essential libssl-dev zlib1g-dev libbz2-dev \
libreadline-dev libsqlite3-dev wget curl llvm libncurses5-dev libncursesw5-dev \
xz-utils tk-dev libffi-dev liblzma-dev python-openssl git

# centos/loongarch
sudo yum install @development zlib-devel bzip2 bzip2-devel readline-devel sqlite \
sqlite-devel openssl-devel xz xz-devel libffi-devel findutils
```

* 编译安装 Python，打开 `https://www.python.org/ftp/python` 自选版本

```bash
# 下载源码
curl -O https://www.python.org/ftp/python/3.7.13/Python-3.7.13.tar.xz

# 解压
tar -Jxvf Python-3.7.13.tar.xz && cd Python-3.7.13

###### loongarch的需要修改python源码的如下配置
# config.guess(963行)
    ia64:Linux:*:*)
        echo "$UNAME_MACHINE"-unknown-linux-"$LIBC"
        exit ;;
    # 增加配置---------------
    loongarch32:Linux:*:* | loongarch64:Linux:*:*)
        echo "$UNAME_MACHINE"-unknown-linux-"$LIBC"
        exit ;;
    # -----------------------
    k1om:Linux:*:*)
        echo "$UNAME_MACHINE"-unknown-linux-"$LIBC"
        exit ;;
# config.sub（294，396）
        | msp430 \
        # 增加配置-----------------
        | loongarch32 | loongarch64 \
        #-------------------------
        | nds32 | nds32le | nds32be \

        | le32-* | le64-* \
        # 增加配置--------------------
        | loongarch32-* | loongarch64-* \
        # ---------------------------
        | lm32-* \

# 编译安装，--enable-optimizations 配置项用于提高 Python 安装后的性能，使用会导致编译速度稍慢
./configure --prefix=/opt/yourpath --enable-optimizations
make
make install

# 添加软链接
ln -s /opt/yourpath/bin/python3.8 /usr/bin/python3
ln -s /opt/yourpath/bin/pip3.8 /usr/bin/pip3
```

## 龙芯python依赖库

正常的依赖包还是通过官方的引入即可。

```bash
pip install -i https://pypi.douban.com/simple xxxx
```

* 使用文档：`http://docs.loongnix.cn/python/python.html`
* 仓库地址：`https://pypi.loongnix.cn/loongson/pypi`
* 使用示例
```bash
pip install xxxxx -i https://pypi.loongnix.cn/loongson/pypi --extra-index-url https://pypi.org/simple
```