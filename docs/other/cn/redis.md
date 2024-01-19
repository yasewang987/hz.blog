# redis国产环境适配

## 源码编译

* `x86,arm`源码地址：https://github.com/redis/redis , 点击 `tags` 选择对应的版本下载源码即可。
* `loongarch`官方源码地址: `https://github.com/Loongson-Cloud-Community/redis/releases`，选择对应版本下载。

注意事项：一定要查看`pagesize`, 命令 `getconf PAGESIZE`,尽量在pagesize大的环境里面打包，因为pagesize小的环境打出来的包在大的环境中无法使用。

```bash
# 编译打 /mypath/redis 目录，会在该目录下生成bin文件夹，里面包含了所有可执行文件
make PREFIX=/mypath/redis install
```

命令

```bash
# 启动redis
./redis-server ../redis.conf

# 后台启动，修改redis.conf
daemonize yes
logfile "redis.log"

# reids-cli链接
./redis-cli
redis> set foo bar
OK
redis> get foo
"bar"
```

## rpm包制作

```text
%global mname redis
%global mpath basesoft/%{mname}
Name: basesoft-%{mname}
Version: 2023.12
Summary: basesoft %{mname}
Release: 15
License: GPLv3+
Group: System Enviroment/Base
AutoReqProv:no

%description
base %{mname}

%prep

%build

%install
rm -rf %{buildroot}
mkdir -p %{buildroot}/opt/%{mpath}
cp -rf %{_builddir}/%{mpath}/* %{buildroot}/opt/%{mpath}

%post

%clean

%files
%defattr(-,root,root,0775)
/opt/%{mpath}
```

## deb包制作

通过`alien`命令直接将`rpm`包转换即可。

## redis官方源码编译龙芯cpu

源码地址：https://redis.io/download/#redis-downloads 

最新版本是7.2，这里用redis5测试，最后一个版本是5.0.14

`redis` 用到了`jemalloc`库，如果不更新`redis 7`源码自带的`config.guess`和`config.sub`文件，会在编译`redis` 源码的过程中提示`include jemalloc`的头文件失败(`zmalloc.h:50:31: fatal error: jemalloc/jemalloc.h: No such file or directory`)

```bash
wget https://download.redis.io/releases/redis-5.0.14.tar.gz
tar -zxvf redis-5.0.14.tar.gz 
cd redis-5.0.14/

#### 修改源码
cd /redis-5.0.14/deps/jemalloc/build-aux
vi config.sub
# 然后在以下地方新增以下内容：
# 145行修改为：
-mips* | -loongarch* 
# 275行修改为：
| mips64 | mips64el | loongarch64 \
# 402行修改为：
| mips64-* | mips64el-* | loongarch64-* \
# 1632行新增：
 loongarch*-*)
       os=-elf
        ;;

vi config.guess
# 1006行新增以下内容：
loongarch64:Linux:*:*)
            echo ${UNAME_MACHINE}-unknown-linux-${LIBC}
            exit ;;

#### 编译
cd /opt/redis-5.0.14/
make
# 编译完成后，可执行文件在源码的/src目录下
```
