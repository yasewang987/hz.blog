# AI相关软件安装

## openblas安装

```bash
git clone https://github.com/xianyi/OpenBLAS.git
cd OpenBLAS
make
# 如果安装到其他目录，需要设置LD_LIBRARY_PATH:/yourpath/OpenBLAS/lib
make PREFIX=/usr/local install
```