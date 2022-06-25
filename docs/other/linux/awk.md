# awk指南

AWK 是一种处理文本文件的语言，是一个强大的文本分析工具。

## 语法

```bash
awk [选项参数] 'script' var=value file(s)
或
awk [选项参数] -f scriptfile var=value file(s)
```

选项参数说明：

* `-F`: 指定输入文件折分隔符，是一个字符串或者是一个正则表达式，如`-F ,`
* `-v var=value`: 赋值一个用户定义变量
* `-f scripfile`: 从脚本文件中读取awk命令


## 基本用法

log.txt文本内容如下：

```txt
2 this is a test
3 Are you like awk
This a test
10 There are orange,apple,mongo
```

用法一：

```bash
awk '{[pattern] action}' {filenames}   # 行匹配语句 awk '' 只能用单引号
```

实例：

```bash
# 每行按空格或TAB分割，输出文本中的1、4项
awk '{print $1,$4}' log.txt
---------------------------------------------
2 a
3 like
This
10 orange,apple,mongo

# 格式化输出
awk '{printf "%-8s %-10s\n",$1,$4}' log.txt
2        a
3        like
This
10       orange,apple,mongo
```

用法二：

```bash
awk -F  #-F相当于内置变量FS, 指定分割字符
```

实例：

```bash
# 使用","分割
$  awk -F ',' '{print $1,$2}'   log.txt
---------------------------------------------
2 this is a test
3 Are you like awk
This a test
10 There are orange apple

# 或者使用内建变量
awk 'BEGIN{FS=","} {print $1,$2}' log.txt
------------------------------
2 this is a test 
3 Are you like awk 
This a test 
10 There are orange apple

# 使用多个分隔符.先使用空格分割，然后对分割结果再使用","分割
awk -F '[ ,]'  '{print $1,$2,$5}'   log.txt
-------------------------------
2 this test
3 Are awk
This a 
10 There apple
```

用法三：

```bash
awk -v  # 设置变量
```

实例：

```bash
awk -v a=1 '{print $1,$1+a}' log.txt 
--------------------
2 3
3 4
This 1
10 11

awk -v a=1 -v b=s '{print $1,$1+a,$1b}' log.txt 
-----------------------
2 3 2s
3 4 3s
This 1 Thiss
10 11 10s
```

用法四：

```bash
awk -f {awk脚本} {文件名}
```

实例：

```bash
awk -f cal.awk log.txt
```

## 使用正则，字符串匹配

```bash
# 输出第二列包含 "th"，并打印第二列与第四列
awk '$2 ~ /th/ {print $2,$4}' log.txt
---------------------------------------------
this a
```
`~ `表示模式开始。`//` 中是模式。

```bash
# 输出包含 "re" 的行
awk '/re/ ' log.txt
---------------------------------------------
3 Are you like awk
10 There are orange,apple,mongo
```

## 忽略大小写

```bash
awk 'BEGIN{IGNORECASE=1} /this/' log.txt
---------------------------------------------
2 this is a test
This a test
```

## 模式取反

```bash
awk '$2 !~ /th/ {print $2,$4}' log.txt
---------------------------------------------
Are like
a
There orange,apple,mongo
awk '!/th/ {print $2,$4}' log.txt
---------------------------------------------
Are like
a
There orange,apple,mongo
```
## 运算符

|运算符|描述|
|---|---|
|`= += -= *= /= %= ^= **=`|赋值
|`?:`	|C条件表达式
|`\|\|` | 逻辑或
|`&&`|	逻辑与
|`~ 和 !~`|	匹配正则表达式和不匹配正则表达式
|`< <= > >= != ==`|	关系运算符
|空格|	连接
|`+ -`|	加，减
|`* / %`|	乘，除与求余
|`+ - !`|	一元加，减和逻辑非
|`^ ***`|	求幂
|`++ --`|	增加或减少，作为前缀或后缀
|`$`|	字段引用
|`in`|	数组成员

过滤第一列大于2的行

```bash
awk '$1>2' log.txt    #命令
#输出
3 Are you like awk
This's a test
10 There are orange,apple,mongo
```

过滤第一列大于2并且第二列等于'Are'的行:

```bash
awk '$1>2 && $2=="Are" {print $1,$2,$3}' log.txt    #命令
#输出
3 Are you
```

## 内建变量

变量|	描述|
---|---
$n|	当前记录的第n个字段，字段间由FS分隔
$0|	完整的输入记录
ARGC|	命令行参数的数目
ARGIND|	命令行中当前文件的位置(从0开始算)
ARGV|	包含命令行参数的数组
CONVFMT|	数字转换格式(默认值为%.6g)ENVIRON环境变量关联数组
ERRNO|	最后一个系统错误的描述
FIELDWIDTHS|	字段宽度列表(用空格键分隔)
FILENAME|	当前文件名
FNR|	各文件分别计数的行号
FS|	字段分隔符(默认是任何空格)
IGNORECASE|	如果为真，则进行忽略大小写的匹配
NF|	一条记录的字段的数目
NR|	已经读出的记录数，就是行号，从1开始
OFMT|	数字的输出格式(默认值是%.6g)
OFS|	输出字段分隔符，默认值与输入字段分隔符一致。
ORS|	输出记录分隔符(默认值是一个换行符)
RLENGTH|	由match函数所匹配的字符串的长度
RS|	记录分隔符(默认是一个换行符)
RSTART|	由match函数所匹配的字符串的第一个位置
SUBSEP|	数组下标分隔符(默认值是/034)


```bash
awk 'BEGIN{printf "%4s %4s %4s %4s %4s %4s %4s %4s %4s\n","FILENAME","ARGC","FNR","FS","NF","NR","OFS","ORS","RS";printf "---------------------------------------------\n"} {printf "%4s %4s %4s %4s %4s %4s %4s %4s %4s\n",FILENAME,ARGC,FNR,FS,NF,NR,OFS,ORS,RS}'  log.txt
FILENAME ARGC  FNR   FS   NF   NR  OFS  ORS   RS
---------------------------------------------
log.txt    2    1         5    1
log.txt    2    2         5    2
log.txt    2    3         3    3
log.txt    2    4         4    4

awk -F\' 'BEGIN{printf "%4s %4s %4s %4s %4s %4s %4s %4s %4s\n","FILENAME","ARGC","FNR","FS","NF","NR","OFS","ORS","RS";printf "---------------------------------------------\n"} {printf "%4s %4s %4s %4s %4s %4s %4s %4s %4s\n",FILENAME,ARGC,FNR,FS,NF,NR,OFS,ORS,RS}'  log.txt
FILENAME ARGC  FNR   FS   NF   NR  OFS  ORS   RS
---------------------------------------------
log.txt    2    1    '    1    1
log.txt    2    2    '    1    2
log.txt    2    3    '    2    3
log.txt    2    4    '    1    4

# 输出顺序号 NR, 匹配文本行号
awk '{print NR,FNR,$1,$2,$3}' log.txt
---------------------------------------------
1 1 2 this is
2 2 3 Are you
3 3 This a test
4 4 10 There are
# 指定输出分割符
$  awk '{print $1,$2,$5}' OFS=" $ "  log.txt
---------------------------------------------
2 $ this $ test
3 $ Are $ awk
This $ a $
10 $ There $
```

## awk脚本

关于 awk 脚本，我们需要注意两个关键词 BEGIN 和 END。

* BEGIN{ 这里面放的是执行前的语句 }
* END {这里面放的是处理完所有的行后要执行的语句 }
* {这里面放的是处理每一行时要执行的语句}

假设有这么一个文件（学生成绩表）：

```bash
cat score.txt

Marry   2143 78 84 77
Jack    2321 66 78 45
Tom     2122 48 77 71
Mike    2537 87 97 95
Bob     2415 40 57 62
```

我们的 awk 脚本如下：

```bash
cat cal.awk
#!/bin/awk -f
#运行前
BEGIN {
    math = 0
    english = 0
    computer = 0
 
    printf "NAME    NO.   MATH  ENGLISH  COMPUTER   TOTAL\n"
    printf "---------------------------------------------\n"
}
#运行中
{
    math+=$3
    english+=$4
    computer+=$5
    printf "%-6s %-6s %4d %8d %8d %8d\n", $1, $2, $3,$4,$5, $3+$4+$5
}
#运行后
END {
    printf "---------------------------------------------\n"
    printf "  TOTAL:%10d %8d %8d \n", math, english, computer
    printf "AVERAGE:%10.2f %8.2f %8.2f\n", math/NR, english/NR, computer/NR
}
```
执行结果：

```bash
awk -f cal.awk score.txt

NAME    NO.   MATH  ENGLISH  COMPUTER   TOTAL
---------------------------------------------
Marry  2143     78       84       77      239
Jack   2321     66       78       45      189
Tom    2122     48       77       71      196
Mike   2537     87       97       95      279
Bob    2415     40       57       62      159
---------------------------------------------
  TOTAL:       319      393      350
AVERAGE:     63.80    78.60    70.00
```

## 另外一些实例

```bash
BEGIN { print "Hello, world!" }

#计算文件大小
ls -l *.txt | awk '{sum+=$5} END {print sum}'
--------------------------------------------------
666581

#从文件中找出长度大于 80 的行：
awk 'length>80' log.txt

# 打印九九乘法表
seq 9 | sed 'H;g' | awk -v RS='' '{for(i=1;i<=NF;i++)printf("%dx%d=%d%s", i, NR, i*NR, i==NR?"\n":"\t")}'

# 导出02:14到02:16分的日志
awk '/2022-06-24T02:14/,/2022-06-24T02:1[6-9]/' app.log > app0215.log
```