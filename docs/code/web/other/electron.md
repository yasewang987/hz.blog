# Electron介绍

## 技术选型

* 语言：TypeScript
* 构建工具：Electron-Forge
* Web方案：Vue3+Vite
* 数据库：lowdb

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


## 构建

* 图标生成：https://tool.520101.com/diannao/ico/

* 二进制文件构建（基于`electron-forge`）：

```js
// 二进制程序不能打包进 asar 中 可以在构建配置文件（forge.config.js）进行如下设置
const os = require('os')
const platform = os.platform()
const config = {
  packagerConfig: {
    // 可以将 ffmpeg 目录打包到 asar 目录外面
    extraResource: [`./src/main/ffmpeg/`]
  }
}


// 开发和生产环境，获取二进制程序路径方法是不一样的 可以采用如下代码进行动态获取：
import { app } from 'electron'
import os from 'os'
import path from 'path'
const platform = os.platform()
const dir = app.getAppPath()
let basePath = ''
if(app.isPackaged) basePath = path.join(process.resourcesPath)
else basePath = path.join(dir, 'ffmpeg')
const isWin = platform === 'win32'
// ffmpeg 二进制程序路径
const ffmpegPath = path.join(basePath, `${platform}`, `ffmpeg${isWin ? '.exe' : ''}`)
```

* 按需构建

```js
// 在 forge.config.js 配置文件中进行如下配置来区分不同的桌面，即可完成按需构建，代码如下：
const platform = os.platform()
const config = {
  packagerConfig: {
    extraResource: [`./src/main/ffmpeg/${platform}`]
  },
}
```

* 性能优化

因为在 `electron` 构建机制中，会自动把 `dependencies` 的依赖全部打到 `asar` 中。

1. 将 `web` 端构建所需的依赖全部放到 `devDependencies` 中，只将在 `electron` 端需要的依赖放到 `dependencies`
1. 将和生产无关的代码和文件从构建中剔除
1. 对跨平台使用的二进制文件，如 `ffmpeg` 进行按需构建（上文按需构建已介绍）
1. 对 `node_modules` 进行清理精简（`yarn autoclean -I` 和 `yarn autoclean -F`）

## 更新

* 全量更新

1. 开发服务端接口，用来返回应用最新版本信息
1. 渲染进程使用 axios 等工具请求接口，获取最新版本信息
1. 封装更新逻辑，用来对接口返回的版本信息进行综合比较，判断是否更新
1. 通过 ipc 通信将更新信息传递给主进程
1. 主进程通过 electron-updater 进行全量更新
1. 将更新信息通过 ipc 推送给渲染进程
1. 渲染进程向用户展示更新信息，若更新成功，则弹出弹窗告诉用户重启应用，完成软件更新

* 增量更新

通过拉取最新的渲染层打包文件，覆盖之前的渲染层代码，完成软件更新，此方案只需替换渲染层代码，无需替换所有文件。

1. 渲染进程定时通知主进程检测更新
1. 主进程检测更新
1. 需要更新，则拉取线上最新包
1. 删除旧版本包，复制线上最新包，完成增量更新
1. 通知渲染进程，提示用户重启应用完成更新

## 性能优化

* 使用 `v8-compile-cache` 缓存编译代码，https://www.npmjs.com/package/v8-compile-cache
```js
// 在需要缓存的地方加一行
require('v8-compile-cache')
```
* 优先加载核心功能，非核心功能动态加载
```js
export function share() {
  const kun = require('kun')
  kun()
}
```
* 使用多进程，多线程技术
```js
// 核心方案就是将运行时耗时、计算量大的功能交给新开的 node 进程去执行处理
const { fork } = require('child_process')
let { app } = require('electron')

function createProcess(socketName) {
  process = fork(`xxxx/server.js`, [
    '--subprocess',
    app.getVersion(),
    socketName
  ])
}

const initApp = async () => {
  // 其他初始化代码...
  let socket = await findSocket()
  createProcess(socket)
}

app.on('ready', initApp)
```
* 采用 asar 打包：会加快启动速度
* 增加视觉过渡：loading + 骨架屏