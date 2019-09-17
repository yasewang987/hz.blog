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
  ![1](./img/vscode/1.png)
1. 配置完之后会在vscode的左边工具栏远程服务器中出现对应的服务器
1. 点击服务器，输入密码即可登陆（要输入2次）
1. 每次都要输入密码很麻烦，可以通过 [【SSH免密登陆】](../linux/cmd.md) 解决