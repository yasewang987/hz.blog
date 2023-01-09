# 使用NPM库管理前端通用库

使用`nvm`管理node和npm
## 常用命令

```bash
# 查看全局安装模块
npm list --depth=0 -global

# 把webpack包安装到node_modules目录
# 在package.json的dependencies属性下（项目正常运行时需要）
# 运行 npm install 初始化项目时会下载模块
npm install --save xxx
npm install -S xxx
yarn add xxx
# 安装指定版本
yarn add xxx@1.1.1

# 把webpack包安装到node_modules目录
# 在package.json的devDependencies属性下(项目开发时需要)
# 运行 npm install 初始化项目时会下载模块
npm install --save-dev xxx
npm install -D xxx
yarn add -D xxx

# 安装模块到项目node_modules目录下
# 不会将模块依赖写入devDependencies或dependencies 节点
# 运行 npm install 初始化项目时不会下载模块
npm install xxx

# 安装模块到全局，不会在项目node_modules目录中保存模块包
# 不会将模块依赖写入devDependencies或dependencies 节点
# 运行 npm install 初始化项目时不会下载模块
npm install -g xxx
yarn add -g xxx
```

## 建立自己的npm库

1. 创建`GitHub`和`npm`账户（需要通过邮箱先激活npm账户）
1. 新建文件夹：`mkdir jsLib`
1. 初始化npm：
    ```bash
    npm init
    # 根据提示输入相关信息
    # entry point: 表示入口文件
    ```
<!-- more -->
1. 新建a,b,并编辑代码(js)
    ```js
    // ./a/index.js

    function hello_a(name){
        console.log('hello_a '+name);
    }

    exports.hello_a = hello_a;

    // ./b/index.js
    
    function hello_b(name){
        console.log('hello_b '+name);
    }

    exports.hello_b = hello_b;

    // index.js 这个是该库的入口文件
    import {hello_a} from './a/index'
    import {hello_b} from './b/index'

    export {
        hello_a,
        hello_b
    }
    ```
1. TS版本步骤：
    1. 安装TypeScrept：`npm install -D typescript`
    1. 修改package.json,添加相关命令：
        ```json
        {
            "main": "./dist/index.js",  // 修改入口为ts生成文件位置
            "scripts": {
                // "test": "./node_modules/.bin/mocha --reporter spec",
                "init": "./node_modules/.bin/tsc --init",
                "build": "./node_modules/.bin/tsc"
            },
            "types": "./dist/index.d.ts", // 设置项目内置的 TypeScript 模块声明文件入口文件
            "typings": "./dist/index.d.ts",  // 设置项目内置的 TypeScript 模块声明文件入口文件
        }
        ```
    1. 初始化ts：`npm run init`,会生成`tsconfig.json`文件
    1. 修改`tsconfig.json`内容
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
    1. 编辑逻辑代码：
        ```bash
        mkdir -p lib/jsTest
        touch lib/jsTest/index.ts # jsTest中的方法写在这里
        touch index.ts # 这个是合并所有ts方法用的
        ```
        * lib/jsTest/index.ts:
            ```ts
            function hello(a:number, b:number) : number {
                return a+b
            }
            export {hello}
            ```
        * index.ts:
            ```ts
            import {hello} from './lib/JSTest/index'

            export {
                hello
            }
            ```
    1. 编译：`npm run build`
    1. 编译完成我们可以看到目录下出现了 dist目录，在该目录下生成了两个文件，一个包含代码逻辑的 JS 文件，一个包含类型定义的 interface文件（xxx.d.ts）
    1. 编写测试：
        1. 安装测试框架和断言库:`npm install -D mocha chai`
        1. 创建测试目录和文件：`mkdir test && touch test/test.js`
        1. test.js:
            ```js
            'use strict'
            const expect = require('chai').expect
            const add = require('../dist/index').hello

            describe('hz jstest hello', () => {
                it('should return 10', () => {
                    const result = add(2, 8)
                    expect(result).to.equal(10)
                })
            })
            ```
        1. 添加测试脚本命令：
            ```json
            {
                "scripts": {
                    "test": "./node_modules/.bin/mocha --reporter spec",
                    ...
                },
            }
            ```
        1. 运行测试脚本：`npm run test`

1. 将项目上传到`GitHub`托管：
    1. 忽略没有必要上传的文件 `.gitignore`
        ```bash
        # .gitignore
        node_modules/
        package-lock.json
        /dist/
        ```
    1. 推送到远程仓库
        ```bash
        git init
        git add .
        git commit -m 'init'
        git remote add origin git@github.com:yasewang987/jsLib.git
        git push -u origin master
        ```
1. 发布到`npm`：
    1. 忽略没有必要上传的文件：`.npmignore`
        ``` bash
        # .npmignore
        lib/
        node_modules/
        .gitignore/
        .npmignore/
        tsconfig.json
        test/
        package-lock.json
        package.json
        tslint.json
        index.ts
        ``` 
    1. 检查源地址：`npm config get registry`,需要确保npm是官方源`https://registry.npmjs.org/`
    1. 修改版本号命令：
        ```bash
        npm version v0.1.0      # 版本号变成 0.1.0，即显式设置版本号。
        npm version patch       # 版本号从 0.1.0 变成 0.1.1，即修订版本号加一
        npm version minor       # 版本号从 0.1.1 变成 0.2.0，即子版本号加一
        npm version major       # 版本号从 0.2.0 变成 1.0.0，即主版本号加一

        # 版本号从 1.2.3 变成 1.2.4-0，就是 1.2.4 版本的第一个预发布版本。
        npm version prepatch
        # 版本号从 1.2.4-0 变成 1.3.0-0，就是 1.3.0 版本的第一个预发布版本。
        npm version preminor
        # 版本号从 1.2.3 变成 2.0.0-0，就是 2.0.0 版本的第一个预发布版本。
        npm version premajor
        # 版本号从 2.0.0-0 变成 2.0.0-1，就是使预发布版本号加一。
        npm version prerelease

        # 注意： version 命令默认会给你的 git 仓库自动 commit 一把，并打一个 tag。如果不想它动你的 git 仓库，你应该使用 --no-git-tag-version 参数，例如：

        npm --no-git-tag-version version patch
        # 如果你想一劳永逸，那么可以使用如下 NPM 设置彻底禁止它：

        npm config set git-tag-version false  # 不要自动打 tag
        npm config set commit-hooks false     # 不要自动 commit
        ```
    1. 发布：
        ```bash
        npm login
        # 根据提示输入npm账号信息

        npm publish
        # 这里如果名称在npmjs中已经存在会报错，所以设置name时需要先去官网确认名称是否被使用
        ```
    1. 使用标签
        以 `TypeScript` 为例，通过`npm info typescript`可以看到`dist-tags`字段有着五个 值，分别是`latest, beta, rc, next, insiders`，这些都是`dist-tag`，可以 称之为标签——你可以把它理解为`git`里面的分支。  
        有什么用呢？其实，我们平时用`npm install xxxxxx`的时候，是使用了一个潜在的选项`tag = latest`，可以通过`npm config list -l | grep tag`看到。
        因此实际上是执行了`npm install xxxxxx@latest`。也就是安装了`latest`这个标签 对应的最新版本。  
        不同的标签可以有不同的版本，这就方便我们发表非稳定版本到`npm`上，与稳定版本分开。
    1. 使用前缀
        * `@angular/core`这里面的`@angular/`叫做包前缀（scope）
        * 修改`package.json`中的`name`:`@abc/test`其中`abc`必须为你注册的账户
            ```bash
            # 如果你要初始化一个带包前缀的包，则可以使用下面的命令。
            npm init --scope=abc # 当然你还可以加上个 `-y` 快速创建。

            # 或者你想每次都使用 @abc/ 包前缀？加个设置即可：
            # 这样每次初始化新的 package.json，都将自动应用 @abc/ 包前缀。
            npm config set scope abc
            ```
        * 发布带前缀的包：`npm publish --access=public`，这里必须带上`access=public`参数,因为只有公共的包才能免费发布为带前缀的
        
1. 去npm官网搜索查看我们上传的库
1. 测试是否成功：
    ```bash
    # 新建一个 testNPM.js文件
    # 安装类库
    npm install -S hzgodutils

    # 在testNPM.js添加如下内容,也可以使用import
    var hzutils = require('hzgodutils')
    hzutils.hello_a('hzgod')

    # 使用node执行js文件
    node testNPM.js
    ```

## package.json内容解析

```json
{
  "name": "full-sample",
  "version": "0.1.0",
  "description": "A sample to learn NPM.",
  "main": "./dist/index.js",  // 指定 Node.js 中 require("moduel-name") 导入的默认文件
  "scripts": {
    "prepare": "npm run rebuild",
    "build": "tsc -p .",
    "rebuild": "npm run clean && npm run lint && npm run build",
    "test": "echo See directory sources/tests",
    "clean": "rm -rf dist",
    "lint": "tslint --project tslint.json"
  },
  // 指定项目的关键词，合理设置有利于让他人发现你的项目
  "keywords": [
    "npm",
    "sample"
  ],
  "author": "NPM Learner <me@sample.com> (https://sample.com/)",
  "license": "Apache-2.0",
  // 指定项目的源码仓库地址，可以指定是 git/cvs/svn
  "repository": { 
    "type": "git",
    "url": "git+https://github.com/learn-npm/full-sample.git"
  },
  "bugs": {
    "url": "https://github.com/learn-npm/full-sample/issues" // 指定项目的 Bug 反馈地址，一般可以用项目的 GitHub Issue 地址
  },
  "homepage": "https://github.com/learn-npm/full-sample#readme", // 指定项目的主页地址，如果没有一般可以使用项目的 GitHub 地址
  "types": "./dist/index.d.ts", // 设置项目内置的 TypeScript 模块声明文件入口文件
  "typings": "./dist/index.d.ts",  // 设置项目内置的 TypeScript 模块声明文件入口文件
  "dependencies": {
    "sequelize": "^4.24.0"
  },
  "devDependencies": {
    "@types/node": "^8.0.51",
    "@types/sequelize": "^4.0.79",
    "typescript": "^2.6.1"
  },
  // 设置项目对引擎的版本要求，比如 node、electron、vscode 等
  "engines": {
    "node": ">=8.0.0"
  }
}
```