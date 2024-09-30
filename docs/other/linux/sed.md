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
* `-i`：操作文件

**动作说明：**

* `a` ：新增， a 的后面可以接字串，而这些字串会在新的一行出现(目前的下一行)～
* `c` ：取代， c 的后面可以接字串，这些字串可以取代 n1,n2 之间的行！
* `d` ：删除，因为是删除啊，所以 d 后面通常不接任何字符；
* `i` ：插入， i 的后面可以接字串，而这些字串会在新的一行出现(目前的上一行)；
* `p` ：打印，亦即将某个选择的数据印出。通常 p 会与参数 sed -n 一起运行～
* `s` ：替换，可以直接进行替换的工作,通常这个 s 的动作可以搭配正规表示法！例如 `1,20s/old/new/g` 就是啦！

## 实例【显示操作效果，不更新文件本身】

* 下面显示操作效果，不更新文件本身，要更新文件需要通过 `-i` 参数修改

**新增行**

```bash
# 在log.txt文件的第四行后添加一行
sed -e '4a newLine' log.txt

# 在第二行后，加 drink tea
nl /etc/passwd | sed '2a drink tea'

# 在第二行前
nl /etc/passwd | sed '2i drink tea' 

# 增加两行以上，在第二行后面加入两行字
nl /etc/passwd | sed '2a Drink tea or\ndrink beer' 

# 可以添加一个完全为空的空行
sed '4a \\'

# 可以添加两个完全为空的空行
sed '4a \\n'

# 最后一行新增
sed '$a xxxxx'

# 新增多行
sed '2a Hello \
World' 1.txt

# 新增特殊字符（空白、单引号等）- 在匹配到http_referer的下面新增一行
sed -i "/http_referer/a \                      \' cookie:\$http_cookie \'" /etc/nginx/nginx.conf
```

**以行为单位的删除**
```bash
# 将 /etc/passwd 的内容列出并且列印行号，同时，请将第 2~5 行删除！
nl /etc/passwd | sed '2,5d'

# 删除第二行
nl /etc/passwd | sed '2d'

# 删除3到最后一行
nl /etc/passwd | sed '3,$d' 

# 删除/etc/passwd所有包含root的行，其他行输出
nl /etc/passwd | sed  '/root/d'

# 删除当前文件夹下所有.log文件匹配到user_defined的行
sed -i '/user_defined/d' *.log
```

**以行为单位的替换**

```bash
# 将第2-5行的内容取代成为 No 2-5 number
nl /etc/passwd | sed '2,5c No 2-5 number'
```

**数据的显示**

```bash
# 仅列出 /etc/passwd 文件内的第 5-7 行
nl /etc/passwd | sed -n '5,7p'

# 搜索 /etc/passwd有root关键字的行，除了输出所有行，还会输出匹配行
nl /etc/passwd | sed '/root/p'

# 使用-n的时候将只打印包含模板的行
nl /etc/passwd | sed -n '/root/p'

# 导出02:14到02:16分的日志
sed -n '/2022-06-24T02:14/,/2022-06-24T02:1[6-9]/p' app.log > app0215.log
```

**数据的搜寻并执行命令**

```bash
# 搜索/etc/passwd,找到root对应的行，执行后面花括号中的一组命令，每个命令之间用分号分隔，这里把bash替换为blueshell，再输出这行：
# 最后的q是退出
nl /etc/passwd | sed -n '/root/{s/bash/blueshell/;p;q}' 

# 查找文档中的aa并在下一行插入222
sed '/aa/a 222' 1.txt

# 替换
sed 's/要被取代的字串/新的字串/g'

# 使用变量替换
teststr="IBM"
sed -n '/' "$teststr" '/=' testfile.txt

# 如果需要替换的字符中有 / 则可以用 # 替换分隔符
sed -i "s#abc#cde#g" file.txt

# 利用 sed 将 regular_express.txt 内每一行结尾若为 . 则换成!
sed -i 's/\.$/\!/g' regular_express.txt
```

```bash
# 先观察原始信息 IP
sbin/ifconfig eth0
---------------------
eth0 Link encap:Ethernet HWaddr 00:90:CC:A6:34:84
inet addr:192.168.1.100 Bcast:192.168.1.255 Mask:255.255.255.0
inet6 addr: fe80::290:ccff:fea6:3484/64 Scope:Link
UP BROADCAST RUNNING MULTICAST MTU:1500 Metric:1

# 将 IP 前面的部分予以删除
/sbin/ifconfig eth0 | grep 'inet addr' | sed 's/^.*addr://g'
192.168.1.100 Bcast:192.168.1.255 Mask:255.255.255.0

# 将 IP 后面的部分予以删除
/sbin/ifconfig eth0 | grep 'inet addr' | sed 's/^.*addr://g' | sed 's/Bcast.*$//g'
192.168.1.100
```

