# Go常用命令

## 编译build

```bash
CGO_ENABLED=0 GOOS=linux GOARCH=mips64le go build -o hello
```

参考资料：https://build.golang.org/

* `GOOS`参数：`linux`,`darwin`,`freebsd`,`windows`等
* `GOARCH`参数：`amd64`,`arm`,`arm64`,`mips64le`等