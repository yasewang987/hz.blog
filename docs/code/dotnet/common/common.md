# NetCore常用功能

## 复制文件夹到发布目录

在`csproj`文件添加如下内容

```bash
<ItemGroup>
    # 多级目录使用**
    <None Include="jmeter/**" CopyToOutputDirectory="Always"/>
    <None Include="html/*" CopyToOutputDirectory="Always"/>
</ItemGroup>
```

## 静态内容在网站展示

```csharp
public void Configure(IApplicationBuilder app, IHostingEnvironment env)
{
    ...
    app.UseStaticFiles();
    // 将`/j/html`目录下的内容映射到网址 /html 在网站展示
    app.UseStaticFiles(new StaticFileOptions()
　　{
　　　　FileProvider = new PhysicalFileProvider("/j/html"),

　　　　RequestPath = new PathString("/html") 
    });
    ...
}
```

## Nuget源配置

在项目跟目录创建`NuGet.Config`文件，内容如下：

```bash
dotnet new nugetconfig
```

```config
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <config>
  </config>
  <packageSources>
    <add key="NuGet Source" value="https://api.nuget.org/v3/index.json" />
    <add key="NuGet School" value="http://nuget.xiaobao100.cn/nuget/xiaobao" />
  </packageSources>
  <!-- used to store credentials -->
  <packageSourceCredentials />
</configuration>
```

## NetCore SDK版本切换

执行命令切换版本、新建`global.json`文件：
```bash
dotnet new globaljson --sdk-version 3.0.100 --force
```


