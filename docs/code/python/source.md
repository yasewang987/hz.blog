# python库源码编译

* 编译打包的时候一定要确认打包环境和目标机器的python版本一致

```bash
# 直接编译安装
python setup.py install

# 编译生成whl包,在dist目录下
python setup.py bdist_wheel
```

## pyltp源码编译

```bash
# Ubuntu/Debian 安装cmake
apt-get install cmake

# 下载源码
git clone https://github.com.cnpmjs.org/HIT-SCIR/pyltp && cd pyltp
git submodule init
git submodule update --recursive
# 直接安装
python setup.py install
# 生成whl
python setup.py bdist_wheel
```

### pyltp 在 arm64 等cpu架构的系统中安装报错

如果 `mem.cc` 报错 `mm_malloc.h` 文件找不到，则按照如下命令修改文件

```bash
sed -i 's/#include <mm_malloc.h>/\/\/#include <mm_malloc.h>/g' ./ltp/thirdparty/dynet/dynet/mem.cc

sed -i 's/_mm_malloc/aligned_alloc/g' ./ltp/thirdparty/dynet/dynet/mem.cc

sed -i 's/_mm_free(mem)/\/\/_mm_free(mem)/g' ./ltp/thirdparty/dynet/dynet/mem.cc
```

### pyltp在高版本python中安装问题

在安装的时候一般都会报错，例如：`expected , or ; before __m256`

这个时候就需要根据提示找到报错文件中的报错位置，我这里是修改 `pyltp/ltp/thirdparty/eigen/Eigen/src/Core/arch/AVX512/PacketMath.h` 文件，然后根据报错找到对应行 `663:56` 的第二个 `__m256`,在前面加上 `;` 即可。

报错信息如下：

```bash
/workspace/pyltp/ltp/thirdparty/eigen/Eigen/src/Core/arch/AVX512/PacketMath.h:663:56: error: expected ‘,’ or ‘;’ before ‘__m256’
  663 |   __m256 OUTPUT##_0 = _mm512_extractf32x8_ps(INPUT, 0) __m256 OUTPUT##_1 = \
```

* 修改代码位置如下：

```txt
#ifdef EIGEN_VECTORIZE_AVX512DQ
// AVX512F does not define _mm512_extractf32x8_ps to extract _m256 from _m512
#define EIGEN_EXTRACT_8f_FROM_16f(INPUT, OUTPUT)                           \
  __m256 OUTPUT##_0 = _mm512_extractf32x8_ps(INPUT, 0) ;__m256 OUTPUT##_1 = \
      _mm512_extractf32x8_ps(INPUT, 1)
#else
```

## pytorch源码编译

### torch

* 下载对应版本的pytorch: `https://github.com/pytorch/pytorch/releases`，选择需要的版本
* 需要安装`cmake 1.13`以上的版本，龙芯的到龙芯仓库下载

```bash
# 解压
tar zxf pytorch-v1.12.1.tar.gz && cd pytorch-v1.12.1

### x86或者arm
python setup.py bdist_wheel

### 龙芯（修改如下代码）
vim third_party/sleef/src/arch/helperpurec_scalar.h
# 查找 aarch64（57行），注释掉所在行，以及对应的endif（66行）
//#if defined(__AVX2__) || defined(__aarch64__) || defined(__arm__) || defined(__powerpc64__) || defined(__zarch__) || CONFIG == 3
//#endif
# 编辑完之后编译
python setup.py bdist_wheel
```

### torchvision

* 源码下载地址：`https://github.com/pytorch/vision/releases`，选择需要的版本

```bash
# 下载
wget https://github.com/pytorch/vision/archive/refs/tags/v0.13.1.tar.gz
tar zxf v0.13.1.tar.gz

# 编译
python setup.py bdist_wheel
```

### torchaudio

```bash
# 下载源码
git clone https://github.com/pytorch/audio.git
cd audio
git checkout -b v0.12.1

# 编译
python setup.py bdist_wheel
```

### 问题处理

* `Cuda runtime error (48) : no kernel image is available for execution`

    命令检测CUDA是否安装正确并能被Pytorch检测到

    ```python
    import torch
    import torchvision
    print(torch.cuda.is_available())
    ```

    看Pytorch能不能调用cuda加速

    ```python
    a = torch.Tensor(5,3)
    a=a.cuda()
    print（a）
    ```

    一般来讲，输出主要是报48号错误，也就是CUDA的问题，出现这个问题在于硬件的支持情况，对于算力3.0的显卡来说，如果安装了9.0的CUDA就会出现这个问题，解决的办法是退回CUDA8.0，或者更换更加高端的显卡，或者直接从源码编译，并在源码中做相应设置（修改setup.py文件里的`TORCH_CUDA_ARCH_LIST`，将这个值改成你当前使用的GPU对应算力！）

## scipy源码编译

```bash
### 龙芯
# 安装lapack
wget http://pkg.loongnix.cn/loongnix-server/8.4/AppStream/loongarch64/release/Packages/lapack-3.8.0-8.lns8.loongarch64.rpm
wget http://pkg.loongnix.cn/loongnix-server/8.4/AppStream/loongarch64/release/Packages/lapack-devel-3.8.0-8.lns8.loongarch64.rpm
wget http://pkg.loongnix.cn/loongnix-server/8.4/AppStream/loongarch64/release/Packages/lapack-static-3.8.0-8.lns8.loongarch64.rpm
wget http://pkg.loongnix.cn/loongnix-server/8.4/AppStream/loongarch64/release/Packages/lapack64-3.8.0-8.lns8.loongarch64.rpm
wget http://pkg.loongnix.cn/loongnix-server/8.4/AppStream/loongarch64/release/Packages/lapack64-devel-3.8.0-8.lns8.loongarch64.rpm
wget http://pkg.loongnix.cn/loongnix-server/8.4/AppStream/loongarch64/release/Packages/lapack64-static-3.8.0-8.lns8.loongarch64.rpm
rpm -Uvh *.rpm --nodeps --force

# 下载代码
wget https://pypi.loongnix.cn/loongson/pypi/+f/f4f/a9c38d83a4650/scipy-1.7.3.tar.gz#sha256=f4fa9c38d83a4650b3f6d73cc932bf39eefef14dea0a7c8091a865848e65df6a
tar scipy-1.7.3.tar.gz && cd scipy-1.7.3

# 编译
python setup.py bdist_wheel
```
## scikit-learn源码编译
```bash
### 龙芯
# 下载源码
wget https://files.pythonhosted.org/packages/05/04/507280f20fafc8bc94b41e0592938c6f4a910d0e066be7c8ff1299628f5d/scikit-learn-0.24.2.tar.gz
tar zxf scikit-learn-0.24.2.tar.gz && cd scikit-learn-0.24.2

# 编译(如果中途编译错误，可以多试几次)
python setup.py bdist_wheel

# 编译后验证报错
libblas.so.3: cannot open shared object file: No such file or directory
# 下载blas库安装处理
wget http://pkg.loongnix.cn/loongnix-server/8.4/AppStream/loongarch64/release/Packages/blas-3.8.0-8.lns8.loongarch64.rpm
wget http://pkg.loongnix.cn/loongnix-server/8.4/AppStream/loongarch64/release/Packages/blas-devel-3.8.0-8.lns8.loongarch64.rpm
wget http://pkg.loongnix.cn/loongnix-server/8.4/AppStream/loongarch64/release/Packages/blas-devel-3.8.0-8.lns8.loongarch64.rpm
```
## numpy源码编译

```bash
### 下载源码
# 其他cpu
wget https://files.pythonhosted.org/packages/45/b7/de7b8e67f2232c26af57c205aaad29fe17754f793404f59c8a730c7a191a/numpy-1.21.6.zip
# 龙芯loongarch
wget http://pypi.loongnix.cn/loongson/pypi/+f/6e4/12643f64e9159/numpy-1.21.6.tar.gz#sha256=6e412643f64e91598f4906c040f369e2de959234eab6a8f965933d266ba0d20c

### 编译
python setup.py bdist_wheel
```

## Pillow源码编译
```bash
### 龙芯
# 下载
https://pypi.loongnix.cn/loongson/pypi/+f/69d/44745577a4664/Pillow-9.2.0.tar.gz#sha256=69d44745577a466481d834af82f16fc670dd874c59a6cbc6fb26ea29fe884822
#报错如下：
The headers or library files could not be found for jpeg
# 到龙芯仓库搜索（libjpeg）下载对应的包
wget http://pkg.loongnix.cn/loongnix-server/8.4/AppStream/loongarch64/release/Packages/libjpeg-turbo-1.5.3-12.lns8.loongarch64.rpm
wget http://pkg.loongnix.cn/loongnix-server/8.4/AppStream/loongarch64/release/Packages/libjpeg-turbo-1.5.3-12.lns8.loongarch64.rpm
wget http://pkg.loongnix.cn/loongnix-server/8.4/AppStream/loongarch64/release/Packages/libjpeg-turbo-utils-1.5.3-12.lns8.loongarch64.rpm
# 编译
python setup.py bdist_wheel
```
## Levenshtein源码编译
先升级cmake到3.18之后的版本

```bash
yum install ninja-build
# 下载代码
wget https://files.pythonhosted.org/packages/2d/c0/27bef0839c674b1dd84f18079704430896f3b29c17ad8bf3ef2ffc2d5f44/Levenshtein-0.20.7.tar.gz
tar zxf Levenshtein-0.20.7.tar.gz && cd Levenshtein-0.20.7

# 编译
python setup.py bdist_wheel
```
## tensorflow源码编译

```bash
#### 安装依赖项
apt install python3-dev python3-pip
pip install -U --user pip numpy wheel
pip install -U --user keras_preprocessing --no-deps
# 安装jdk
apt search openjdk
apt install openjdk-11-jdk


#### 安装protoc
wget https://github.com/protocolbuffers/protobuf/archive/refs/tags/v3.8.0.tar.gz
tar zxvf v3.8.0.tar.gz
cd protobuf-3.8.0
./autogen.sh
./configure
make && make install
ldconfig
# 验证protoc
protoc --version
# protoc执行报错
vim /etc/ld.so.conf.d/libprotobuf.conf 
/usr/local/lib
ln -s /usr/lib/libprotobuf.so.10.0.0 /usr/lib/libprotobuf.so

# 安装protoc-gen-grpc-java
git clone https://github.com/grpc/grpc-java
cd grpc-java/compiler
../gradlew java_pluginExecutable

#### 安装bazel
wget https://github.com/bazelbuild/bazel/archive/refs/tags/0.26.1.zip
tar zxf 0.26.1.tar.gz && cd bazel-0.26.1
export PROTOC=/usr/local/bin/protoc
./compile.sh
```

### 问题处理

* `library dfftpack has Fortran sources but no Fortran compiler found`

    ```bash
    apt install gfortran
    ```



## 其他错误

### arm64提示Failed building wheel for tokenizers

`error: can not find Rust Compiler` 

可以通过安装 `rust` 解决这个问题

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### pip安装时报【fatal error: Python.h: No such file or directory compilation terminated】错误

```bash
# ubuntu,debian
sudo apt-get install python-dev   # for python2.x installs
sudo apt-get install python3-dev  # for python3.x installs

# centos
sudo yum install python-devel   # for python2.x installs
sudo yum install python3-devel   # for python3.4 installs
```

### No module named yaml

```bash
pip install pyyaml
```