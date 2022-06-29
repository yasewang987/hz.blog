# Electron介绍

## 参考资料

* 官网文档：https://www.electronjs.org/zh/docs/latest/
* 发布版本（`electron`和`chromium`版本对应关系）: https://releases.electronjs.org/

> 注意事项：`chrome94`版本之后会默认开启阻止不安全的专用网络请求`chrome://flags/#block-insecure-private-network-requests`,可以使用`electron：14.2.1`版本来规避这个问题。


## 初始化项目

1. 需要提前安装 `node`
1. 初始化项目, `init` 初始化的时候需要注意 `entry point 应为 main.js`,

    ```bash
    mkdir my-electron-app && cd my-electron-app
    npm init
    # yarn init
    ```
1. 添加`electron`到依赖项

    ```bash
    npm install --save-dev electron
    # yarn add --dev electron
    ```
1. 在 `package.json` 中添加启动命令

    ```json
    {
      "scripts": {
        "start": "electron ."
      }
    }
    ```
1. 到这里就可以启动正常启动electron应用了。

## 示例应用

Demo演示参考: https://github.com/yasewang987/electron-demo

## 动态读取后端服务

使用 `node` 的 `fs` 模块来读取配置文件

```bash
# 根目录下创建配置文件 myconfig.json，里面写入baseUrl 
{
  "baseURL": "127.0.0.1:1111"
}

# 修改package.json的build配置,配置打包时对资源进行复制
# 注意 electron-builder 中两个常用的配置选项：extraResources 拷贝资源到打包后文件的 Resources 目录中，extraFiles 拷贝资源到打包目录的根路径下，这里使用extraResources ,其中 from 表示需要打包的资源文件路径，to 值为 “../” 表示根路径
{
  "build": {
    "extraResources": {
      "from": "./myconfig.json",
      "to": "../"
    }
  }
}
```
创建getBaseUrl.js 文件实现读取操作，并返回读取数据

```js
const { app } = require("electron").remote;
const path = require("path");
const fs = require("fs");
 
export function getSystem() {
  //这是mac系统
  if (process.platform == "darwin") {
    return 1;
  }
  //这是windows系统
  if (process.platform == "win32") {
    return 2;
  }
  //这是linux系统
  if (process.platform == "linux") {
    return 3;
  }
}
/**
 *
 * @returns 获取安装路径
 */
export function getExePath() {
  return path.dirname(app.getPath("exe"));
}
/**
 *
 * @returns 获取配置文件路径
 */
export function getConfigPath() {
  if (getSystem() === 1) {
    return getExePath() + "/config.conf";
  } else {
    return getExePath() + "\\config.conf";
  }
}
/**
 * 读取配置文件
 */
export function readConfig(callback) {
  fs.readFile(getConfigPath(), "utf-8", (err, data) => {
    if (data) {
      //有值
      const config = JSON.parse(data);
      callback(config);
    }
  });
}
```

在项目启动后加载的vue文件中调用该函数，异步改变baseUrl

```html
<script>
import { readConfig } from "@/utils/getBaseUrl.js";
mounted() {
    readConfig((res) => {
      const { baseURL } = res;
       this.$message.success({ content: `ws://${baseURL}/websocket` });
       // ... 执行其他操作即可
    });
}
</script>
```


