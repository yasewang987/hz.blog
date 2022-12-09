# Linux Crontab使用

Linux crontab是用来定期执行程序的命令。

## Crontab表达式

```bash
*    *    *    *    *
-    -    -    -    -
|    |    |    |    |
|    |    |    |    +----- 星期中星期几 (0 - 6) (星期天 为0)
|    |    |    +---------- 月份 (1 - 12) 
|    |    +--------------- 一个月中的第几天 (1 - 31)
|    +-------------------- 小时 (0 - 23)
+------------------------- 分钟 (0 - 59)

# 每分钟执行一次
* * * * * /bin/ls

# 每天23.30执行一次
30 23 * * * ls

# 在 12 月内, 每天的早上 6 点到 12 点，每隔 3 个小时 0 分钟执行一次 /usr/bin/backup
0 6-12/3 * 12 * /usr/bin/backup

# 周一到周五每天下午 5:00 寄一封信给 alex@domain.name
0 17 * * 1-5 mail -s "hi" alex@domain.name < /tmp/maildata

# 每月1号和15号检查/home 磁盘 
0 0 1,15 * * fsck /home

# 意思是每两个小时重启一次apache 
0 */2 * * * /sbin/service httpd restart

# 每小时的第一分执行 /home/bruce/backup这个文件
1 * * * * /home/bruce/backup

# 每月的1、11、21、31日是的6：30执行一次ls命令
30 6 */10 * * ls

# 开机之后执行命令
@reboot echo "hello"
```

## Crontab常用命令

```bash
# 新增任务
crontab -e
#进入 crontab 编辑界面。会打开Vim编辑你的任务
* * * * * 执行的任务

# 列出所有定时任务
crontab -l
# 查看某个用户定时任务
crontab -l -u username
# 查看所有用户定时任务
cat /etc/passwd | cut -f 1 -d : |xargs -I {} crontab -l -u {}

# 编辑/删除指定任务
crontab -e
# 进入编辑界面之后删除对应任务所在行内容即可

# 删除当前用户所有定时任务
crontab -r 
# 删除指定用户的定时任务
crontab -u xxx -r
```

* 注意：当程序在你所指定的时间执行后，系统会发一封邮件给当前的用户，显示该程序执行的内容，若是你不希望收到这样的邮件，请在每一行空一格之后加上 `> /dev/null 2>&1` 即可，如：

## Crontab查看日志

默认日志文件位置：`/var/log/cron`

```bash
# 指定日志文件保存位置
27 10 * * * /usr/bin/sh /opt/lyy/checkES.sh >>/opt/lyy/checkES.log 2>&1
```

## shell脚本中添加crontab

在shell脚本中添加如下内容：

```shell
#!/bin/bash
crontab -l > crontab_tmp
echo "* * * * * echo hello" > crontab_tmp
crontab crontab_tmp
```

## 问题处理

* 服务器时间没问题，`crontab`执行时间晚8小时

```bash
# 修改 /etc/crontab
vim /etc/crontab

# 增加如下内容
CRON_TZ=Asia/Shanghai
```