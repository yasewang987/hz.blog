# Linux问题处理汇总

## 内存溢出自动kill进程

`Linux`内核有个机制叫`OOM killer(Out Of Memory killer)`，该机制会监控那些占用内存过大，尤其是瞬间占用内存很快的进程，然后防止内存耗尽而自动把该进程杀掉。内核检测到系统内存不足、挑选并杀掉某个进程的过程可以参考内核源代码`linux/mm/oom_kill.c`，当系统内存不足的时候，`out_of_memory()`被触发，然后调用`select_bad_process()`选择一个`bad`进程杀掉。如何判断和选择一个`bad`进程呢？linux选择`bad`进程是通过调用`oom_badness()`，挑选的算法和想法都很简单很朴实：最bad的那个进程就是那个最占用内存的进程。

查看系统日志方法：

```bash
grep -i -r 'killed process' /var/log
```

## 服务器重启(宕机)问题定位

查看 `/var/log/message` 里面记录了系统启动后的信息和错误日志

```bash
# 安全相关日志
/var/log/secure
# 定时任务日志
/var/log/cron
# 守护进程相关日志
/var/log/boot.log
# 永久记录每个用户登录、注销和系统启动、停机事件
/var/log/wtmp
# 记录当前正在登录系统的用户
/var/log/utmp
# 记录登录失败的信息
/var/log/btmp
```

## 安装桌面包之后自动关机（休眠）

```bash
# 查看是否休眠
systemctl status sleep.target
# 如果显示状态是下面状态，则需要关闭
Loaded: loaded

# 关闭自动休眠
systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target
# 查看自动休眠是否关闭
systemctl status sleep.target
# 关闭之后的状态是
Loaded: masked

# 重新启动休眠
systemctl unmask sleep.target suspend.target hibernate.target hybrid-sleep.target
```