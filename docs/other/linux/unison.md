# Unison文件双向同步

默认是增量同步，对实时性要求比较高的可以配合`inotify`使用。

* github地址：https://github.com/bcpierce00/unison

## 安装

```bash
# ubuntu
apt install -y unison
# 【建议配合定时任务执行】在配置repeat时如果设置了watch，需要依赖inotify
apt install inotify-tools

### 源码安装
# 安装ocaml
tar -zxvf ocaml-3.12.1.tar.gz
cd ocaml-3.12.1
./configure
make install
ocaml -version
# 安装unison
tar -zxvf unison-2.48.4.tar.gz
cd src
make UISTYLE=text
mkdir /root/bin
cp unison /root/bin/
make install
unison -version

# 设置两台服务器的ssh免密登录，参考linux常用命令
```

## 简单使用

```bash
#### 参数说明
# 用于指定在同步过程中如何处理文件权限（mode bits）。这里的数字 0o1622 是一个八进制数字，它代表了 Unix/Linux 系统中的文件权限掩码。0o 代表八进制，622 代表权限，当你的目录权限不足时可以调整这个数值。当你添加 -perms 参数时，Unison 将在同步文件和目录内容的同时，也会同步文件和目录的权限属性。
-perms 0o1622
# 这个选项告诉 Unison 在比较两个目录时先进行快速检查，利用上次同步时记录的元数据信息，仅比较自上次同步以来可能发生变化的文件。这样可以大大提高同步速度，尤其是在大型目录树中。
-fastcheck true
# 使用此选项，Unison 将以非交互模式运行，所有需要用户确认的操作都将自动执行，不会停下来询问用户。
-batch
# 同样表示以非交互模式运行，并且在发生冲突时自动解决冲突，选择最后一次修改的版本。
-auto
# 运行时静默模式，只显示错误消息，不显示同步进度和同步详情。
-silent
# 设置 Unison 持续监控并立即同步，这里的 watch+3600 表示每 3600 秒（即 1 小时）扫描一次文件系统变更，在检测到变更时立即执行同步。这里 watch 和数字可以单独使用，仅数字，即定期多少秒同步一次，仅 watch 则仅监控文件变化时同步，二者结合则两者同时进行。
-repeat watch+3600
# 如果同步过程中发生错误，Unison 将尝试重试 3 次。这对于网络不稳定或者其他暂时性错误的情况很有帮助。
-retry 3
# 这个选项后面通常跟着一个模式或者一组模式，用于指定需要忽略的文件或目录。例如：-ignore "Name .git" 将忽略名为 .git 的文件或目录。
-ignore
# 表示强制执行同步，即使目标目录中有些文件比源目录中的新或不同，也覆盖目标目录的内容
-force
# 表示在有冲突的情况下，优先使用 srcdir（源目录）中的文件
-prefer srcdir 
# 忽略目标目录中新增的文件
-ignorenew

### 双向同步
# 示例1:
unison "~/demo1" "~/demo2" -perms 0o1622 -fastcheck true -batch -auto -silent -repeat watch+3600 -retry 3 -ignore "Name .git" -ignore "Name ." -ignore "Name .cache" -ignore "Name .trash"

### 远程目录-ssh
unison -sshargs="-p 2017" /root/test-unison ssh://root@192.168.0.173//root/test-unison

### 单向同步（可以通过指定 -force 和 -prefer 选项来实现单向同步。）
# 示例1:
unison -force srcdir trgdir -prefer srcdir -ignorenew trgdir

### 强制全量同步
# 使用 -ignorearchives 选项，这样 Unison 会重新计算所有文件的哈希值，当作首次同步一样处理
unison -ignorearchives source_directory target_directory
```


## 实际使用

```bash
#### 新建 ~/.unison/test222.prf 文件，内容如下
#Unison preferences file 
root = /root/test-unison
root = ssh://root@192.168.0.173//root/test-unison/
#force = 
#ignore = 
batch = true 
repeat = watch+60
retry = 3 
#owner = true 
#group = true 
perms = -1 
fastcheck = false
rsync = false 
sshargs = -p 2017
xferbycopying = true 
log = true 
logfile = /root/.unison/unison.log

#### 执行同步
unison test222
```