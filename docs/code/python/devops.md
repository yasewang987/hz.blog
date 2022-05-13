# Python运维脚本

## 执行外部程序或命令

* 调用程序简单示例

```c
// C语言程序cal.c(已编译为.out文件)
#include<stdio.h>
#include<stdlib.h>
int main(int argc, char* argv[]){
    int a = atoi(argv[1]);
    int b = atoi(argv[2]);
    int c = a + b;
    printf("%d + %d = %d\n", a, b, c);
    return 0;
}
```

```py
# 使用subprocess模块的run函数来spawn一个子进程
res = subprocess.run(["Python-Lang/cal.out", "1", "2"])
print(res.returncode) 
```

* 调用程序死循环

```c
#include<stdio.h>
#include<stdlib.h>
int main(int argc, char* argv[]){
    while(1);
    return 0;
}
```

```py
##### 这样执行会一直卡住，需要在程序运行中用kill命令将其终止掉
res = subprocess.run("Python-Lang/while.out")
print(res.returncode)

###### 可以设置超时机制并进行异常捕捉
try:
    res = subprocess.run(["Python-Lang/while.out"], capture_output=True, timeout=5)
except subprocess.TimeoutExpired as e:
    print(e)
# 异常输出
Command '['Python-Lang/while.out']' timed out after 5 seconds
```

* 获取程序的输出结果到python

```py
# 加上capture_output参数，然后访问返回对象的stdout属性
res = subprocess.run(["netstat", "-a"], capture_output=True)
out_bytes = res.stdout
out_text = out_bytes.decode("utf-8")
print(out_text)
# 输出
...
kctl       0      0     33      6 com.apple.netsrc
kctl       0      0     34      6 com.apple.netsrc
kctl       0      0      1      7 com.apple.network.statistics
kctl       0      0      2      7 com.apple.network.statistics
kctl       0      0      3      7 com.apple.network.statistics
```

* python通过shell执行命令

```py
# 给定参数shell=True并将命令以简单的字符串形式提供
out_bytes = subprocess.run("ps -a|wc -l> out", shell=True)
```

## 文件和目录操作（命名、删除、拷贝、移动等）

```py
import os
file_name = "/Users/orion-orion/Documents/LocalCode/Learn-Python/Python-Lang/test.txt"
print(os.path.basename(file_name)) 
# test.txt
print(os.path.dirname(file_name))
# /Users/orion-orion/Documents/LocalCode/Learn-Python/Python-Lang
print(os.path.split(file_name))
# ('/Users/orion-orion/Documents/LocalCode/Learn-Python/Python-Lang', 'test.txt')
print(os.path.join("/new/dir", os.path.basename(file_name)))
# /new/dir/test.txt

### os.path.expanduser当用户或$HOME未知时, 将不做任何操作
print(os.path.expanduser("~/Documents"))
# /Users/orion-orion/Documents


### 删除文件
file_name = "Python-Lang/test.txt"
if os.path.exists(file_name):
    os.remove(file_name)

### 拷贝文件
os.system("cp Python-Lang/test.txt Python-Lang/test2.txt")

### 不使用shell，使用shutil模块

src = "Python-Lang/test.txt"
dst = "Python-Lang/test2.txt"

# 对应cp src dst (拷贝文件，存在则覆盖)
shutil.copy(src, dst) 


src = "Python-Lang/sub_dir"
dst = "Python-Lang/sub_dir2"
# 对应cp -R src dst (拷贝整个目录树)
shutil.copytree(src, dst)

src = "Python-Lang/test.txt"
dst = "Python-Lang/sub_dir/test2.txt"
# 对应mv src dst (移动文件，可选择是否重命名)
shutil.move(src, dst)

### 默认情况下，如果源文件是一个符号链接，那么目标文件将会是该链接所指向的文件的拷贝。如果只想拷贝符号链接本身，可以提供关键字参数follow_symlinks:
shutil.copy(src, dst, follow_symlinks=True)

### 拷贝的目录中保留符号链接
shutil.copytree(src, dst, symlinks=True)

### 拷贝整个目录时需要对特定的文件和目录进行忽略，如.pyc这种中间过程字节码
def ignore_pyc_files(dirname, filenames):
    return [name for name in filenames if name.endswith('pyc')] 


shutil.copytree(src, dst, ignore=ignore_pyc_files)

### 忽略文件名这种模式非常常见，已经有一个实用函数ignore_patterns()提供给我们使用
shutil.copytree(src, dst, ignore=shutil.ignore_patterns("*~", "*.pyc"))
```

## 创建和解包归档文件

```py
### 直接使用shutil模块
import shutil
shutil.make_archive(base_name="data", format="zip", root_dir="Python-Lang/data")
shutil.unpack_archive("data.zip")
# format为期望输出的格式。要获取所支持的归档格式列表，可以使用get_archive_formats()函数：
print(shutil.get_archive_formats())
# [('bztar', "bzip2'ed tar-file"), ('gztar', "gzip'ed tar-file"), ('tar', 'uncompressed tar file'), ('xztar', "xz'ed tar-file"), ('zip', 'ZIP file')]

### 创建然后解包.zip归档文件
import zipfile


with zipfile.ZipFile('Python-Lang/data.zip', 'w') as zout:
    zout.write(filename='Python-Lang/data/test1.txt', arcname="test1.txt")
    zout.write(filename='Python-Lang/data/test2.txt', arcname="test2.txt")
with zipfile.ZipFile('Python-Lang/data.zip', 'r') as zin:
    zin.extractall('Python-Lang/data2') #没有则自动创建data2目录    
```
