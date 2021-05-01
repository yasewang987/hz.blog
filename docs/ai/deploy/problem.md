# 深度学习部署问题记录

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