# nginx国产环境适配
## 源码编译

源码下载地址： https://nginx.org/en/download.html ，可以选择下载自己需要的版本。

解压压缩包，并进入对应文件夹，使用下面命令编译

```bash
# 安装依赖项
sudo apt update
sudo apt install gcc
sudo  apt-get install build-essential zlib1g-dev libpcre3 libpcre3-dev  libssl-dev libxslt1-dev libxml2-dev libgeoip-dev  libgoogle-perftools-dev libperl-dev libtool libpcrecpp0v5 openssl -y

# 配置编译生成的目录
# 如果提示 prefix 参数无效，则需要手动输入下面命令，不要复制
./configure --prefix=/opt/mytest/nginx --with-http_ssl_module --with-stream --with-mail=dynamic

# 编译，会直接输入到当前文件夹的 ./objs
make
# 安装到prefix目录下
make install

### 更新nginx
# 新增模块，需要从 ./configure 开始执行到 make 即可，不要执行make install
# 编译完成后拷贝覆盖原来的nginx
cp ./objs/nginx /usr/local/nginx/sbin/
```

生成之后所有的文件都在 `/opt/mytest/nginx` 目录，运行命令

```bash
sbin/nginx
```

## rpm包制作

```text
%global mname nginx
%global mpath base/%{mname}
Name: mytest-%{mname}
Version: 2022.04
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


## 编译选项说明

--prefix=path 如果在编译的不指定安装位置，那么默认的位置/usr/local/nginx目录

--sbin-path=path 设置nginx执行脚本的位置，默认位置${prefix}/sbin/nginx 注意这里的prefix是在配置文件里面配置的路径

--conf-path=path 配置nginx配置文件的路径，如果不指定这个选项，那么配置文件的默认路径就会是 ${prefix}/conf/nginx.conf

--pid-path =path 配置nginx.pid file的路径，一般来说，进程在运行的时候的时候有一个进程id，这个id会保存在pid file里面，默认的pid file的放置位置是prefix/logs/nginx.pid

--error-log-path=path 设置错误日志的存放路径，默认${prefix}/logs/error.log

--http-log-path= path 设置http访问日志的路径，就默认${prefix}/logs/access.log

--user=name 设置默认启动进程的用户，如果不指定，就默认 nobody

--group=name 设置这个用户所在的用户组，如果不指定，依然是nobody

--with-http_ssl_module 开启HTTP SSL模块，使NGINX可以支持HTTPS请求。需要安装OPENSSL

--with-http_flv_module

--with-http_stub_status_module 启用 "server status" 页

--without-http_gzip_module 禁用 ngx_http_gzip_module. 如果启用，需要 zlib

--without-http_ssi_module 禁用 ngx_http_ssi_module

--without-http_referer_module 禁用 ngx_http_referer_module

--without-http_rewrite_module 禁用 ngx_http_rewrite_module. 如果启用需要 PCRE 。

--without-http_proxy_module 禁用 ngx_http_proxy_module

--without-http_fastcgi_module 禁用 ngx_http_fastcgi_module

--without-http_memcached_module 禁用 ngx_http_memcached_module

--without-http_browser_module 禁用 ngx_http_browser_module

--http-proxy-temp-path=PATH 设置路径到the http proxy temporary files

--http-fastcgi-temp-path=PATH 设置路径到Set path to the http fastcgi temporary files

--without-http 禁用 HTTP server

--with-mail 启用 IMAP4/POP3/SMTP 代理模块

--with-mail_ssl_module 启用ngx_mail_ssl_module

--with-openssl=DIR 设置路径到OpenSSL library sources

--with-stream 用来实现四层协议的转发、代理或者负载均衡等