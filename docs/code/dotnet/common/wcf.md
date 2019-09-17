# NetCore调用WCF服务

在使用NetCore开发的时候，有时候会遇到一些特别的需求需要去调用第三方的WCF服务。查了一圈都没有啥靠谱的方案，后来无聊翻了一下微软的官方文档，发现一个跨平台的解决方法，分享出来给大家。

官网地址：https://docs.microsoft.com/en-us/dotnet/core/additional-tools/dotnet-svcutil-guide?tabs=dotnetsvcutil2x

系统要求：NetCore2.1及以上版本

## 一、新建【webapi】项目

```bash
# 其他类型的netcore项目也可以
dotnet new webapi -n webapiTest --no-https
```
## 二、安装【svcutil】工具

```bash
dotnet tool install --global dotnet-svcutil
```
## 三、生成WCF客户端

```bash
cd 你的项目目录
dotnet-svcutil http://yousvcurl/hello.svc
# 安装到指定目录及使用指定命名空间
dotnet-svcutil http://yousvcurl/hello.svc?wsdl -d "Connect Services/MisWs" -n "*,hzgod.WCF"
```
生成之后在项目目录中会出现`ServiceReference`文件夹，里面有一个配置文件，及一个客户端代码
## 四、使用WCF客户端

1. 重建一下项目，安装svc客户端需要的程序包

    ```bash
    dotnet restore
    ```

1. 打开需要使用svc客户端的文件，我这里在`ValuesController.cs`中测试，添加如下代码

    ```csharp
    [HttpGet]
    public async Task<ActionResult<IEnumerable<string>>> Get()
    {
        var client = new SZInterfaceClient();
        var result = await client.TCPayQueryAsync("","","","","");
        return new string[] { "value1", "value2", result };
    }
    ```

## 五、更多命令查看

```bash
dotnet-svcutil --help
```

