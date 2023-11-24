# Milvus国产环境适配

## 源码编译

```bash
### 安装环境依赖
go: >= 1.18
cmake: >= 3.18
gcc: 7.5

# cmake可以到官网下载已经编译好的tar.gz压缩包
tar zxf cmake-3.27.7-linux-x86_64.tar.gz
cd cmake-3.27.7-linux-x86_64
cp -rf bin/* /usr/local/bin/
cp -r share /usr/local/share/

### 下载源码
git clone https://gitee.com/milvus-io/milvus.git
# 进入下载完毕的仓库目录
cd milvus
# 删除仓库原始代码上游
git remote remove origin
# 根据自己情况选择，添加官方仓库地址为新的上游
git remote add origin https://github.com/milvus-io/milvus.git
# 或者添加自己的 fork 仓库（有读写权限，协议可以根据自己的情况选择 git 或者 https
# git remote add origin git@github.com:soulteary/milvus.git
# 拉取最新代码
git pull
# 使用 git branch --set-upstream-to 命令，把本地的分支和上游的远程分支绑定到一块儿
git branch --set-upstream-to=origin/master master
# 再次执行一次 fetch 和 pull，确保本地的代码和远程一致
git fetch && git pull origin master

### 源码编译

```

## 问题汇总

```bash
# Invalid setting 7.5.0 is not a valid settings.compiler.version value
vim ~/.conan/settings.yml # 找到7.5，在后面增加7.5.0

# /usr/local/bin/g++: No such file or directory
whereis g++
ln -s /usr/bin/g++ /usr/local/bin/g++

# CMake Error: Could not find CMAKE_ROOT
cp -r share /usr/local/share/

# CMake Error at CMakeLists.txt:1040 (target_link_libraries)

```
