# NetCore的WebAPI项目添加Swagger

## 使用Swagger生成WebAPI接口文档

* 参考资料：https://docs.microsoft.com/en-us/aspnet/core/tutorials/getting-started-with-swashbuckle?view=aspnetcore-2.1&tabs=visual-studio%2Cvisual-studio-xml

1. Nuget引入swagger:`dotnet add tcshop.api.csproj package Swashbuckle.AspNetCore`
1. `ConfigureServices`方法中注册Swagger

   ```csharp
   public void ConfigureServices(IServiceCollection services)
    {
        services.AddMvc();

        #region Swagger
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new Info
            {
                Version = "v0.1.0",
                Title = "Blog.Core API",
                Description = "框架说明文档",
                TermsOfService = "None",
                Contact = new Swashbuckle.AspNetCore.Swagger.Contact { Name = "Blog.Core", Email = "Blog.Core@xxx.com", Url = "https://www.jianshu.com/u/94102b59cc2a" }

                var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
                var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
                c.IncludeXmlComments(xmlPath,true); //第二个参数表示显示controller注释
            });
        });

        #endregion
    }
   ```

   * 这里需要注意，`AddSwagger`中的第一个参数`Name`必须与后面`Config`方法中`UseSwraggerUI`中的`URL`参数一致
   * 需要在`tc.shop.api.csproj`文件中添加如下配置：

   ```xml
    <PropertyGroup>
        <GenerateDocumentationFile>true</GenerateDocumentationFile>
        <NoWarn>$(NoWarn);1591</NoWarn>
    </PropertyGroup>
   ```
1. `Configure`方法中加入Swagger中间件

    ```csharp
    // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
    public void Configure(IApplicationBuilder app, IHostingEnvironment env)
    {
        if (env.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
        }

        #region Swagger
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "ApiHelp V1"); // 注意这里的第一个参数必须是"/swagger/configservices中注册的版本号(v1)/swagger.json"
            c.RoutePrefix = string.Empty;// 路径配置，设置为空，表示直接访问该文件（比如直接访问locahost:5000就能访问到swagger）
        });
        #endregion

        app.UseMvc();
    }
    ```

## 生成多版本Swagger API文档

[Nswag官方Wiki](https://github.com/RicoSuter/NSwag/wiki/AspNetCore-Middleware)
[官方实现多版本示例](https://github.com/RicoSuter/NSwag/blob/master/src/NSwag.Generation.AspNetCore.Tests.Web)
[多版本Issue讨论](https://github.com/RicoSuter/NSwag/pull/1701)

封装了NetCore3.1版本的帮助类代码

```csharp
using System.Collections.Generic;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Mvc.Versioning;
using Microsoft.Extensions.DependencyInjection;
using NSwag;
using NSwag.Generation.Processors.Security;

namespace Xiaobao.Ddd.Template.API
{
    public static class NswagExtensions
    {
        /// <summary>
        /// 开放
        /// </summary>
        public const string OPEN = "2";
        /// <summary>
        /// 内部
        /// </summary>
        public const string INNER = "1";

        /// <summary>
        /// 添加多版本的swagger api文档生成
        /// </summary>
        /// <param name="services"></param>
        /// <returns></returns>
        public static IServiceCollection AddNswagMultiApiDocuments(this IServiceCollection services)
        {
            services.AddApiVersioning(option => {
                option.AssumeDefaultVersionWhenUnspecified = true;
                option.ApiVersionReader = new UrlSegmentApiVersionReader();
            })
            .AddVersionedApiExplorer(options =>
            {
                options.GroupNameFormat = "VVV";
                options.SubstituteApiVersionInUrl = true;
            });

            services.AddSwaggerDocument(document => {
                document.Title = "Xiaobao.Ddd.Template HTTP API";
                document.Description = "The Xiaobao.Ddd.Template Service HTTP API";
                document.Version = $"v{INNER}";
                document.DocumentName = $"v{INNER}";
                document.ApiGroupNames = new[] { INNER };
                // 这里可以添加oauth认证
            }).AddSwaggerDocument(document => {
                document.Title = "Xiaobao.Ddd.Template HTTP API";
                document.Description = "The Xiaobao.Ddd.Template Service HTTP API";
                document.Version = $"v{OPEN}";
                document.DocumentName = $"v{OPEN}";
                document.ApiGroupNames = new[] { OPEN };
            });

            return services;
        }


        /// <summary>
        /// 添加多端的swagger api文档生成
        /// </summary>
        /// <returns></returns>
        public static IServiceCollection AddNswagMultiClientApiDocuments(this IServiceCollection services, List<ClientRouteInfo> clients, string title = "Xiaobao API", string description = "Xiaobao API")
        {
            services.AddApiVersioning(option =>
            {
                option.AssumeDefaultVersionWhenUnspecified = true;
                option.ApiVersionReader = new HeaderApiVersionReader("api-version");
            })
            .AddVersionedApiExplorer(options =>
            {
                options.GroupNameFormat = "VVV";
                options.SubstituteApiVersionInUrl = true;
            });

            foreach (var client in clients)
            {
                services.AddSwaggerDocument(document =>
                {
                    document.Title = client.ClientName;
                    document.Description = client.ClientName;
                    document.Version = client.RouteKey;
                    document.DocumentName = client.ClientName;
                    document.AddOperationFilter(p =>
                    {
                        return p.OperationDescription.Path.StartsWith(client.RouteKey);
                    });
                });
            }
            services.AddSwaggerDocument(document =>
            {
                document.Title = "所有接口";
                document.Description = "所有接口";
                document.Version = $"All-Apis";
                document.DocumentName = $"All-Apis";
            });

            return services;
        }

        public static IApplicationBuilder UseNswag(this IApplicationBuilder app, string pathBase = "")
        {
            app.UseOpenApi();
            app.UseSwaggerUi3(config => {
                config.TransformToExternalPath = (internalUiRoute, request) => {
                    if (internalUiRoute.StartsWith("/") == true && internalUiRoute.StartsWith(request.PathBase) == false)
                    {
                        return request.PathBase + internalUiRoute;
                    }
                    else
                    {
                        return internalUiRoute;
                    }
                };
            });
            return app;
        }
    }

    public class ClientRouteInfo
    {
        /// <summary>
        /// 路由标识
        /// </summary>
        public string RouteKey { get; set; }

        /// <summary>
        /// 客户端名称
        /// </summary>
        public string ClientName { get; set; }
    }
}
```

使用步骤：

1. StartUp中注入swaggerdoc文档，并且使用中间件

    ```csharp
    public void ConfigureServices(IServiceCollection services)
    {
        // 其他注入
        // 添加多版本swagger api文档支持
        services.AddNswagMultiApiDocuments();

        // 方式2
        services.AddNswagMultiClientApiDocuments(new List<ClientRouteInfo>
        {
            new ClientRouteInfo{ RouteKey="/ToB", ClientName="ToB" },
            new ClientRouteInfo{ RouteKey="/ToB/PC", ClientName="ToB-PC" },
            new ClientRouteInfo{ RouteKey="/ToB/App", ClientName="ToB-App" },

            new ClientRouteInfo{ RouteKey="/ToC", ClientName="ToC" },
            new ClientRouteInfo{ RouteKey="/ToC/WechatH5", ClientName="ToC-WechatH5" },
            new ClientRouteInfo{ RouteKey="/ToC/WechatApp", ClientName="ToC-WechatApp" }
        });
    }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env, ILogger<Startup> logger)
    {
        // 其他管道
        app.UseNswag(pathBase);
    }
    ```
1. 在Controller中使用

    ```csharp
    // ApiVersion这个属性可以添加在Controller或者Action上
    // 不添加版本标记默认为INNER版本（1）
    // 对外暴露的服务需要加上ApiVersion为OPEN的标记
    [ApiVersion(NswagExtensions.OPEN)]
    [Route("open/[controller]/[action]")]
    [ApiController]
    public class OpenController : ControllerBase
    {
    }
    ```