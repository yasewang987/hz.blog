# PlantUML 使用教程

## 参考资料

相关的图型使用[参考官网](https://plantuml.com/zh/)

Server端 [github源码地址](https://github.com/plantuml/plantuml-server)

## 部署及使用

这里使用 `plantuml-server` 端来解析展示文件效果。

* 部署 `plantuml-server`

```bash
docker run -d -p 18080:8080 --name my-uml plantuml/plantuml-server:jetty
```

* 安装 vscode 插件，搜索 `PlantUML`，安装数量最大的那个。

* 修改 vscode 中的如下配置

```json
"plantuml.server": "http://192.168.1.100:8080",
"plantuml.render": "PlantUMLServer",
```