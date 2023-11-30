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
