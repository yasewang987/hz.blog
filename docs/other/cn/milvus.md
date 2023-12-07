# Milvus国产环境适配

## 源码编译

```bash
### 安装环境依赖
go: >= 1.18
cmake: >= 3.18
gcc: 7.5

# cmake可以到官网下载已经编译好的tar.gz压缩包
tar zxf cmake-3.27.7-linux-x86_64.tar.gz
cd cmake-3.27.7-linux-x86_64
cp -rf bin/* /usr/local/bin/
cp -r share /usr/local/share/

### 下载源码
git clone https://gitee.com/milvus-io/milvus.git
# 进入下载完毕的仓库目录
cd milvus
# 删除仓库原始代码上游
git remote remove origin
# 根据自己情况选择，添加官方仓库地址为新的上游
git remote add origin https://github.com/milvus-io/milvus.git
# 或者添加自己的 fork 仓库（有读写权限，协议可以根据自己的情况选择 git 或者 https
# git remote add origin git@github.com:soulteary/milvus.git
# 拉取最新代码
git pull
# 使用 git branch --set-upstream-to 命令，把本地的分支和上游的远程分支绑定到一块儿
git branch --set-upstream-to=origin/master master
# 再次执行一次 fetch 和 pull，确保本地的代码和远程一致
git fetch && git pull origin master

### 源码编译
# Install third-party dependencies.
cd milvus/
./scripts/install_deps.sh
# Compile Milvus.
make


### 其他依赖组件安装
# etcd - 直接到github上下载对应版本
https://github.com/etcd-io/etcd/releases
# 启动etcd
- ETCD_AUTO_COMPACTION_MODE=revision
- ETCD_AUTO_COMPACTION_RETENTION=1000
- ETCD_QUOTA_BACKEND_BYTES=4294967296
- ETCD_SNAPSHOT_COUNT=50000
./etcd -advertise-client-urls=http://127.0.0.1:2379 -listen-client-urls http://0.0.0.0:2379 --data-dir /etcd
# etcd 健康检查
./etcdctl endpoint health

# minio - 到minio官网下载
https://min.io/download#/linux
# 启动minio
MINIO_ACCESS_KEY: minioadmin
MINIO_SECRET_KEY: minioadmin
./minio server /minio_data --console-address ":9001" --address ":9000"

# 启动milvus检查
ETCD_ENDPOINTS: etcd:2379
MINIO_ADDRESS: minio:9000
./milvus run standalone
# milvs健康检查
curl -f http://localhost:9091/healthz

# 编译完之后，如果要转移到其他服务器，需要拷贝如下文件
bin/milvus
configs
internel/core/output/lib
```

## 问题汇总

```bash
### Invalid setting 7.5.0 is not a valid settings.compiler.version value
vim ~/.conan/settings.yml # 找到7.5，在后面增加7.5.0

### /usr/local/bin/g++: No such file or directory
whereis g++
ln -s /usr/bin/g++ /usr/local/bin/g++

### CMake Error: Could not find CMAKE_ROOT
cp -r share /usr/local/share/

### CMake Error at CMakeLists.txt:1040 (target_link_libraries) zstd::zstd
# 将 rocksdb/6.29.5 改成 rocksdb/6.29.5@milvus/dev
vim internal/core/conanfile.py

### s2n报 tls_aes_256 相关错误
vim /root/.conan/data/s2n/1.3.55/_/_/source/src/crypto/s2n_ktls_crypto.h
# 将 tls12_crypto_info_aes_gcm_256 修改为 tls12_crypto_info_aes_gcm_128
typedef struct tls12_crypto_info_aes_gcm_128 s2n_ktls_crypto_info_tls12_aes_gcm_256;
vim /root/.conan/data/s2n/1.3.55/_/_/source/src/crypto/s2n_aead_cipher_aes_gcm.c
# 将s2n_aead_cipher_aes256_gcm_set_ktls_info函数中的TLS_CIPHER_AES_GCM_256改为TLS_CIPHER_AES_GCM_128
crypto_info->info.cipher_type = TLS_CIPHER_AES_GCM_128;

### gettid was not declared in this scope，需要在对应文件增加如下两行
#include <sys/syscall.h>
#define gettid() syscall(__NR_gettid)


### libmilvus_segcore.so undefined reference to `std::filesystem::__cxx11::path::has_filename() const
vim internal/core/src/segcore/CMakeLists.txt
# 按照下面的方式修改
target_link_libraries(milvus_segcore
  milvus_query
  ${PLATFORM_LIBS}
  ${TBB}
  ${OpenMP_CXX_FLAGS}
  stdc++fs # 增加这一行
  )
```
