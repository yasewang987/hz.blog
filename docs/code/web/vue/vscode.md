# Vue-VSCode配置

* 推荐使用`Volar`插件。
## vue文件`import`路径提示
1. 安装插件：`Path Intellisense`
1. 配置：
    ```json
    "path-intellisense.mappings": {
        "@": "${workspaceRoot}/src"
    }
    ```
    <!-- more -->
1. 在项目中创建jsconfig.json或者tsconfig.json
    ```json
    {
        "compilerOptions": {
            "target": "ES6",
            "module": "commonjs",
            "allowSyntheticDefaultImports": true,
            "baseUrl": "./",
            "paths": {
            "@/*": ["src/*"]
            }
        },
        "exclude": [
            "node_modules"
        ]
    }
    ```