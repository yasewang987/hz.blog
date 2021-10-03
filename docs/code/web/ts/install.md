# TypeScript-VSCode环境安装

## 环境安装

1. VSCode中安装tslint插件，并打开`设置`中的相关检测功能（如果没起作用，重新打开vscode）
1. 项目中安装ts：`npm install -D typescript`(当然也可以使用全局安装，我这里安装在项目中)
1. 安装tslint:`npm install -D tslint`(同样可以采用全局安装)
<!-- more -->
1. 修改package.json文件配置（需要先执行`npm init`）：
    ```json
    {
        "main": "./dist/index.js", // 配合tsconfig.json中的outDir字段
        "scripts": {
            // "test": "./node_modules/.bin/mocha --reporter spec",
            "init": "./node_modules/.bin/tsc --init",
            "build": "./node_modules/.bin/tsc",
            "tslint": "tslint --project . dist/**/*.ts dist/**/*.tsx"
        },
        "types": "./dist/index.d.ts",// 设置项目内置的 TypeScript 模块声明文件入口文件
        "typings": "./dist/index.d.ts",// 设置项目内置的 TypeScript 模块声明文件入口文件
    }
    ```
1. 初始化ts：`npm run init`，会生成一个`tsconfig.json`的配置文件
1. 修改`tsconfig.json`:
    ```json
    {
        "compilerOptions": {
            "target": "es5", // 指定ECMAScript目标版本
            "module": "commonjs", // 指定模块化类型
            "declaration": true, // 生成 `.d.ts` 文件
            "outDir": "./dist", // 编译后生成的文件目录
            "strict": true, // 开启严格的类型检测
            "sourceMap": true // 调试时开启
        }
    }
    ```
1. 生成tslint配置文件：`./node_modules/.bin/tslint --init`（直接手动创建`tslint.json`文件也行）
1. 安装tslint检测规则：`npm install -D tslint-config-alloy`
1. 修改配置文件`tslint.json`:
    ```json
    {
        "defaultSeverity": "error",
        "extends": "tslint-config-alloy",
        "jsRules": {},
        "rules": {
            // 忽略分号
            "semicolon": [
                false,
                "always"
            ]
        },
        "rulesDirectory": [],
        "linterOptions": {
            "exclude": [
                "**/node_modules/**"
            ]
        }
    }
    ```
1. 如果要安装单元测试，参考[npmjs设置](../npmjs/index.md)
