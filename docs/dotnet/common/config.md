# NetCore自定义配置文件

## Intro

在开发的时间经常会需要将数据保存在`json`配置文件中，在需要的时候再取出来用。在`netcore`里取出来的默认是字典的格式，但是我们通常是希望直接取到自定义的模型格式。其实`netcore`已经给我们考虑到了，下面是验证过程。

## 开始测试

### 准备工作
1. 添加配置文件

    ```bash
    touch test.json
    ```
1. 配置文件中添加如下内容

    ```json
    // test.json
    {
        "f": {
            "fs": "fstring",
            "fi": 10,
            "c1": {
                "c1s": "c1string",
                "c1i": 101
            },
            "c2": {
                "c2s": "c2string",
                "c2i": 201
            }
        }
    }
    ```
<!-- more -->
1. 添加配置文件对应的类

    ```csharp
    // C1.cs
    public class C1
    {
        public string c1s {get;set;}
        public int c1i{get;set;}
    }

    // C2.cs
    public class C2
    {
        public string c2s{get;set;}
        public int c2i{get;set;}
    }

    // F.cs
    public class F
    {
        public string fs {get;set;}
        public int fi {get;set;}

        public C1 c1 {get;set;}
        public C2 c2{get;set;}
    }
    ```
1. 设置配置文件在发布时一起复制到发布目录中(如果教新则复制)

    ```csharp
    // TC.Authorization.csproj

    <ItemGroup>
        <None Include="test.json" CopyToOutputDirectory="PreserveNewest"/>
    </ItemGroup>

    // 下面这个不需要
    <ItemGroup>
        <None Include="config\*" CopyToOutputDirectory="PreserveNewest"/>
    </ItemGroup>
    ```

### webapi项目

1. 修改Program.cs添加配置文件到Configuration：

    ```csharp
    public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
    WebHost.CreateDefaultBuilder(args)
        .UseStartup<Startup>()
        .ConfigureAppConfiguration(builder => {
            builder.AddJsonFile("config/auths.json",true,true);
        });
    ```
1. 在Startup.cs中使用配置：

    ```csharp
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }
        public void ConfigureServices(IServiceCollection services)
        {
        }
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            // app.UseIdentityServer();

            var test = new test1();
            Configuration.GetSection("test1").Bind(test);
            app.Run(async (context) =>
            {
                var res = new StringBuilder();
                foreach (var item in test.test2)
                {
                    res.Append($" {item.test2_1} {item.test2_2} ");
                }
                await context.Response.WriteAsync($"{test.test1_1} {test.test1_2} {res}");
            });
        }
    }
    ```
    如果需要在其他地方使用，只需要在对应的构造函数中注入`IConfiguration`即可

### console程序

1. `nuget`应用相关的包

    ```bash
    dotnet add package Microsoft.Extensions.Configuration
    dotnet add package Microsoft.Extensions.Configuration.Json
    dotnet add package Microsoft.Extensions.Configuration.Binder
    ```
1. 修改`Program.cs`文件内容

    ```csharp
    static void Main(string[] args)
    {
        var builder = new ConfigurationBuilder();
        builder.AddJsonFile($"{Directory.GetCurrentDirectory()}/test.json",false,true);

        var config = builder.Build();

        // 方式1
        var f1 = new F();
        config.GetSection("f").Bind(f1);

        Console.WriteLine($"{f1.fi} {f1.fs} {f1.c1.c1i} {f1.c1.c1s} {f1.c2.c2i} {f1.c2.c2s}");

        // 方式2
        var f2 = config.GetSection("f").Get<F>();
        Console.WriteLine($"{f2.fi} {f2.fs} {f2.c1.c1i} {f2.c1.c1s} {f2.c2.c2i} {f2.c2.c2s}");

    }
    ```

## 测试结果  

测试源码已经上传至`Github`,需要的同学 [戳此下载](https://github.com/yasewang987/Hz.DonetDemo/tree/master/Hz.Configure)
---