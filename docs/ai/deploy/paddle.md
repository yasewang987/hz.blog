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

### arm

```bash
# 下载镜像
docker pull registry.baidubce.com/qili93/paddle-base:ubuntu18-aarch64

# 运行容器
docker run -itd --name paddle-dev registry.baidubce.com/qili93/paddle-base:ubuntu18-aarch64 bash

# 拉取代码
git clone https://github.com/PaddlePaddle/Paddle.git
# 进入目录
cd Paddle
# 切换分支，我编译时2.1版本所以我切换到了2.1版本的分支上
git checkout release/2.1
# 创建build文件目录
mkdir build && cd build
# 执行cmake
cmake .. -DPY_VERSION=3.7 -DWITH_ARM=ON -DWITH_DISTRIBUTE=ON -DWITH_PSCORE=OFF -DWITH_TESTING=ON -DON_INFER=ON -DCMAKE_BUILD_TYPE=Release 
# make 因为我服务器只有两核所以是2
make TARGET=ARMV8 -j2
```

## 问题