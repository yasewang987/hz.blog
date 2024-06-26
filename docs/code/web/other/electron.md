# Electron介绍

* 引用electron前需要先设置electron的国内镜像源`ELECTRON_MIRROR=https://npm.taobao.org/mirrors/electron/`。

## 技术选型

* 语言：TypeScript
* 构建工具：Electron-Builder
* Web方案：Vue3+Vite
* 数据库：lowdb

建议electron使用普通项目创建、加载的首页使用另外一个项目vite单独创建。

## 参考资料

* 官网文档：https://www.electronjs.org/zh/docs/latest/
* 发布版本（`electron`和`chromium`版本对应关系）: https://releases.electronjs.org/

> 注意事项：`chrome94`版本之后会默认开启阻止不安全的专用网络请求`chrome://flags/#block-insecure-private-network-requests`,可以使用`electron：14.2.1`版本来规避这个问题。


## Vite项目demo

```bash
# 创建vite项目
yarn create vite

# 引入electron
yarn add -D electron@14.2.1

# 创建electron的文件夹
mkdir electron && cd electron

# 新增两个文件内容如下
```

```js
//////// main.js
// 控制应用生命周期和创建原生浏览器窗口的模组
const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow () {
  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // 加载 index.html
  mainWindow.loadURL('http://localhost:5173') // 此处跟electron官网路径不同，需要注意

  // 打开开发工具
  if (NODE_ENV === "development") {
    mainWindow.webContents.openDevTools()
  }
}

// 这段程序将会在 Electron 结束初始化
// 和创建浏览器窗口的时候调用
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // 通常在 macOS 上，当点击 dock 中的应用程序图标时，如果没有其他
    // 打开的窗口，那么程序会重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 因此，通常对程序和它们在
// 任务栏上的图标来说，应当保持活跃状态，直到用户使用 Cmd + Q 退出。
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})



////// preload.js
// 所有Node.js API都可以在预加载过程中使用。
// 它拥有与Chrome扩展一样的沙盒。
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }
})
```

修改 `package.json`，内容如下：

```json
{
  "name": "quasardemo",
  "private": true,
  "version": "0.0.0",
  // 新增内容
  "main": "electron/main.js",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview",
    // 新增内容
    "start": "vite & (sleep 2 && electron .)"
  }
}
```

调试:

```bash
yarn start
```

## 普通项目demo(推荐)

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

推荐使用electron-builder

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

* 窗口池代替每次新建窗口

提前创建几个隐藏的窗口（不要太多，会占用一定的内存），在需要的时候去加载页面再渲染出来，速度会快很多。

`window.open`：打开一个子窗口，不会创建新的线程，内存也会减少比较多。

在实际的开发中，`窗口池`和`window.open`是可以搭配起来使用的，打开窗口`url同源`的情况下尽量采用`window.open`可以减少内存的开销。

* 设置partition共享或者隔离缓存

通过设置相同的partition名称，可以共享cookies、缓存以及本地存储

```js
const mainWindow = new BrowserWindow({ webPreferences: { partition: 'myapp' } });
```

* 使用`Web Workers`

当碰到复杂的计算函数时，在主进程或者渲染进程中实现都可能引起页面的卡顿，可以将其放置到worker中

```js
const worker = new Worker('./worker.js')

worker.addEventListener('message', event => {
  console.log(`Received from worker: ${event.data}`)
})

worker.postMessage('Hello from the main thread!')
```

* 数据本地缓存

如果你的应用程序涉及到网络请求，那么缓存请求结果会减少网络延迟并减少请求次数。考虑将使用的数据存储在本地，并向服务器发送请求来更新数据。

当软件业务复杂度足够高的时候，可以考虑在本地引入数据库（sqlite）

当引入本地数据库后，数据传输耗时极短，可以考虑将部分业务接口拆分成颗粒度更小的接口，接口返回速度可小于30ms，感受客户端级别的丝滑体验。

与数据库相关的操作尽量放到一个进程中，避免多进程操作数据库带来不可控的影响。


## 报错处理

* 安装electron报错 `RequestError: socket hang up`

```bash
# 先设置electron的国内镜像源
export ELECTRON_MIRROR=https://npm.taobao.org/mirrors/electron/

# 安装
yarn add -D electron@14.2.1
```