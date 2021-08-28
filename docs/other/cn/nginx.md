# nginx国产环境适配
## 源码编译

源码下载地址： https://nginx.org/en/download.html ，可以选择下载自己需要的版本。

解压压缩包，并进入对应文件夹，使用下面命令编译

```bash
# 配置编译生成的目录
./configure –prefix=/opt/mytest/nginx

# 编译
make && make install
```

生成之后所有的文件都在 `/opt/mytest/nginx` 目录，运行命令

```bash
sbin/nginx
```

## rpm包制作

## deb包制作