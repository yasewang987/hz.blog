# python问题处理

* `ImportError: libffi.so.6: cannot open shared object file: No such file or directory`

```bash
# 查找文件
find / -name "libffi.so*"
# 创建软链接
ln -s /usr/lib/aarch64-linux-gnu/libffi.so.7 /usr/lib/aarch64-linux-gnu/libffi.so.6
```

* `invalid command 'bdist_wheel`

```bash
pip install wheel
```

* `Could not find a package configuration file provided by “Opencv“`

```bash
# 在CMakeList.txt中查找
find_package(OpenCV REQUIRED)
# 在上面一行增加如下内容
set(OpenCV_DIR /opt/opencv-4.5.2/build)
```

* `Your system has an unsupported version of sqlite3. Chroma`

```bash
# 到https://www.sqlite.org/download.html下载源码
wget https://www.sqlite.org/2024/sqlite-autoconf-3450200.tar.gz
tar -zxvf sqlite-autoconf-3450200.tar.gz
cd sqlite-autoconf-3450200
./configure
make
make install
# 查看版本，如果是旧版本，则做一个软连接
sqlite3 --version
# 设置环境变量
export LD_LIBRARY_PATH="/usr/local/lib"
# 进入python环境验证（显示最新版本即可）
python
import sqlite3
sqlite3.sqlite_version
```