# DM国产适配

* 问题处理集合：https://eco.dameng.com/document/dm/zh-cn/faq/faq-python.html

## 源码编译达梦python库

先按照下面文档部署达梦数据库（其中的iso文件需要去官网首页根据cpu型号和服务器系统下载对应版本）

* 安装前置准备资料：https://eco.dameng.com/document/dm/zh-cn/start/install-dm-linux-prepare.html
* 安装数据库：https://eco.dameng.com/document/dm/zh-cn/start/dm-install-linux.html

按照上面步骤安装完达梦数据库之后，会在 `/dm8` 目录下出现 `drivers` 目录下有编译python库的源码，按照下面资料打包

* python打包参考资料：https://eco.dameng.com/document/dm/zh-cn/app-dev/develop-environment-prepare-python.html

```bash
# 设置环境变量（如果是其他目录自行切换）
export DM_HOME="/dm8"

cd /dm8/drivers/python/dmPython
# 编译whl包（没问题的话会在dist目录下找到whl包）
python setup.py bdist_wheel
```

## python访问dm数据库

1. 切换到python环境
1. 安装whl包 `pip install xxxx.whl`
1. 在 `/dm8/drivers/dpi` 目录下找到 `libdmdpi.so` 文件，拷贝到对应服务器的 `/usr/lib/x86_64-linux-gn` 目录，主要是让python应用能读到这个so文件

