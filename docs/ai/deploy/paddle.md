# Paddle

## 源码编译gcc8.2

编译完之后生成在 `/usr/local/gcc-8.2` 目录，需要修改一下软链接

```bash
wget -q https://paddle-docker-tar.bj.bcebos.com/home/users/tianshuo/bce-python-sdk-0.8.27/gcc-8.2.0.tar.xz && \
tar -xvf gcc-8.2.0.tar.xz && \
cd gcc-8.2.0 && \
sed -i 's#ftp://gcc.gnu.org/pub/gcc/infrastructure/#https://paddle-ci.gz.bcebos.com/#g' ./contrib/download_prerequisites && \
unset LIBRARY_PATH CPATH C_INCLUDE_PATH PKG_CONFIG_PATH CPLUS_INCLUDE_PATH INCLUDE && \
./contrib/download_prerequisites && \
cd .. && mkdir temp_gcc82 && cd temp_gcc82 && \
../gcc-8.2.0/configure --prefix=/usr/local/gcc-8.2 --enable-threads=posix --disable-checking --disable-multilib && \
make -j8 && make install

# 修改软链接
ln -s /usr/local/gcc-8.2/gcc /usr/bin/gcc
ln -s /usr/local/gcc-8.2/g++ /usr/bin/g++
ln -s /usr/local/gcc-8.2/cpp /usr/bin/cpp
ln -s /usr/local/gcc-8.2/c++ /usr/bin/c++
ln -s /usr/local/gcc-8.2/ar /usr/bin/ar
ln -s /usr/local/gcc-8.2/nm /usr/bin/nm
ln -s /usr/local/gcc-8.2/gcc-xxxxxxxx /usr/bin/gcc-xxxxxx
```

## 源码编译paddle

## 问题