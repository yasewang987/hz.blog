# Shell 脚本

## shell常用命令

```bash
# echo输出换行
# 默认情况下，echo关闭了对转义字符的解释，添加 -e 参数可打开echo对转义字符的解释功能
echo -e '\n\n文本内容'
```

## 中括号用法总结

Shell 里面的中括号（包括单中括号与双中括号）可用于一些条件的测试：

* 算术比较, 比如一个变量是否为0, `[ $var -eq 0 ]`。
* 文件属性测试，比如一个文件是否存在，`[ -e $var ]`, 是否是目录，`[ -d $var ]`。
* 字符串比较, 比如两个字符串是否相同， `[[ $var1 = $var2 ]]`。

`[]` 常常可以使用 `test` 命令来代替

```bash
if [ $var -eq 0 ]; then echo "True"; fi
# 等于
if test $var -eq 0; then echo "True"; fi
```

## 算术比较

```bash
# -gt 大于
# -lt 小于
# -ge 大于或等于
# -le 小于或等于

# 需要注意的是 [ 与 ] 与操作数之间一定要有一个空格，否则会报错。
[ $var -eq 0 ]  # 当 $var 等于 0 时，返回真
[ $var -ne 0 ]  # 当 $var 不等于 0 时，返回真

# 可以通过 -a (and) 或 -o (or) 结合多个条件进行测试：
[ $var1 -ne 0 -a $var2 -gt 2 ]  # 使用逻辑与 -a
[ $var1 -ne 0 -o $var2 -gt 2 ]  # 使用逻辑或 -o
```

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

## 判断字符串是否相等

```bash
# 如果 str1 与 str2 不相同，则返回真
[[ $str1 != $str2 ]]
# 如果 str1 是空字符串，则返回真
[[ -z $str1 ]]
# 如果 str1 是非空字符串，则返回真
[[ -n $str1 ]]
# 如果 str1 与 'abc' 不相同，则返回真
[ $str1 != 'abc' ]

# 当 str1等于str1等于str2 时，返回真。也就是说，str1 和 str2 包含的文本是一样的。其中的单等于号也可以写成双等于号，也就是说，上面的字符串比较等效于 [[ $str1 == $str2 ]]。
# 注意 = 前后有一个空格，如果忘记加空格, 就变成了赋值语句，而非比较关系了。
if [[ $str1 = $str2 ]]; then
  echo '相等'
else
  echo '不相等'
fi

# 使用逻辑运算符 && 和 || 可以轻松地将多个条件组合起来
str1="Not empty"
str2=""
if [[ -n $str1 ]] && [[ -z $str2 ]];
then
  echo str1 is nonempty and str2 is empty string.
fi
```

## 判断字符串是否为空

```bash
# 判断是否存在runnertest-master容器
if [ $(docker ps -a --format {{.Names}} | grep runnertest-master) ]; then
    echo "runnertest-master already run"
fi
```

## 判断系统命令是否存在

```bash
if (command -v docker2 > /dev/null 2>&1); then
  echo exits
else
  echo not exits
fi
```

## 获取服务器ip地址

```bash
ip addr | grep global | head -1 | awk '{print $2}' | cut -d / -f 1
```

## for循环

```bash
# 数组定义
services=(crm word sql redis)
# 循环1(不带数组下标)
for s in ${services[@]}
do
if [[ -z $(docker service ls -f name=fc-${s} --format {{.Name}}) ]]; then
  echo 【${s}】未部署，请先部署服务
  exit 1
fi
done

# 获取数组长度
echo ${#services[@]}
# 循环2（使用数组下标）
for ((i=1; i<=${#services[@]}; i++))
do
if [[ -z $(docker service ls -f name=fc-${services[i]} --format {{.Name}}) ]]; then
  echo 【${services[i]}】未部署，请先部署服务
  exit 1
fi
done
```

## 算术运算

```bash
((expression))

Sum=$((10+3))

Num1=10  
Num2=3  
((Sum=Num1+Num2)) 

Num1=10  
Num2=3  
Sum=$((Num1+Num2))  
```

## 字符串操作

```bash
# 替换（只替换一个）
var="AAAszip_BBB.zip";var2=${var/zip/ZIP};echo $var2};
AAAsZIP_BBB.zip
var="AAAszip_BBB.zip";var2=${var/.zip/.ZIP};echo $var2;
AAAszip_BBB.ZIP

# 替换所有
var="AAAszip_BBB.zip";var2=${var//zip/ZIP};echo $var2;
AAAsZIP_BBB.ZIP

# 替换开头一个
var=".zipAAAszip_BBB.zip_CCC";var2=${var/#.zip/.ZIP};echo $var2;
.ZIPAAAszip_BBB.zip_CCC

# 替换结尾一个
var="AAAszip_BBB.zip_CCC.zip";var2=${var/%.zip/.ZIP};echo $var2;
AAAszip_BBB.zip_CCC.ZIP

# 截取，删除右边，保留左边，从右起最短匹配
a="aaa=bbb";b=${a%=*};echo $b
aaa
a="http://localhost:3000/china/shanghai.html";b=${a%/*};echo $b
http://localhost:3000/china
#  截取，删除右边，保留左边，从右起最长匹配
a="http://localhost:3000/china/shanghai.html";b=${a%%/*};echo $b
http:

# 截取，删除左边，保留右边，从左起最短匹配
a="aaa=bbb";b=${a#*=};echo $b
bbb
a="http://localhost:3000/china/shanghai.html";b=${a#*/};echo $b
/localhost:3000/china/shanghai.html

# 截取，删除左边，保留右边，从左起最长匹配
a="http://localhost:3000/china/shanghai.html";b=${a##*/};echo $b
shanghai.html
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


## shell脚本自动交互-expect

基本命令：

* send：向进程发送字符串，用于模拟用户的输入，该命令不能自动回车换行，一般要加 `\r`（回车）
* expect: expect的一个内部命令，判断上次输出结果里是否包含指定的字符串，如果有则立即返回，否则就等待超时时间后返回。只能捕捉由`spawn`启动的进程的输出
* spawn: 启动进程，并跟踪后续交互信息
* interact：执行完成后保持交互状态，把控制权交给控制台
* Timeout：指定超时时间，过期则继续执行后续指令
* exp_continue：允许expect`继续`向下执行指令
* send_user: 回显命令，相当于echo


```bash
# 安装
yum -y install expect
apt install -y expect

## 源码安装
# 下载
wget  http://core.tcl.tk/tcl/zip/release/tcl.zip
wget https://jaist.dl.sourceforge.net/project/expect/Expect/5.45.3/expect5.45.3.tar.gz
# 安装tcl
unzip tcl.zip && cd ./tcl/unix
./configure && make && make install
# 安装expect
cd /tmp && tar -xzvf expect5.45.3.tar.gz && cd expect5.45.3/
./configure && make && make install
# 检查是否安装好
expect -v
```

例子：mysql数据备份

```sh
#!/bin/bash
#导出sql脚本
echo $(date "+%Y-%m-%d") backup start
echo mysql backup start
mysqldump -u数据库用户名 -p数据库密码 pm_prod2.0 > /mnt/data/mysql_backup/pm_shandong_$(date "+%Y-%m-%d").sql
echo mysql backup finish
#scp跨机器备份
echo sql scp start
/usr/bin/expect <<-EOF
set timeout -1;
spawn scp -P ssh端口号 /mnt/data/mysql_backup/pm_shandong_$(date "+%Y-%m-%d").sql 另一台机器用户名@另一台机器IP:/mnt/data/mysql_backup/
expect {
    "*password:" {send "另一台机器密码\r";exp_continue;}
    "yes/no" {send "yes\r";}
}
EOF
#删除过期sql
echo remove file /mnt/data/mysql_backup/pm_shandong_$(date -d "7 day ago" +%Y-%m-%d).sql
rm -rf /mnt/data/mysql_backup/pm_shandong_$(date -d "7 day ago" +%Y-%m-%d).sql
echo finish! The file is pm_shandong_$(date "+%Y-%m-%d").sql
```

例子：简单更改密码脚本

```bash
#!/usr/bin/expect -d                  #"#!/usr/bin/expect"这一行告诉操作系统脚本里的代码使用那一个shell来执行。 -d 启用调试模式(可加可不加)。
set timeout 30  　　　　　　　　　　　　  #设置超时时间为30s
spawn passwd user5　　　　　　　　　　　 #spawn是进入expect环境后才可以执行的expect内部命令，如果没有装expect或者直接在默认的SHELL下执行是找不到spawn命令的。所以不要用 “which spawn“之类的命令去找spawn命令。好比windows里的dir就是一个内部命令，这个命令由shell自带，你无法找到一个dir.com 或 dir.exe 的可执行文件。它主要的功能是给ssh运行进程加个壳，用来传递交互指令。
expect "New password:" {send "123456\r" } #这个命令的意思是判断上次输出结果里是否包含“New password:”的字符串，如果有则立即返回"123456","\r"代表是返回字符，否则就等待一段时间后返回，这里等待时长就是前面设置的30秒 。
expect "new password:" {send "123456\r"}  #在平常我们设置密码的时候会让我输入一次后再输入一次进行确认，这个是匹配第二次输出，然后再次输入密码。
expect eof　　　　　　　　　　　　　　　　#表示读取到文件结束符
```

例子：登陆远程服务器并停留在远程服务器上

```bash
#!/usr/bin/expect
spawn ssh 192.168.123.218   #ssh 远程登陆
expect {
"*yes/no" {send "yes\r";exp_continue} #匹配输出内容，返回内容，exp_continue表示继续执行下一步
"*password" {send "123456\r"}
}
interact #执行完成后保持交互状态，把控制权交给控制台，这个时候就可以手工操作了。如果没有这一句登录完成后会退出，而不是留在远程终端上。如果你只是登录过去执行一段命令就退出，可改为［expect eof］
```

例子：传输参数执行登陆

```bash
#!/usr/bin/expect 
set ip [lindex $argv 0]  #这条命令是将变量ip的值设置为传入进来的第一个参数。[lindex $argv 0]表示的就是第一个参数的值
set port [lindex $argv 1] #这条命令是将变量port的值设置为传入进来的第二个参数。[lindex $argv 1]表示的就是第二个参数的值
set passwd "123456"
spawn ssh $ip -p$port  #使用变量，这里使用的方法跟shell脚本一样
expect {
    "yes/no" {send "yes\r";exp_continue}
    "password:" {send "$passwd\r"}
}
interact

[root@localhost shell]# ./login2.exp  192.168.123.218 22 #多个参数直接以空格间隔，第一个参数：192.168.123.218 第二个参数22
```

## Shell脚本退出

```shell
#!/bin/bash

### 脚本使用“-f”测试运算符检查一个名为“myfile.txt”的文件是否存在。如果文件存在，脚本会向控制台打印一条消息，并使用“exit”命令以成功代码0退出。如果文件不存在，脚本会打印不同的消息，并使用错误代码1退出

# 检查一个文件是否存在
if [ -f "myfile.txt" ]; then
  echo "The file exists"
  exit 0 # 成功的退出
else
  echo "The file does not exist"
  exit 1 # 异常的退出并附带说明
fi

### 脚本尝试使用“mysql”命令行客户端连接到MySQL数据库。如果连接失败，脚本会向控制台打印一个错误消息，并使用错误代码1退出。如果连接成功，脚本会对数据库执行一些操作，然后使用“QUIT”命令断开连接。

# 连接数据库
if ! mysql -h localhost -u root -psecret mydatabase -e "SELECT 1"; then
  echo "Error: Could not connect to database"
  exit 1
fi
# 断开连接
mysql -h localhost -u root -psecret mydatabase -e "QUIT"


### 在函数中使用return语句退出
# 定义一个函数并返回数字之和
function add_numbers {
  local num1=$1
  local num2=$2
  local sum=$((num1 + num2))
  return $sum
}

# 调用函数并打印结果
add_numbers 3 71
# 上一个执行命令的退出状态的“$?”变量将“add_numbers”函数的结果
result=$?
echo "3 + 71 = $result" 

### “return”命令也可以用于处理函数内部的错误或意外情况
### 脚本定义了一个名为“read_file”的函数，它以文件名为参数，并使用“cat”命令读取文件的内容。在函数内部，脚本使用“-f”测试运算符检查文件是否存在。如果文件不存在，函数会向控制台打印一个错误消息，并使用“return”命令以错误代码1退出。

# 定义一个函数读取文件
function read_file {
  local file=$1
  if [ ! -f "$file" ]; then
    echo "Error: File $file not found"
    return 1
  fi
  cat $file
}

# 调用函数并打印结果
read_file "myfile.txt"


### trap
### 脚本使用“trap”命令来捕获“EXIT”信号，该信号在脚本即将退出时发送。当信号被捕获时，脚本调用“cleanup”函数执行任何必要的清理操作，然后优雅地退出。
### “trap”命令还可以捕获其他信号，例如通过按Ctrl+C发送的“INT”信号，或者由想要终止脚本的进程发送的“TERM”信号。

# 定义一个函数执行清理动作
function cleanup {
  echo "Cleaning up..."
  # 删除临时文件，清理遗留服务等
}

# 捕获信号并执行清理动作（EXIT、INT、TERM）
trap cleanup EXIT

# 执行一些操作，但是可能会被中断
# ...

# 成功的退出
exit 0
```