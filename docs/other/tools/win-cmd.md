# Windows常用操作记录


## Windows服务

服务注册(等号后面的空格必须)：  
```bash
sc create ServiceName binPath= 路径 start= auto

# consul服务注册的例子
sc create Consul-Server binPath="E:\TCSOFT\consul_1.4.4_windows_amd64\consul.exe agent -config-file E:\TCSOFT\consul_1.4.4_windows_amd64\Server\config.json start= auto"
```

删除服务：
```bash
sc delete ServiceName
```

其他服务不是很常用，如果需要可以通过:`sc -h`查看

---

## Windows-IIS操作命令

```bash
# 停止IIS站点
C:\Windows\System32\inetsrv\appcmd.exe stop site XXXX
# 开始IIS站点
C:\Windows\System32\inetsrv\appcmd.exe start site XXXX

# 停止IIS应用程序池
C:\Windows\System32\inetsrv\appcmd.exe stop apppool /apppool.name:xxxx
# 启动IIS应用程序池
C:\Windows\System32\inetsrv\appcmd.exe start apppool /apppool.name:xxxx
```

---

## Windows-文件操作

```bash
call xcopy ./out E:\test /e /y
```

## Windows-添加gitbash到terminal

```json
{
    "acrylicOpacity": 0, // 透明度
    "closeOnExit": true, // 关闭的时候退出命令终端
    "colorScheme": "Campbell", // 样式配置
    "commandline": "C:\\Program Files\\Git\\bin\\bash.exe", // git-bash的命令行所在位置
    "cursorColor": "#FFFFFF", // 光标颜色
    "cursorShape": "bar", // 光标形状
    "fontSize": 14, // 终端字体大小
    "guid": "{1c4de342-38b7-51cf-b940-2309a097f589}", // 唯一的标识，改成和其他的已有终端不一样
    "historySize": 9001, // 终端窗口记忆大小
    "icon": "C:\\Program Files\\Git\\mingw64\\share\\git\\git-for-windows.ico", // git的图标
    "name": "git-bash", // 标签栏的标题显示
    "padding": "0, 0, 0, 0", // 边距
    "snapOnInput": true,
    "startingDirectory": "%USERPROFILE%", // gitbash 启动的位置（默认在C盘的用户里面的就是 ~ ）
    "useAcrylic": false // 是否开启透明度
}
```

## Windows - 设置terminal中wsl默认目录

```json
{
    // Ubuntu 这个可以修改看你用的是哪个版本 wsl -l
    "startingDirectory": "//wsl$/Ubuntu-20.04/home/hz"
}
```

## WSL2 默认启动Docker

1. 修改 `/etc/sudoers` 配置，允许用户执行`sudo`不需要输入密码就可以启动`dockerd `

    ```
    yourusername ALL=(ALL) NOPASSWD: /usr/bin/dockerd
    ```
1. 修改 `zshrc`

    ```bash
    echo '# Start Docker daemon automatically when logging in if not running.' >> ~/.zshrc
    echo 'RUNNING=`ps aux | grep dockerd | grep -v grep`' >> ~/.zshrc
    echo 'if [ -z "$RUNNING" ]; then' >> ~/.zshrc
    echo '    sudo dockerd > /dev/null 2>&1 &' >> ~/.zshrc
    echo '    disown' >> ~/.zshrc
    echo 'fi' >> ~/.zshrc
    ```

1. 将用户加入docker组织

    ```bash
    sudo usermod -a -G docker $USER
    ```

## Windows打开关闭虚拟机

```bash
# 关闭
bcdedit /set hypervisorlaunchtype off
# 打开
bcdedit /set hypervisorlaunchtype auto
```

## Windows安装gcc

官网：https://www.mingw-w64.org/ ，这里可以下载到最新的版本

参考文档：

https://www.cnblogs.com/feipeng8848/p/15227688.html

https://cloud.tencent.com/developer/article/1627901

下载地址【直接选择x86_64-posix-seh下载】：https://sourceforge.net/projects/mingw-w64/files/mingw-w64/mingw-w64-release/

mingw的工作是集成gcc源码与Windows API，用于把gcc移植到Windows上用原生的方式编译程序。用得到的gcc.exe编译的程序可以在Windows上原生运行。

安装完mingw之后，系统变量中找到 Path 变量，在后面加入 min-gw 的安装目录如：`D:\MinGw\bin`

## Windows字体增加

下载字体ttf文件（阿里云盘）之后放到 `C:\Windows\Fonts` 文件夹，wps等软件能自动识别到