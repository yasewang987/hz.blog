# Dotnet Template

## 参考资料

* [微软docs](https://docs.microsoft.com/zh-cn/dotnet/core/tools/custom-templates)
* [template wiki](https://github.com/dotnet/templating/wiki)
* [template samples](https://github.com/dotnet/dotnet-template-samples)

## 实际templdate例子参考

```json
{
 "$schema": "http://json.schemastore.org/template",
 "author": "hz-template",
 "classifications": [ "WebApi" ],
 "name": "hz-template",
 "identity": "hz-template",
 "groupIdentity": "hz-template",
 "shortName": "hz-template",
 "tags": {
   "language": "C#",
   "type": "project"
 },
 // 模版的名字，命令的name会替换这些字符
 "sourceName": "Hz.Template",
 "preferNameDirectory": true,
 // 变量定义
 "symbols": {
   "no-task": {
     // 可以在项目的文件中添加如下格式代码，确认是否需要这部分内容
     // #if (!no-task)
     // #endif
     "type":"parameter",
     "datatype":"bool",
     "defaultValue": "false",
     "description": "带上该参数不生成BackGroundTasks项目"
   },
   "dockImageName-1": {
     "type": "derived",
     "valueSource": "name",
     "valueTransform": "lowcase"
   },
   "dockImageName-2": {
     "type": "derived",
     "valueSource": "dockImageName-1",
     "valueTransform": "replaceChar",
     "replaces": "DockerImageName"
   }
 },
 "forms": {
   // 小写
   "lowcase": {
     "identifier":"lowerCase"
   },
   // 将 . 替换为 -
   "replaceChar": {
     "identifier": "replace",
     "pattern": "(\\.)",
     "replacement": "-"
   }
 },
 "sources": [
   {
     "modifiers": [
       { // 排除不需要的文件
         "condition": "(no-task)",
         "exclude": [
           "DockerfileTask",
           "src/Xiaobao.Ddd.Template.BackgroundTasks/**"
         ]
       }
     ]
   }
 ]
}
```