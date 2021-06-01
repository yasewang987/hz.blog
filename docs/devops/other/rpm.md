# rpm包制作

rpm 的版本 `<=4.4.x`，`rpmbuid` 工具其默认的工作路径是 `/usr/src/redhat`。因为权限的问题，普通用户不能制作 rpm 包，制作 rpm 软件包时必须切换到 `root` 身份才可以。

rpm 从 `4.5.x` 版本开始，将 `rpmbuid` 的默认工作路径移动到用户家目录下的 `rpmbuild` 目录里，即 `$HOME/rpmbuild` ，并且推荐用户在制作 rpm 软件包时尽量不要以 root 身份进行操作。

如果想发布 `rpm` 格式的源码包或者是二进制包，就要使用 `rpmbuild` 工具（ rpm 最新打包工具）。如果我们已经根据本地源码包的成功编译安装而写了 `spec` 文件（该文件要以 `.spec` 结束），那我们就可以建立一个打包环境，也就是目录树的建立，一般是在 `~/rpmbuild` 目录下建立 5 个目录。它门分别是：

`BUILD`：源码包被解压至此，并在该目录的子目录完成编译
`SOURCES` ：保存源码包（如 .tar 包）和所有 patch 补丁
`SPECS`：保存 RPM 包配置（.spec）文件
`SRPMS`：生成/保存源码 RPM 包(SRPM)
`RPMS`：生成/保存二进制 RPM 包
`BUILDROOT`：保存 `%install` 阶段安装的文件


## rpmbuild 命令选项

```bash
# 构建命令
rpmbuild -ba 软件名-版本.spec 

-bp 只解压源码及应用补丁
-bc 只进行编译
-bi 只进行安装到%{buildroot}
-bb 只生成二进制 rpm 包
-bs 只生成源码 rpm 包
-ba 生成二进制 rpm 包和源码 rpm 包
--target 指定生成 rpm 包的平台，默认会生成 i686 和 x86_64 的 rpm 包，但一般我只需要 x86_64 的 rpm 包
```

## 安装rpm包

```bash
sudo rpm -ivh xxxx.rpm
```