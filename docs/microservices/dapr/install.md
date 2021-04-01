# Dapr安装

官方github仓库的Release页面下载对应系统的压缩包

https://github.com/dapr/cli/releases

解压之后将dapr文件转移到对应目录

Linux,Mac用户：

```bash
mv ./dapr /usr/local/bin

# 如果是Mac M1的用户如果不能执行需要执行如下命令
softwareupdate --install-rosetta
```

Windows用户：创建一个目录并将其添加到系统PATH。 例如，通过编辑系统环境变量，创建一个名为 `C:\dapr` 的目录，并将此目录添加到您的用户PATH

验证只需要直接执行 `dapr` 命令出现正常提示即可。