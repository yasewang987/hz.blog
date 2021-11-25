# VSCode

## Remote Development远程开发

1. vscode中安装`Remote Development`扩展（扩展中包含了多个插件),安装完成后,点击左下角出现远程图标.这表示扩展已经安装完成
1. Linux服务器上安装ssh远程连接服务
  ```bash
  # 检查ssh服务是否安装
  systemctl status sshd
  ```
1. 打开vscode设置或者`ctrl shift p`输入remote-ssh:settings打开远程设置，勾选`Remote.SSH:Show Login Terminal`
1. 点击左下角图标选择`Remote-SSH：Connect to Host`选择服务器链接即可（如果是新服务器选择`Configure SSH Hosts...`,选择`xxx\.ssh\config`）
1. 添加远程配置信息
  ![1](http://cdn.go99.top/docs/other/tools/vscode1.png)
1. 配置完之后会在vscode的左边工具栏远程服务器中出现对应的服务器
1. 点击服务器，输入密码即可登陆（要输入2次）
1. 每次都要输入密码很麻烦，可以通过 [【SSH免密登陆】](../linux/cmd.md) 解决

## 连接远程服务器Docker容器开发

1. 准备好远程容器: `docker run -it -p 50003:22 ubuntu:14.04`
    * 设置容器密码：`passwd`（密码自己设置）
    * 安装ssh服务：`apt-get update && apt-get install openssh-server`（`ps -e |grep ssh`检查是否启动）
    * 修改配置文件`/etc/ssh/sshd_config`,允许root用户远程登陆：将 `# PermitRootLogin without-password` 替换成 `PermitRootLogin yes`
    * 重启ssh：`service ssh start`
1. 远程连接容器：`ssh root@youhostip -p 50003`

* 注意，有可能ssh连接到容器中的时候`环境变量`与执行 `docker exec`的不一致，导致有些命令无法执行。这个时候需要将`docker exec`状态下的环境变量`$PATH`的值加到 ssh 下的 `.basrc` 最后面，例如：`export PATH=$PATH:/opt/conda/bin:/opt/cmake-3.14.6-Linux-x86_64/bin/`

## Windows设置gitbash为默认terminal
打开 `settings.json` ,添加如下内容

```json
{
  "terminal.integrated.profiles.windows": {
    "PowerShell": {
      ...
    },
    "GitBash": {
      "path": "D:\\Git\\bin\\bash.exe"
    }
  },
  "terminal.integrated.defaultProfile.windows": "GitBash",
  "terminal.integrated.automationShell.windows": "D:\\Git\\bin\\bash.exe",
  "terminal.external.windowsExec": "D:\\Git\\bin\\bash.exe"
}
```
## C# 开发
### C# Extensions
这个插件最有用的功能是可以右键新建C#类和C#接口，同时支持各种code snippets，例如 ctor 、prop等，具体功能特性，可以查看插件的说明
![2](http://cdn.go99.top/docs/other/tools/vscode2.png)

### Auto-Using for C#
这个插件自动添加using引用
![3](http://cdn.go99.top/docs/other/tools/vscode3.png)

### vscode-solution-explorer
这个插件给VS Code增加了解决方案tab, 支持新建解决方案、新建工程、添加引用、Nuget包，这个插件非常有用
![4](http://cdn.go99.top/docs/other/tools/vscode4.png)

## 其他
### Code Runner
即选中一段代码，直接run
![5](http://cdn.go99.top/docs/other/tools/vscode5.png)

### Visual Studio IntelliCode
VS代码智能提示，根据上下文语境，自动推荐你下一步用到的代码，后台基于AI的
![6](http://cdn.go99.top/docs/other/tools/vscode6.png)

## VSCode错误处理

### The SDK 'Microsoft.NET.Sdk.Web' specified could not be found

export MSBuildSDKsPath=$HOME/dotnet/sdk/$(dotnet --version)/Sdks

或者

setting "omnisharp.path": "latest" in VS Code's setting.json.

