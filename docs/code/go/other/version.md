# Go多版本管理

## 官方多版本管理

可以通过 `genv go1.16.4`代替下面的命令完成包装器安装。地址：https://github.com/golang/dl/blob/master/internal/genv/main.go

```bash
# 其中 <version> 替换为你希望安装的 Go 版本
# 这一步，只是安装了一个特定 Go 版本的包装器
go get golang.org/dl/go<version>

# 安装特定的 Go 版本
go<version> download
```

注意点：

* 有一个特殊的版本标记：gotip，用来安装最新的开发版本；
* 因为 golang.org 访问不了，你应该配置 GOPROXY（所以，启用 Module 是必须的）；
* 跟安装其他包一样，go get 之后，go1.16.4 这个命令会被安装到 $GOBIN 目录下，默认是 ~/go/bin 目录，所以该目录应该放入 PATH 环境变量；
* 没有执行 download 之前，运行 go1.16.4，会提示 `go1.16.4: not downloaded. Run 'go1.16.4 download' to install to ~/sdk/go1.16.4`；

go1.16.4 这个命令，一直都只是一个包装器。如果你希望新安装的 go1.16.4 成为系统默认的 Go 版本，即希望运行 go 运行的是 go1.16.4，方法有很多：

* 将 `~/sdk/go1.16.4/bin/go` 加入 PATH 环境变量（替换原来的）；
* 做一个软连，默认 go 执行 go1.16.4（推荐这种方式），不需要频繁修改 PATH；

## 第三方

### goup

https://mp.weixin.qq.com/s?__biz=MzAxNzY0NDE3NA==&mid=2247485026&idx=1&sn=dcc047b6afe0e4e4daf37f8c9e499fce&scene=21#wechat_redirect

