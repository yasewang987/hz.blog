# Node安装

一般使用`nvm`安装管理node

```bash
# 如果是m1的mac需要运行如下命令,通过这个命令可以让 shell 运行在Rosetta2下
arch -x86_64 zsh

nvm install --lts
```

修改npm源

```bash
npm config set registry https://registry.npm.taobao.org

# 使用一下命令验证
npm config get registry
```
