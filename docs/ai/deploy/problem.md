# 深度学习部署问题记录


## pyltp 在 arm64 等cpu架构的系统中安装报错

直接使用 pip 去安装 pyltp 时如果报错，则需要使用源码安装。

```bash
git clone https://github.com.cnpmjs.org/HIT-SCIR/pyltp && cd pyltp
git submodule init
git submodule update --recursive
python setup.py install
```

源码安装如果碰到 `cmake` 命令找不到时只需要安装cmake即可

```bash
# Ubuntu/Debian
apt-get install cmake
```

如果 `mem.cc` 报错 `mm_malloc.h` 文件找不到，则按照如下命令修改文件

```bash
sed -i 's/#include <mm_malloc.h>/\/\/#include <mm_malloc.h>/g' /home/pyltp/ltp/thirdparty/dynet/dynet/mem.cc

sed -i 's/_mm_malloc/aligned_alloc/g' /home/pyltp/ltp/thirdparty/dynet/dynet/mem.cc

sed -i 's/_mm_free(mem)/\/\/_mm_free(mem)/g' /home/pyltp/ltp/thirdparty/dynet/dynet/mem.cc
```

## pyltp在高版本python中安装问题

一般如果不是python3.6的环境安装pyltp都不会成功

那就需要使用源码的方式安装：

```bash
git clone https://github.com/HIT-SCIR/pyltp && cd pyltp
git submodule init
git submodule update
python setup.py install
```

在安装的时候一般都会报错，例如：`expected , or ; before __m256`

这个时候就需要根据提示找到报错文件中的报错位置，我这里是修改 `pyltp/ltp/thirdparty/eigen/Eigen/src/Core/arch/AVX512/PacketMath.h` 文件，然后根据报错找到对应行 `663:56` 的第二个 `__m256`,在前面加上 `;` 即可。

报错信息如下：

```bash
/workspace/pyltp/ltp/thirdparty/eigen/Eigen/src/Core/arch/AVX512/PacketMath.h:663:56: error: expected ‘,’ or ‘;’ before ‘__m256’
  663 |   __m256 OUTPUT##_0 = _mm512_extractf32x8_ps(INPUT, 0) __m256 OUTPUT##_1 = \
```

修改代码位置如下：

```txt
#ifdef EIGEN_VECTORIZE_AVX512DQ
// AVX512F does not define _mm512_extractf32x8_ps to extract _m256 from _m512
#define EIGEN_EXTRACT_8f_FROM_16f(INPUT, OUTPUT)                           \
  __m256 OUTPUT##_0 = _mm512_extractf32x8_ps(INPUT, 0) ;__m256 OUTPUT##_1 = \
      _mm512_extractf32x8_ps(INPUT, 1)
#else
```

## 源码安装 pytorch 报错

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

## arm64提示Failed building wheel for tokenizers

`error: can not find Rust Compiler` 

可以通过安装 `rust` 解决这个问题

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## 源码安装scipy报错

* `library dfftpack has Fortran sources but no Fortran compiler found`

    ```bash
    apt install gfortran
    ```

## pip安装时报【fatal error: Python.h: No such file or directory compilation terminated】错误

```bash
# ubuntu,debian
sudo apt-get install python-dev   # for python2.x installs
sudo apt-get install python3-dev  # for python3.x installs

# centos
sudo yum install python-devel   # for python2.x installs
sudo yum install python3-devel   # for python3.4 installs
```