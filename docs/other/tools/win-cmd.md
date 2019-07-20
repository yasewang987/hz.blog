# Windows服务器常用操作记录

* [Windows-服务](#windowsserver)
* [Windows-IIS操作命令](#iis)
* [Windows-文件操作](#file)

---

<h2 id="windowsserver">Windows服务</h2>

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

<h2 id="iis">Windows-IIS操作命令</h2>

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

<h2 id="file">Windows-文件操作</h2>

```bash
call xcopy ./out E:\test /e /y
```