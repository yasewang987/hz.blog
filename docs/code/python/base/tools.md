# Python实用工具

## Nuitka打包

Nuitka 是一个 Python 到 C 的编译器，它会将 Python 代码转换为等效的 C 代码，然后使用标准的 C 编译器（如 GCC）将其编译为二进制可执行文件。这一过程不仅提高了程序的执行效率，还能通过编译后的二进制文件保护代码的隐私。

Nuitka的工作流程大致如下：
* Python解析：Nuitka首先解析Python代码，生成抽象语法树（AST）。
* C++转换：然后将AST转换为对应的C++代码。
* 编译链接：最后，通过C++编译器（如GCC或Clang）编译生成可执行文件。

```bash
# 在安装 Nuitka 之前，确保你的环境中已经安装了 Python 和 C 编译器（如 GCC）
# 安装nuitka
pip install nuitka


### 参数
# --windows-disable-console 去掉控制台
# --standalone：表示生成独立的可执行文件，包含所有依赖。
# --mingw64：指定使用MinGW64作为C++编译器。
# --lto=yes：启用链接时优化（Link Time Optimization），进一步提高性能。
# --remove-output：编译完成后，自动删除中间文件。

# 单文件
nuitka --standalone --mingw64 --lto=yes --remove-output hello.py
# 多文件（直接指定入口文件，Nuitka会自动处理所有依赖文件）
nuitka --standalone --mingw64 main.py
```

