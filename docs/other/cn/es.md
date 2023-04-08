# es国产环境适配

## 源码编译

* 源码编译参考地址：https://bbs.huaweicloud.com/forum/thread-26271-1-1.html
* 官方包（二进制、rpm、deb）下载地址：https://www.elastic.co/cn/downloads/elasticsearch#ga-release
* 7.14.0版本arm版本包地址：https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.14.0-linux-aarch64.tar.gz
* 7.14.0版本amd版本包地址：https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.14.0-linux-x86_64.tar.gz
* `loongarch`官方下载地址：`https://github.com/Loongson-Cloud-Community/elasticsearch/releases` 选择对应版本即可。

### 启动es

```bash
# 解压
tar zxvf elasticsearch-7.14.0-linux-aarch64.tar.gz -C /opt/mytest/

# (涉密服务器直接用root帐号)es不允许root账户运行必须创建账号
useradd mytest
chown mytest:mytest /opt/mytest -R

# 使用自带的jdk（修改 bin/elasticsearch-env 文件）
# 注释掉下面几行即可
elif [ ! -z "$JAVA_HOME" ]; then
  # fallback to JAVA_HOME
  echo "warning: usage of JAVA_HOME is deprecated, use ES_JAVA_HOME" >&2
  JAVA="$JAVA_HOME/bin/java"
  JAVA_TYPE="JAVA_HOME"

# 限制内存使用，先找到config目录的jvm.options改一下
# 设置总内存的50%，并且建议 xms 和 xmx 值一样大
-Xms10g
-Xmx10g

# 修改es启动的端口和ip，并禁用geoip，config/elasticsearch.yml
http.port: 28001
http.host: 0.0.0.0
# 添加到最后即可
ingest.geoip.downloader.enabled: false

# 启动 -d 后台运行
/opt/mytest/elasticsearch/bin/elasticsearch -d

# 日志在 logs/elasticsearch.log

# 查看到es对应的版本和基本信息,如果端口改过换成新的即可
curl http://localhost:9200
# 查看索引信息
curl http://localhost:9200/_cat/indices?v 
```

## rpm包制作

```spec
%global mname es
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

## 报错

`org.elasticsearch.bootstrap.BootstrapException: java.nio.file.AccessDeniedException`:

原因：`elasticsearch.keystore`文件没有权限。
处理方案：切换到`root`用户修改文件`elasticsearch.keystore`权限