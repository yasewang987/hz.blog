# rsync指南

rsync 的最大特点是会检查发送方和接收方已有的文件，仅传输有变动的部分（默认规则是文件大小或修改时间有变动）。

## 安装

```bash
#### 参数含义
-v :展示详细的同步信息
-a :归档模式，相当于 -rlptgoD
-r :递归目录
-l :同步软连接文件
-p :保留权限
-t :将源文件的"modify time"同步到目标机器
-g :保持文件属组
-o :保持文件属主
-D :和--devices --specials一样，保持设备文件和特殊文件
-z :发送数据前，先压缩再传输
-H :保持硬链接
-n :进行试运行，不作任何更改
-P same as --partial --progress
    --partial :支持断点续传
    --progress :展示传输的进度
--delete :如果源文件消失，目标文件也会被删除
--delete-excluded :指定要在目的端删除的文件
--delete-after :默认情况下，rsync是先清理目的端的文件再开始数据同步；如果使用此选项，则rsync会先进行数据同步，都完成后再删除那些需要清理的文件。
--exclude=PATTERN :排除匹配PATTERN的文件
--exclude-from=FILE :如果要排除的文件很多，可以统一写在某一文件中
-e ssh :使用SSH加密隧道传输

# Debian/Ubuntu
$ sudo apt-get install rsync
# Red Hat/CentOS
$ sudo yum install rsync
# Arch Linux
$ sudo pacman -S rsync
```

## 基本用法

**`-r` 参数**

上面命令中，`-r`表示递归，即包含子目录。注意，`-r`是必须的，否则 `rsync` 运行不会成功。`source`目录表示源目录，`destination`表示目标目录。

```bash
rsync -r source destination

# 多个目录/文件
rsync -r source1 source2 destination
```

**`-a` 参数**

`-a`参数可以替代`-r`，除了可以递归同步以外，还可以同步元信息（比如修改时间、权限等）。由于 rsync 默认使用文件大小和修改时间决定文件是否需要更新，所以`-a`比`-r`更有用。目标目录`destination`如果不存在，rsync 会自动创建。

```bash
# 在destination目录下创建source
rsync -a source destination

# 只想同步源目录source里面的内容到目标目录destination
rsync -a source/ destination
```

**`-n` 参数**

如果不确定 rsync 执行后会产生什么结果，可以先用`-n`或`--dry-run`参数模拟执行的结果,`-v`参数则是将结果输出到终端。

```bash
rsync -anv source/ destination
```

**`--delete` 参数**

默认情况下，rsync 只确保源目录的所有内容（明确排除的文件除外）都复制到目标目录。它不会使两个目录保持相同，并且不会删除文件。如果要使得目标目录成为源目录的镜像副本，则必须使用`--delete`参数，这将删除只存在于目标目录、不存在于源目录的文件。

```bash
rsync -av --delete source/ destination
```

**`--exclude` 参数**

排除某些文件或目录，这时可以用`--exclude`参数指定排除模式。

```bash
$ rsync -av --exclude='*.txt' source/ destination
# 或者
$ rsync -av --exclude '*.txt' source/ destination
```

注意，rsync 会同步以"点"开头的隐藏文件，如果要排除隐藏文件，可以这样写`--exclude=".*"`。

如果要排除某个目录里面的所有文件，但不希望排除目录本身，可以写成下面这样。

```bash
rsync -av --exclude 'dir1/*' source/ destination

# 多个排除模式
rsync -av --exclude 'file1.txt' --exclude 'dir1/*' source/ destination
# 或
rsync -av --exclude={'file1.txt','dir1/*'} source/ destination
# 或 （每个模式一行）
rsync -av --exclude-from='exclude-file.txt' source/ destination
```

**`--include` 参数**

`--include`参数用来指定必须同步的文件模式，往往与`--exclude`结合使用.

```bash
# 排除所有文件，但是会包括 TXT 文件
rsync -av --include="*.txt" --exclude='*' source/ destination
```

## 远程同步

**SSH 协议**

rsync 默认使用 SSH 进行远程登录和数据传输。

```bash
# 同步本地到远程目录
rsync -av source/ username@remote_host:destination

# 同步远程到本地
rsync -av username@remote_host:source/ destination

# 使用端口号
rsync -av -e 'ssh -p 2234' source/ user@remote_host:/destination
```

**rsync 协议**

除了使用 SSH，如果另一台服务器安装并运行了 rsync 守护程序，则也可以用`rsync://`协议（默认端口873）进行传输。具体写法是服务器与目标目录之间使用双冒号分隔`::`。

```bash
rsync -av source/ 192.168.122.32::module/destination
# 或者
rsync -av source/ rsync://192.168.122.32/module/destination
```

注意，上面地址中的`module`并不是实际路径名，而是 rsync 守护程序指定的一个资源名，由管理员分配。

如果想知道 rsync 守护程序分配的所有 `module` 列表，可以执行下面命令。

```bash
rsync rsync://192.168.122.32
```

## 增量备份

rsync 的最大特点就是它可以完成增量备份，也就是默认只复制有变动的文件。

除了源目录与目标目录直接比较，rsync 还支持使用基准目录，即将源目录与基准目录之间变动的部分，同步到目标目录。

具体做法是，第一次同步是全量备份，所有文件在基准目录里面同步一份。以后每一次同步都是增量备份，只同步源目录与基准目录之间有变动的部分，将这部分保存在一个新的目标目录。这个新的目标目录之中，也是包含所有文件，但实际上，只有那些变动过的文件是存在于该目录，其他没有变动的文件都是指向基准目录文件的硬链接。

`--link-dest`参数用来指定同步时的基准目录。

```bash
rsync -a --delete --link-dest /compare/path /source/path /target/path
```

上面命令中，`--link-dest`参数指定基准目录`/compare/path`，然后源目录`/source/path`跟基准目录进行比较，找出变动的文件，将它们拷贝到目标目录`/target/path`。那些没变动的文件则会生成硬链接。这个命令的第一次备份时是全量备份，后面就都是增量备份了。

下面是一个脚本示例，备份用户的主目录。

```shell
#!/bin/bash

# A script to perform incremental backups using rsync

set -o errexit
set -o nounset
set -o pipefail

readonly SOURCE_DIR="${HOME}"
readonly BACKUP_DIR="/mnt/data/backups"
readonly DATETIME="$(date '+%Y-%m-%d_%H:%M:%S')"
readonly BACKUP_PATH="${BACKUP_DIR}/${DATETIME}"
readonly LATEST_LINK="${BACKUP_DIR}/latest"

mkdir -p "${BACKUP_DIR}"

rsync -av --delete \
  "${SOURCE_DIR}/" \
  --link-dest "${LATEST_LINK}" \
  --exclude=".cache" \
  "${BACKUP_PATH}"

rm -rf "${LATEST_LINK}"
ln -s "${BACKUP_PATH}" "${LATEST_LINK}"
```

上面脚本中，每一次同步都会生成一个新目录`${BACKUP_DIR}/${DATETIME}`，并将软链接`${BACKUP_DIR}/latest`指向这个目录。下一次备份时，就将`${BACKUP_DIR}/latest`作为基准目录，生成新的备份目录。最后，再将软链接`${BACKUP_DIR}/latest`指向新的备份目录。

## 配置项

`-a`、--archive参数表示存档模式，保存所有的元数据，比如修改时间（modification time）、权限、所有者等，并且软链接也会同步过去。

`--append`参数指定文件接着上次中断的地方，继续传输。

`--append-verify`参数跟--append参数类似，但会对传输完成后的文件进行一次校验。如果校验失败，将重新发送整个文件。

`-b`、--backup参数指定在删除或更新目标目录已经存在的文件时，将该文件更名后进行备份，默认行为是删除。更名规则是添加由--suffix参数指定的文件后缀名，默认是~。

`--backup-dir`参数指定文件备份时存放的目录，比如--backup-dir=/path/to/backups。

`--bwlimit`参数指定带宽限制，默认单位是 KB/s，比如--bwlimit=100。

`-c`、--checksum参数改变rsync的校验方式。默认情况下，rsync 只检查文件的大小和最后修改日期是否发生变化，如果发生变化，就重新传输；使用这个参数以后，则通过判断文件内容的校验和，决定是否重新传输。

`--delete`参数删除只存在于目标目录、不存在于源目标的文件，即保证目标目录是源目标的镜像。

`-e`参数指定使用 SSH 协议传输数据。

`--exclude`参数指定排除不进行同步的文件，比如--exclude="*.iso"。

`--exclude-from`参数指定一个本地文件，里面是需要排除的文件模式，每个模式一行。

`--existing、--ignore-non-existing`参数表示不同步目标目录中不存在的文件和目录。

`-h`参数表示以人类可读的格式输出。

`-h`、--help参数返回帮助信息。

`-i`参数表示输出源目录与目标目录之间文件差异的详细情况。

`--ignore-existing`参数表示只要该文件在目标目录中已经存在，就跳过去，不再同步这些文件。

`--include`参数指定同步时要包括的文件，一般与--exclude结合使用。

`--link-dest`参数指定增量备份的基准目录。

`-m`参数指定不同步空目录。

`--max-size`参数设置传输的最大文件的大小限制，比如不超过200KB（--max-size='200k'）。

`--min-size`参数设置传输的最小文件的大小限制，比如不小于10KB（--min-size=10k）。

`-n`参数或--dry-run参数模拟将要执行的操作，而并不真的执行。配合-v参数使用，可以看到哪些内容会被同步过去。

`-P`参数是--progress和--partial这两个参数的结合。

`--partial`参数允许恢复中断的传输。不使用该参数时，rsync会删除传输到一半被打断的文件；使用该参数后，传输到一半的文件也会同步到目标目录，下次同步时再恢复中断的传输。一般需要与--append或--append-verify配合使用。

`--partial-dir`参数指定将传输到一半的文件保存到一个临时目录，比如--partial-dir=.rsync-partial。一般需要与--append或--append-verify配合使用。

`--progress`参数表示显示进展。

`-r`参数表示递归，即包含子目录。

`--remove-source-files`参数表示传输成功后，删除发送方的文件。

`--size-only`参数表示只同步大小有变化的文件，不考虑文件修改时间的差异。

`--suffix`参数指定文件名备份时，对文件名添加的后缀，默认是~。

`-u`、--update参数表示同步时跳过目标目录中修改时间更新的文件，即不同步这些有更新的时间戳的文件。

`-v`参数表示输出细节。-vv表示输出更详细的信息，-vvv表示输出最详细的信息。

`--version`参数返回 rsync 的版本。

`-z`参数指定同步时压缩数据。

## 配合inotify使用

```bash
### 参数说明
-m,–monitor：始终保持事件监听状态   # 重要参数
-r,–recursive：递归查询目录     # 重要参数
-q,–quiet：只打印监控事件的信息     # 重要参数
–excludei：排除文件或目录时，不区分大小写
-t,–timeout：超时时间
–timefmt：指定时间输出格式  # 重要参数
–format：指定时间输出格式       # 重要参数
-e,–event：后面指定删、增、改等事件 # 重要参数

### inotifywait events 事件说明
access：读取文件或目录内容
modify：修改文件或目录内容  # 重要参数（一般选close_write）
attrib：文件或目录的属性改变
close_write：修改真实文件内容   # 重要参数
close_nowrite：文件或目录关闭，在只读模式打开之后关闭的
close：文件或目录关闭，不管读或是写模式
open：文件或目录被打开
moved_to：文件或目录移动到
moved_from：文件或目录从移动
move：移动文件或目录移动到监视目录  # 重要参数
create：在监视目录下创建文件或目录  # 重要参数
delete：删除监视目录下的文件或目录  # 重要参数
delete_self：文件或目录被删除，目录本身被删除
unmount：卸载文件系统

### 安装inotify
apt install -y inotify-tools
yum install -y inotify-tools

### 常用命令
# 创建事件
inotifywait -mrq  /data --timefmt "%d-%m-%y %H:%M" --format "%T %w%f 事件信息: %e" -e create
# 删除事件
inotifywait -mrq  /data --timefmt "%d-%m-%y %H:%M" --format "%T %w%f 事件信息: %e" -e delete
# 修改事件
inotifywait -mrq  /data --timefmt "%d-%m-%y %H:%M" --format "%T %w%f 事件信息: %e" -e close_write
```

配合rsync使用，监控脚本如下：

```bash
#!/bin/bash

Path=/home/test
Server=192.168.0.2
User=sync
module=sync_file

monitor() {
  /usr/bin/inotifywait -mrq --format '%w%f' -e create,close_write,delete $1 | while read line; do
    if [ -f $line ]; then
      rsync -avz $line --delete ${User}@${Server}::${module} --password-file=/etc/rsyncd.pass
    else
      cd $1 &&
        rsync -avz ./ --delete ${User}@${Server}::${module} --password-file=/etc/rsyncd.pass
    fi
  done
}

monitor $Path;
```
