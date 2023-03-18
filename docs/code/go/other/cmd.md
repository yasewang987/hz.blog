# Go常用命令

## 编译build

```bash
CGO_ENABLED=0 GOOS=linux GOARCH=mips64le go build -o hello
```

参考资料：https://build.golang.org/

* `CGO_ENABLED`参数：用于标识（声明） cgo 工具是否可用，存在交叉编译的情况时，cgo 工具是不可用的。程序构建环境的目标操作系统的标识与程序运行环境的目标操作系统的标识不同。关闭 cgo 后，在构建过程中会忽略 cgo 并静态链接所有的依赖库，而开启 cgo 后，方式将转为动态链接。
* `GOOS`参数：`linux`,`darwin`,`freebsd`,`windows`等
* `GOARCH`参数：`amd64`,`arm`,`arm64`,`mips64le`等

## 使用 Makefile 进行交叉编译

* 使用 `GOOS` 和 `GOARCH` 设置环境变量命令。
* 使用 `build` 命令， 使用进行 当前系统环境 的编译
* 并且编译文件命名包含系统信息。
* 使用 `buildx` 命令， 实现 交叉编译 所有机型
* 使用 `clean` 命令清空编译结果。

```makefile
## 默认变量， 获取当前 go 的环境变量
GOOS ?= $(shell go env GOOS)
GOARCH ?= $(shell go env GOARCH)

## build 在指定环境变异
build:
 go build -o out/greeting-$(GOOS)-$(GOARCH) .

## 通过指定环境变量， 执行交叉编译
buildx:
 GOOS=linux GOARCH=amd64 make build
 GOOS=linux GOARCH=arm64 make build
 GOOS=darwin GOARCH=amd64 make build
 GOOS=darwin GOARCH=arm64 make build

## 清理编译结果
clean:
 rm -rf out/
```