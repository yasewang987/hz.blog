# mariadb国产环境适配

## 源码编译

源码下载地址： https://mariadb.org/download/  注意选择 `Operating System` 为 `Source`.

安装依赖项：

```bash
# centos
yum install gcc \
      gcc-c++ \
      bison \
      libxml2-devel \
      libevent-devel \
      rpm-build \
      ncurses-devel
```

准备安装mariadb的文件夹

```bash
# 创建并进入根目录
mkdir -p /opt/mytest/mariadb && cd /opt/mytest/mariadb

# 创建数据目录
mkdir data

# 解压mariadb源码包
tar zxvf mariadb.xxx.tar.gz
```

进入mariadb源码目录执行编译操作

```bash
# 执行这一步的时候需要确认没有期间没有报错
cmake . -DCMAKE_INSTALL_PREFIX=/opt/mytest/mariadb \
    -DMYSQL_DATADIR=/opt/mytest/mariadb/data \
    -DSYSCONFDIR=/opt/mytest/mariadb

# 上面的命令如果没有报错会生成Makefile，执行安装
make && make install

# 执行之后会在 /opt/mytest/mariadb 文件夹中会生成所有文件
```

执行生成数据库命令

```bash
# 执行之后会在/opt/mytest/mariadb/data目录生成初始数据库
/opt/mytest/mariadb/scripts/mariadb-install-db --basedir=/opt/mytest/mariadb --datadir=/opt/mytest/mariadb/data

# 设置管理员密码
/opt/mytest/mariadb/bin/mysqladmin -u root password 'yourpassword'
```

编辑配置文件

```bash
vim my.cnf
# 添加如下内容
[mysqld]
# pid-file        = /var/run/mysqld/mysqld.pid
# socket          = /var/run/mysqld/mysqld.sock
# datadir         = /var/lib/mysql
pid-file        = /opt/mytest/mariadb/mysqld.pid
socket          = /opt/mytest/mariadb/mysqld.sock
datadir         = /opt/mytest/mariadb/data
basedir         = /opt/mytest/mariadb
user            = root
#log-error      = /var/log/mysql/error.log
#bind-address   = 127.0.0.1
symbolic-links=0
sql_mode='STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION'
```

启动mariadb

```bash
/opt/mytest/mariadb/bin/mysqld_safe --defaults-file=/opt/mytest/mariadb/my.cnf
```

## systemctl管理

```bash
# 这里需要注意修改一下mysql.server里面的配置
cp /opt/mytest/mariadb/support-files/mysql.server /etc/init.d/mysqld

# 启动
systemctl mysqld start

# 允许开机启动
systemctl mysqld enable
```

## 报错处理

在进行`cmake`的时候配置文件报错Could NOT find GnuTLS

```bash
yum install gnutls-devel

# 记得删除目录下的CMakeCache.txt缓存文件再重新开始配置
rm CMakeCache.txt
```

## rpm包制作

```text
%global mname mariadb
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