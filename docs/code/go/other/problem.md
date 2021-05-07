# Go常见问题

## GoLand无法识别本地模块

在设置中配置 Go-》Go Modules 中勾选 `Enable Go modules integration` 并设置环境变量 `GOPROXY` 的值为 `https://goproxy.cn,direct`

## VSCode中引用本地包报错

如果使用vscode + language server(gopls)使用引用工程，所以如果你是在一个目录中下面有多个子目录，每个子目录都是一个带`go.mod`的工程，并且需要在文件中加入 `require replace`，就得把这些子目录一个个分别用vscode打开，不然就会报错无法找到引用的本地包。

还有一种解决方案是将本地包放到 `$GOPATH/src/github.com/yasewang/xxx` 目录下，这样就不需要生成 go.mod 了。
