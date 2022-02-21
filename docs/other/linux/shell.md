# Shell 脚本

## 文件/文件夹相关判断

参数详解：

```text
-e filename 如果 filename存在，则为真 
-d filename 如果 filename为目录，则为真 
-f filename 如果 filename为常规文件，则为真 
-L filename 如果 filename为符号链接，则为真 
-r filename 如果 filename可读，则为真 
-w filename 如果 filename可写，则为真 
-x filename 如果 filename可执行，则为真 
-s filename 如果文件长度不为0，则为真 
-h filename 如果文件是软链接，则为真
```

例子：

```shell
#!/bin/bash

# shell判断文件,目录是否存在或者具有权限
folder="/var/www/"
file="/var/www/log"
 
# -x 参数判断 $folder 是否存在并且是否具有可执行权限
if [ ! -x "$folder"]; then
  mkdir "$folder"
fi

# -d 参数判断 $folder 是否存在
if [ ! -d "$folder"]; then
  mkdir "$folder"
fi


# -f 参数判断 $file 是否存在
if [ ! -f "$file" ]; then
  touch "$file"
fi

# -n 判断一个变量是否有值,var 没有值输出 is empty
if [ ! -n "$var" ]; then
  echo "$var is empty"
  exit 0
fi

# 判断两个变量是否相等
if [ "$var1" = "$var2" ]; then
  echo '$var1 eq $var2'
else
  echo '$var1 not eq $var2'
fi
```

## 判断字符串是否为空

```bash
# 判断是否存在runnertest-master容器
if [ $(docker ps -a --format {{.Names}} | grep runnertest-master) ]; then
    echo "runnertest-master already run"
fi
```

## 获取服务器ip地址

```bash
ip addr | grep global | head -1 | awk '{print $2}' | cut -d / -f 1
```

## shell脚本自定义参数

```shell
#!/bin/bash
echo $0    # 当前脚本的文件名（间接运行时还包括绝对路径）。
echo $n    # 传递给脚本或函数的参数。n 是一个数字，表示第几个参数。例如，第一个参数是 $1 。
echo $#    # 传递给脚本或函数的参数个数。
echo $*    # 传递给脚本或函数的所有参数。
echo $@    # 传递给脚本或函数的所有参数。被双引号 (" ") 包含时，与 $* 不同，下面将会讲到。
echo $?    # 上个命令的退出状态，或函数的返回值。
echo $$    # 当前 Shell 进程 ID。对于 Shell 脚本，就是这些脚本所在的进程 ID。
echo $_    # 上一个命令的最后一个参数
echo $!    # 后台运行的最后一个进程的 ID 号
```

执行命令

```bash
./test.sh test test1 test2 test3 test4

# 结果如下
./test.sh                      # $0
                               # $n
5                              # $#
test test1 test2 test3 test4   # $*
test test1 test2 test3 test4   # $@
0                              # $?
12305                          # $$
12305                          # $_
                               # $!
```

使用 `getopts` 实现自定义参数, 后面不带 `:` 表示没有值

```shell
#!/bin/bash
while getopts a:b:c:d ARGS  
do  
case $ARGS in   
    a)  
        echo "发现 -a 选项"
        echo "-a 选项的值是: $OPTARG"
        ;;  
    b)  
        echo "发现 -b 选项"  
        echo "-b 选项的值是: $OPTARG"  
        ;;  
    c)  
        echo "发现 -c 选项"  
        echo "-c 选项的值是: $OPTARG"  
        ;;  
    d)  
        echo "发现 -d 参数"
        ;;  
    *)  
        echo "未知选项: $ARGS"
        ;;
    "?")
        echo "未知选项 $OPTARG"
        ;;
    ":")
        echo "没有输入任何选项 $OPTARG"
        ;;
    *)
        # 发生不能预料的错误时。
        echo "处理选项时出现未知错误"
        ;;
esac
done
```

