# Go开发环境安装

[中文部署参考网站](http://docscn.studygolang.com/doc/install#%E5%AE%89%E8%A3%85%E5%8C%85)

* `GOROOT`: 中包含go语言的基础执行程序 `$GOROOT/bin`,以及go的基础库 `$GOROOT/src/mod`
* `GOPATH`: 中包含除了基础库之外的其他项目依赖包执行程序 `$GOPATH/bin`,以及go基础库之外的依赖包源码 `$GOPATH/src/mod`

1. 下载Go发行版 [官方二进制发行版](https://golang.org/dl/),选择对应版本（我这里使用centos系统所以选择linux）
1. 下载`go1.13.linux-amd64`版本，版本可以自行选择：
    ```bash
    wget https://dl.google.com/go/go1.13.linux-amd64.tar.gz
    
    # mac版本的最好到这边下载对应的版本安装会快很多
    # 由于某些原因无法下载使用下面地址
    wget https://studygolang.com/dl/golang/go1.15.6.linux-amd64.tar.gz
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
    export GOPATH=/var/gopath  #自己定义的gopath
    export PATH=$PATH:$GOROOT/bin:$GOPATH/bin

    # 生效全局配置
    source /etc/profile
    # 生效用户环境变量
    source $HOME/.profile
    ```
1. 输入`go version`检查是否安装成功(如果是m1芯片的mac必须确认安装的go是`arm64`版本的)

1. 修改go源

```bash
go env -w GO111MODULE=on

# 七牛(优先推荐)
go env -w GOPROXY=https://goproxy.cn,direct

# 阿里
go env -w GOPROXY=https://mirrors.aliyun.com/goproxy/,direct
```

## Go Debug

如果是用的是 vscode 安装go插件之后，随便创建一个 `main.go` 文件会提示安装调试需要的依赖项，直接全部确认安装即可。

需要安装 `go-delve`,github地址： https://github.com/go-delve/delve

Mac安装`go-delve`: https://github.com/go-delve/delve/blob/master/Documentation/installation/README.md

```bash
xcode-select --install

go install github.com/go-delve/delve/cmd/dlv@latest

sudo /usr/sbin/DevToolsSecurity -enable
sudo dscl . append /Groups/_developer GroupMembership $(whoami)
```

(最新版本可以不用加)VSCode调试需要添加文件 `launch.json`, 内容如下：

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Part1",
            "type": "go",
            "request": "launch",
            "mode": "debug",
            "port": 12345,
            "host": "127.0.0.1",
            "program": "${workspaceFolder}/part1/main.go",
            "showLog": true
        }
    ]
}
```

如果调试中出现 `could not launch process: stub exited while waiting for connection: exit status 0` 错误，可以通过如下命令确认是否是 arm64 的 mac 使用了 `x86_64` 的 `debugserver`:

```bash
# 在go项目的主目录执行如下命令
CGO_ENABLED=0 dlv debug --log --headless .

# 出现如下提示
debugserver-@ PROGRAM:LLDB  PROJECT:lldb-1200.0.44 for x86_64.
```