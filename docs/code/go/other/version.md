# Go多版本管理

## 官方多版本管理

### 方式一：

`go`版本参考地址：https://github.com/golang/dl

```bash
# 其中 <version> 替换为你希望安装的 Go 版本
# 这一步，只是安装了一个特定 Go 版本的包装器
go install golang.org/dl/go<version>@latest

# 下载
go<version> download

# 如果你是第一次升级go版本，则将原来的go重命名一下
sudo mv /usr/local/go/bin/go /usr/local/go/bin/go<oldversion>
# 做一个软链接到新版本（以后有新版本改一下软链接即可）
sudo ln -s $GOPATH/bin/go<version> /usr/local/go/bin/go

# 注意一下如果环境变量设置了GOROOT，一定要确保go env中的GOROOT和环境变量一致
```

注意点：

* 有一个特殊的版本标记：gotip，用来安装最新的开发版本；
* 因为 golang.org 访问不了，你应该配置 GOPROXY（所以，启用 Module 是必须的）；

### 方式二：

```bash
export GOROOT=$(go env GOROOT)
export PATH=${GOROOT}/bin:$PATH
```

## 第三方

### goup

https://mp.weixin.qq.com/s?__biz=MzAxNzY0NDE3NA==&mid=2247485026&idx=1&sn=dcc047b6afe0e4e4daf37f8c9e499fce&scene=21#wechat_redirect

