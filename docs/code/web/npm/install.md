# web开发环境安装

* 如果是debian系列的系统，可以直接使用 `apt install nodejs npm -y` 安装

## 安装nvm

先到github查看最新的版本号：https://github.com/nvm-sh/nvm#installing-and-updating

使用如下命令安装
```bash
# 修改/etc/hosts
199.232.68.133 raw.githubusercontent.com
# 下载nvm，并加入到 .zshrc
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
# 国内下载安装nvm
curl -o- https://gitee.com/mirrors/nvm/raw/master/install.sh | bash
wget -qO- https://gitee.com/mirrors/nvm/raw/master/install.sh | bash

# 生效nvm
source ~/.zshrc

command -v nvm # 检查 nvm 是否可用
nvm --version  # 查看 nvm 的版本

# 列出已经安装的node版本
nvm ls

# 安装指定版本
nvm install xxx

# 使用指定版本
nvm use xxx

# 显示当前版本
nvm current
```

注意：在访问 `raw.githubusercontent.com` 的时候可能会出现无法访问的问题，可以使用 http://tool.chinaz.com/speedtest/ 测速工具测试之后，修改`hosts`的方式处理。

## 安装node

一般使用`nvm`安装管理node，安装node参考 https://github.com/nvm-sh/nvm#usage

```bash
# 如果是m1的mac需要运行如下命令,通过这个命令可以让 shell 运行在Rosetta2下
arch -x86_64 zsh

nvm install --lts
```

修改npm源

```bash
# 原地址：https://registry.npmjs.org/
npm config set registry https://registry.npmmirror.com

# 使用一下命令验证
npm config get registry

# yarn设置镜像源，官方：https://registry.yarnpkg.com
yarn config set registry https://registry.npmmirror.com
# 获取
yarn config get registry
```

安装yarn

```bash
npm install -g yarn
```

## 安装pnpm

todo

## 安装vue-cli

```bash
yarn add -g @vue/cli
```

如果运行vue命令时提示找不到vue命令

```bash
# 查看yarn的bin目录
yarn global bin

# 添加到环境变量
vim ~/.zshrc

PATH=$HOME/.yarn/bin:$PATH
```

## 升级node，npm

```bash
npm install -g n
# 安装最新稳定版
n stable
# 安装指定版本
n 0.10.26
# 升级到最新版本
n latest

# 升级npm
npm install npm -g
# 升级到指定版本
npm install npm@6.14.13 -g
```
