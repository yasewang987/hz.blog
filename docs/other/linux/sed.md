# sed指南

Sed 主要用来自动编辑一个或多个文件、简化对文件的反复操作、编写转换程序等。

## 语法

```bash
sed [-hnV][-e<script>][-f<script文件>][文本文件]
```

**参数说明：**

* `-e<script>`或`--expression=<script>` 以选项中指定的script来处理输入的文本文件。
* `-f<script文件>`或`--file=<script文件>` 以选项中指定的script文件来处理输入的文本文件。
* `-h`或`--help` 显示帮助。
* `-n`或`--quiet`或`--silent` 仅显示script处理后的结果。
* `-V`或`--version` 显示版本信息。

**动作说明：**

* `a` ：新增， a 的后面可以接字串，而这些字串会在新的一行出现(目前的下一行)～
* `c` ：取代， c 的后面可以接字串，这些字串可以取代 n1,n2 之间的行！
* `d` ：删除，因为是删除啊，所以 d 后面通常不接任何字符；
* `i` ：插入， i 的后面可以接字串，而这些字串会在新的一行出现(目前的上一行)；
* `p` ：打印，亦即将某个选择的数据印出。通常 p 会与参数 sed -n 一起运行～
* `s` ：替换，可以直接进行替换的工作,通常这个 s 的动作可以搭配正规表示法！例如 `1,20s/old/new/g` 就是啦！

## 实例

**新增行**

```bash
# 在log.txt文件的第四行后添加一行
sed -e '4 a newLine' log.txt

# 在第二行后，加 drink tea
nl /etc/passwd | sed '2 a drink tea'

# 在第二行前
nl /etc/passwd | sed '2 i drink tea' 

# 增加两行以上，在第二行后面加入两行字
nl /etc/passwd | sed '2 a Drink tea or\ndrink beer' 

# 可以添加一个完全为空的空行
sed '4 a \\'

# 可以添加两个完全为空的空行
sed '4 a \\n'
```

**以行为单位的删除**
```bash
# 将 /etc/passwd 的内容列出并且列印行号，同时，请将第 2~5 行删除！
nl /etc/passwd | sed '2,5 d'

# 删除第二行
nl /etc/passwd | sed '2 d'

# 删除3到最后一行
nl /etc/passwd | sed '3,$ d' 

# 删除/etc/passwd所有包含root的行，其他行输出
nl /etc/passwd | sed  '/root/d'
```

**以行为单位的替换与显示**

```bash
# 将第2-5行的内容取代成为 No 2-5 number
nl /etc/passwd | sed '2,5 c No 2-5 number'

# 仅列出 /etc/passwd 文件内的第 5-7 行
nl /etc/passwd | sed -n '5,7p'
```

**数据的搜寻并显示**

```bash
# 搜索 /etc/passwd有root关键字的行，除了输出所有行，还会输出匹配行
nl /etc/passwd | sed '/root/p'

# 使用-n的时候将只打印包含模板的行
nl /etc/passwd | sed -n '/root/p'
```

**数据的搜寻并执行命令**

```bash
# 搜索/etc/passwd,找到root对应的行，执行后面花括号中的一组命令，每个命令之间用分号分隔，这里把bash替换为blueshell，再输出这行：
# 最后的q是退出
nl /etc/passwd | sed -n '/root/{s/bash/blueshell/;p;q}' 
```

**数据的搜寻并替换**

```bash
sed 's/要被取代的字串/新的字串/g'
```

先观察原始信息，利用 `/sbin/ifconfig` 查询 IP

```bash
sbin/ifconfig eth0
---------------------
eth0 Link encap:Ethernet HWaddr 00:90:CC:A6:34:84
inet addr:192.168.1.100 Bcast:192.168.1.255 Mask:255.255.255.0
inet6 addr: fe80::290:ccff:fea6:3484/64 Scope:Link
UP BROADCAST RUNNING MULTICAST MTU:1500 Metric:1
```

将 IP 前面的部分予以删除

```bash
/sbin/ifconfig eth0 | grep 'inet addr' | sed 's/^.*addr://g'
192.168.1.100 Bcast:192.168.1.255 Mask:255.255.255.0
```

将 IP 后面的部分予以删除

```bash
/sbin/ifconfig eth0 | grep 'inet addr' | sed 's/^.*addr://g' | sed 's/Bcast.*$//g'
192.168.1.100
```

**多点编辑**

```bash
# 一条sed命令，删除/etc/passwd第三行到末尾的数据，并把bash替换为blueshell
nl /etc/passwd | sed -e '3,$d' -e 's/bash/blueshell/'
```

## 直接修改文件内容

sed 可以直接修改文件的内容，不必使用管道命令或数据流重导向

regular_express.txt 文件内容如下：

```txt
google.
taobao.
facebook.
zhihu-
weibo-
```

```bash
# 利用 sed 将 regular_express.txt 内每一行结尾若为 . 则换成!
sed -i 's/\.$/\!/g' regular_express.txt

# 直接在 regular_express.txt 最后一行加入 # This is a test:
sed -i '$a # This is a test' regular_express.txt
```

