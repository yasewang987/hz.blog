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