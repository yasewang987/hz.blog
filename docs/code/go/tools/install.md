# GO开发环境安装

[中文部署参考网站](http://docscn.studygolang.com/doc/install#%E5%AE%89%E8%A3%85%E5%8C%85)

1. 下载Go发行版 [官方二进制发行版](https://golang.org/dl/),选择对应版本（我这里使用centos系统所以选择linux）
1. 下载`go1.13.linux-amd64`版本，版本可以自行选择：

  ```bash
  wget https://dl.google.com/go/go1.13.linux-amd64.tar.gz
  ```
1. 解压压缩包：

  ```bash
  tar -C /usr/local -zxvf go1.13.linux-amd64.tar.gz
  ```
1. 添加环境变量（选择一种即可）

  ```bash
  # 全局
  vim /etc/profile

  # 用户
  vim $HOME/.profile

  # 添加一下内容
  export GOROOT=/usr/local/go
  export PATH=$PATH:$GOROOT/bin

  # 生效全局配置
  source /etc/profile
  # 生效用户环境变量
  source $HOME/.profile
  ```
1. 输入`go version`检查是否安装成功