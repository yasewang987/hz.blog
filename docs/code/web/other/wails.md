# Wails-go桌面客户端

* 官网地址：https://wails.io/zh-Hans/docs/introduction

## 前置条件

* `go1.18`以上
* `node15`以上

## windows

```bash
# 安装 Wails Cli
go install github.com/wailsapp/wails/v2/cmd/wails@latest
# 检查依赖，没问题就可以创建项目了
wails doctor
# 创建项目
wails init -n myproject -t vue-ts
# 启动调试
wails dev
```