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