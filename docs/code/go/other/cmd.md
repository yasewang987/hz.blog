# Go常用命令

## 编译build

```bash
CGO_ENABLED=0 GOOS=linux GOARCH=mips64le go build -o hello
```

参考资料：https://build.golang.org/

* `CGO_ENABLED`参数：用于标识（声明） cgo 工具是否可用，存在交叉编译的情况时，cgo 工具是不可用的。程序构建环境的目标操作系统的标识与程序运行环境的目标操作系统的标识不同。关闭 cgo 后，在构建过程中会忽略 cgo 并静态链接所有的依赖库，而开启 cgo 后，方式将转为动态链接。
* `GOOS`参数：`linux`,`darwin`,`freebsd`,`windows`等
* `GOARCH`参数：`amd64`,`arm`,`arm64`,`mips64le`等