# Linux 常用软件安装及问题处理

---

## zsh安装

##### zsh
1. 查看当前环境shell
   > echo $SHELL
1. 查看系统自带哪些shell
   > cat /etc/shells
1. 安装zsh
   > yum install zsh
1. 将zsh设置为默认shell
   > chsh -s /bin/zsh
1. 生效
   > source .zshrc
* 可以通过echo $SHELL查看当前默认的shell，如果没有改为/bin/zsh，那么需要重启shell。

---

##### oh-my-zsh

1. 查看github中的最新教程安装
   ```bash
   https://github.com/robbyrussell/oh-my-zsh
   ```
1. 安装完成之后使用的是默认主题，如果需要其他主题参考官网切换主题即可

---

---
## Linux忘记root账号密码处理

##### 不用重启直接修改（非grub方法）

1. 进入/etc文件夹
   > cd /etc

1. 编辑`passwd`这个文件
   > sudo vim passwd

1. 第一行就是`root`的，后面的`:x:`中的`x`就是密码的占位符，我们只把`x`删掉，别删冒号，然后保存。
1. 切换用户(输入su，不需要密码，看到命令行的`$`变成`#`说明成功)
   > su
1. 命令行保持在窗口不要动，重新编辑`passwd`文件,将之前删除的`x`添加到原来位置，保存退出。
   > vim passwd
1. 修改密码，还是用passwd命令。
   > passwd
1. 这时候应该就提示输入root的新密码了，根据提示输入之后修改`root`密码成功。


## Failed to connect to raw.githubusercontent.com port 443 解决方案

查询真实IP

在https://www.ipaddress.com/查询raw.githubusercontent.com的真实IP。

通过修改hosts解决此问题

```bash
199.232.68.133 raw.githubusercontent.com
```

