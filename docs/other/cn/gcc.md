# Gcc资料

* 将lib中的库文件装到目标机器的lib,`/usr/lib,/usr/local/lib`.
* 将lib装到目标机器任意位置,通过添加目标机器lib的路径到`LD_LIBRARY_PATH`或到`ld.so.confg`来运行时加载.
* 要么在目标机器中额外运行脚本进行`rpath`修改.要么`cmake`写好`install_rpath`通过安装到源码机器来修改`rpath`,然后拷贝给目标用户.

## 其他库编译

* 源码编译时，如果目标机器的gcc版本比较低，会出现找不到 `GLIB_xxx` 找不到的问题，一般建议在对应的低版本gcc环境直接编译。

* 打包依赖的`so`文件

`rpath`:指定了可执行文件执行时搜索so文件的第一优先位置, `rpath > LD_LIBRARY_PATH > runpath > ldconfig缓存 > 默认的/lib,/usr/lib等`

`interpreter`: 动态库加载器，程序启动时，操作系统会先把控制权转交给`ld-linux-x86-64.so.2`，该so负责加载所有程序依赖的so。。这个字段在链接时会帮你自动设置，64bit程序一般为`/lib64/ld-linux-x86-64.so.2`。修改`rpath`或者`LD_LIBRARY_PATH`指向本地lib目录，但通过`ldd`程序，发现`/lib64/ld-linux-x86-64.so.2`这个so仍然指向系统so。原因就是这个字段是写死在`elf`文件中的，并不受`LD_LIBRARY_PATH`影响。

```bash
#### 方式一：在编译时设置rpath和dynamic linker
# 绝对路径，rpath，dynamic-linker两个参数分别设置的elf文件中的rpath和interpreter字段。
gcc -Wl,-rpath='/my/lib',-dynamic-linker='/my/lib/ld-linux.so.2'
# 相对目录，ld会将ORIGIN理解成可执行文件所在的路径
gcc -Wl,-rpath='$ORIGIN/../lib'

#### 方式二：直接修改二进制程序的rpath和interpreter，一般在无法编译时使用
# 安装patchelf
dnf install patchelf
# 绝对路径
patchelf --set-rpath /my/lib your_program
patchelf --set-interpreter /my/lib/ld-linux.so.2 your_program
# 相对路径
patchelf --set-rpath `pwd`/../lib your_program
patchelf --set-interpreter `pwd`/../lib/ld-linux-x86-64.so.2 ./your_program
```

## 动态链接库

* `LIBRARY_PATH`:环境变量用于在程序编译期间查找动态链接库时指定查找共享库的路径(编译需要用到的动态链接库的目录),
    ```bash
    export LIBRARY_PATH=LIBDIR1:LIBDIR2:$LIBRARY_PATH
    ```
    开发时，设置`LIBRARY_PATH`，以便`gcc`能够找到编译时需要的动态链接库。

* `LD_LIBRARY_PATH`:环境变量用于在程序加载运行期间查找动态链接库时指定除了系统默认路径之外的其他路径（在系统默认路径之前进行查找）。
    ```bash
    export LD_LIBRARY_PATH=LIBDIR1:LIBDIR2:$LD_LIBRARY_PATH
    ```
    发布时，设置`LD_LIBRARY_PATH`，以便程序加载运行时能够自动找到需要的动态链接库。

```bash
# 查看依赖的动态链接库
ldd /opt/mypackage/python
# 输出
inux-vdso.so.1 (0x00007fff065e4000)
liba.so => not found
libstdc++.so.6 => /usr/lib/x86_64-linux-gnu/libstdc++.so.6 (0x00007fa1d384e000)
libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007fa1d345d000)
libm.so.6 => /lib/x86_64-linux-gnu/libm.so.6 (0x00007fa1d30bf000)
/lib64/ld-linux-x86-64.so.2 (0x00007fa1d3dd9000)
libgcc_s.so.1 => /lib/x86_64-linux-gnu/libgcc_s.so.1 (0x00007fa1d2ea7000
```

## 调试

```bash
# readelf读取elf
readelf -d /opt/mypackage/python
# 输出
  Tag        Type                         Name/Value
 0x0000000000000001 (NEEDED)             Shared library: [liba.so]
 0x0000000000000001 (NEEDED)             Shared library: [libstdc++.so.6]
 0x0000000000000001 (NEEDED)             Shared library: [libc.so.6]
 0x000000000000000f (RPATH)              Library rpath: [./cmake-build-debug:lib]

# 查看依赖的so是否都有找到
ldd /opt/mypackage/python
# 输出
linux-vdso.so.1 (0x00007ffe371d9000)
liba.so => ./cmake-build-debug/liba.so (0x00007f544df24000)
libstdc++.so.6 => /usr/lib/x86_64-linux-gnu/libstdc++.so.6 (0x00007f544db9b000)
libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f544d7aa000)
libb.so => lib/libb.so (0x00007f544d5a8000)
libm.so.6 => /lib/x86_64-linux-gnu/libm.so.6 (0x00007f544d20a000)
/lib64/ld-linux-x86-64.so.2 (0x00007f544e328000)
libgcc_s.so.1 => /lib/x86_64-linux-gnu/libgcc_s.so.1 (0x00007f544cff2000)

# 使用LD_DEBUG查看加载动态库的搜索过程,可以查看到某个so库加载不成功的问题
LD_DEBUG=libs /opt/mypackage/python
# 输出
          ............................................
15452:     find library=libb.so [0]; searching
15452:      search path=./cmake-build-debug/tls/haswell/x86_64:...lib/x86_64:lib               (RPATH from file ./test)
15452:       trying file=./cmake-build-debug/tls/haswell/x86_64/libb.so
          ............................................
15452:       trying file=lib/libb.so
```

## gcc源码编译

```bash
# 下载gcc指定版本源码（选择需要的版本）
https://mirrors.bfsu.edu.cn/gnu/gcc

# 这里下载7.5版本
cul -O https://mirrors.bfsu.edu.cn/gnu/gcc/gcc-7.5.0/gcc-7.5.0.tar.gz

# 解压
tar -zxvf gcc-7.5.0.tar.gz

cd gcc-7.5.0
# 下载依赖
./contrib/download_prerequisites
# 编译
./configure --prefix=/opt/gcc-7.5.0 --enable-checking=release --enable-languages=c,c++ --disable-multilib
make
make install
# check
gcc --version
```