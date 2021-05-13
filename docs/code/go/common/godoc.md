# Godoc使用

godoc主要用来生成包的文档（包含所有变量、方法等的注释信息）

## godoc安装

安装完成之后在 `$GOPATH/bin` 目录下会生成 `godoc` 可执行文件

```bash
go get -v -u golang.org/x/tools/cmd/godoc
```

## godoc使用

使用如下命令运行说明文档站点：

```bash
godoc -http=:6060 -goroot="."
```

访问： http://localhost:6060/pkg/你的包名