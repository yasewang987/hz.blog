# es国产环境适配

## 源码编译

源码编译参考地址：https://bbs.huaweicloud.com/forum/thread-26271-1-1.html

官方包（二进制、rpm、deb）下载地址：https://www.elastic.co/cn/downloads/elasticsearch#ga-release

7.14.0版本arm版本包地址：https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.14.0-linux-aarch64.tar.gz

7.14.0版本amd版本包地址：https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.14.0-linux-x86_64.tar.gz

### 启动es

```bash
# 解压
tar zxvf elasticsearch-7.14.0-linux-aarch64.tar.gz -C /opt/mytest/

# es不允许root账户运行必须创建账号
useradd mytest
chown mytest:mytest /opt/mytest -R

# 启动
/opt/mytest/elasticsearch/bin/elasticsearch

# 查看到es对应的版本和基本信息
curl http://localhost:9200
# 查看索引信息
curl http://localhost:9200/_cat/indices?v 
```

## rpm包制作

```spec
%global mname es
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