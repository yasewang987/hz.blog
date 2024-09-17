# Go开发环境安装

## go官方安装【推荐】

* `GOROOT`: 中包含go语言的基础执行程序 `$GOROOT/bin`,以及go的基础库 `$GOROOT/src/mod`，存放一些内置的开发包和工具。
* `GOPATH`: 中包含除了基础库之外的其他项目依赖包执行程序 `$GOPATH/bin`,以及go基础库之外的依赖包源码 `$GOPATH/pkg/mod`，用于保存go项目的代码和第三方依赖包。

1. 下载Go发行版 [官方二进制发行版](https://golang.google.cn/dl/),选择对应版本（我这里使用centos系统所以选择linux）
1. 下载`go1.13.linux-amd64`版本，版本可以自行选择：
    ```bash
    wget https://golang.google.cn/dl/go1.18.1.linux-arm64.tar.gz
    
    # mac版本的最好到这边下载对应的版本安装会快很多
    # 由于某些原因无法下载使用下面地址
    wget https://studygolang.com/dl/golang/go1.18.10.linux-amd64.tar.gz
    ```
1. 解压压缩包：
    ```bash
    tar -C /usr/local -zxvf go1.18.10.linux-amd64.tar.gz
    ```
1. 添加环境变量（选择一种即可）
    ```bash
    # 全局
    vim /etc/profile

    # 用户
    vim $HOME/.profile

    # 添加一下内容
    export GOSTART=/usr/local/go/bin
    export PATH=$PATH:$GOSTART
    export GOROOT=$(go env GOROOT)
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

## gvm

```bash
apt-get install bsdmainutils
# 安装gvm
curl -o gvm-installer https://raw.githubusercontent.com/moovweb/gvm/master/binscripts/gvm-installer 
chmod +x gvm-installer
./gvm-installer

# 安装Go1.16.5版本
gvm install go1.16.5
# 使用Go1.16.5版本
gvm use go1.16.5
# 将Go1.16.5设置为默认版本
gvm use go1.16.5 --default
# 卸载Go1.16.5版本
gvm uninstall go1.16.5

# 完全卸载 GVM
gvm implode
# 手动删除
rm -rf $GVM_ROOT
```

## Go 工作区

在上层目录放置`go.work`，也可以将多个目录组织成一个`workspace`，并且由于上层目录本身不受`git`管理，所以也不用去管`gitignore`之类的问题，是比较省心的方式。

```bash
# 生成go.work
go work init .

# 修改work文件引入项目目录
go 1.18

directory (
    ./common
    ./my_service
)
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