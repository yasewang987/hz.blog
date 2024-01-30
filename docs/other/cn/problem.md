# 源码编译问题汇总

* `field has incomplete type`问题：

只需要将提示文件对应位置的变量改为`指针`。

* `CMake Error at CMakeLists.txt:1040 (target_link_libraries)`问题：

查看对应源码中的CMakeLists.txt，然后对应的位置输出库信息 `message("cmake_module_path: " ${CMAKE_MODULE_PATH})` 

* `gettid was not declared in this scope`，需要在对应文件增加如下两行

```c
#include <sys/syscall.h>
#define gettid() syscall(__NR_gettid)
```
* `undefined reference to std::filesystem::__cxx11::path::has_filename() const`,需要修改`CMakeLists.txt`文件

```bash
target_link_libraries(milvus_segcore
  milvus_query
  ${PLATFORM_LIBS}
  ${TBB}
  ${OpenMP_CXX_FLAGS}
  stdc++fs # 增加这一行
  )
```

* SM机器在运行程序时报错 `cannot allocate memory`，确认包没问题的前提下

```bash
# 修改 /etc/sysctl.conf
vm.overcommit_memory=1
kernel.pid_max # 这个值可以设置大一些

# 保存之后生效
sysctl -p

# 查看设置后的值
cat /proc/sys/kernel/pid_max
```

* 如果SM包在其他服务器正常，通过堡垒机或者其他ssh管理系统连接到服务器时，执行报错 `permission denied`，一般是管理系统限制的问题。可以直接到物理机器上执行看看是否可以正常运行。