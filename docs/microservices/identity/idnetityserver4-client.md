# 认证授权（客户端授权）

## IdentityServer简介

IdentityServer是将符合规范的OpenID Connect和OAuth 2.0端点添加到任意ASP.NET核心应用程序的中间件，通常，您构建（或重新使用）一个包含登录和注销页面的应用程序（可能还包括同意，具体取决于您的需要），IdentityServer中间件向其添加必要的协议头，以便客户端应用程序可以使用这些标准协议与之对话。

### 资源定义

client：客户端，从identityServer请求令牌，用户对用户身份校验，客户端必须先从identityServer中注册，然后才能请求令牌。
 
sources：每个资源都有自己唯一的名称，就是文中所定义的api1服务名称，indentity会验证判定是否有访问该资源的权限。

access Token：访问令牌，由identityServer服务器签发的，客户端使用该令牌进行访问拥有权限的api

### 授权模式（GrantType）

客户端模式(client_credentials)  
密码模式(password)  
授权码模式(authorization_code)  
简化模式(implicit)

## 授权服务端配置

这篇文章就介绍一下客户端模式的简单使用  
官网地址：https://identityserver4.readthedocs.io/en/latest/quickstarts/1_client_credentials.html

1. 新建IdentityServer服务端项目：
    ```bash
    dotnet new webapi -n Hz.IdentityServer --no-https
    ```
1. 添加`IdentityServer4`引用：
    ```bash
    dotnet add package IdentityServer4
    ```
1. 添加资源配置类`IdentityConfig.cs`：
    ```csharp
    public class IdentityConfig
    {
        public static IEnumerable<ApiResource> GetResources()
        {
            return new List<ApiResource>{
                new ApiResource("api1","HzAPI1")
            };
        }

        public static IEnumerable<Client> GetClients()
        {
            return new List<Client> {
                new Client {
                    ClientId = "client1",
                    AllowedGrantTypes = GrantTypes.ClientCredentials,
                    ClientSecrets = {
                        new Secret("hz".Sha256())
                    },
                    AllowedScopes = {"api1"}
                }
            };
        }
    }
    ```

1. 修改`StartUp.cs`文件：
    ```csharp
    // 注入授权服务
    public void ConfigureServices(IServiceCollection services)
    {
        //services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_2_2);

        services.AddIdentityServer()
        .AddInMemoryApiResources(IdentityConfig.GetResources())
        .AddInMemoryClients(IdentityConfig.GetClients())
        .AddDeveloperSigningCredential();
    }

    // 启用授权管道
    public void Configure(IApplicationBuilder app, IHostingEnvironment env)
    {
        if (env.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
        }
        app.UseIdentityServer();
        //app.UseMvc();
    }
    ```
1. 查看配置发现文档： http://localhost:5000/.well-known/openid-configuration
    ![img](http://cdn.go99.top/docs/microservices/identity/client1.png)
1. 使用`Postman`测试获取`access_token`
    ![img](http://cdn.go99.top/docs/microservices/identity/client2.png)
    > 注意body中的参数

## 测试webapi资源服务

1. 创建webapi资源服务：
    ```bash
    dotnet new webapi -n Hz.Api1
    ```
1. 修改`StartUp.cs`：
    ```csharp
    // 注入认证服务
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_2_2);

        // 注入认证服务
        services.AddAuthentication("Bearer")
        .AddJwtBearer("Bearer", config => {
            config.Authority = "http://localhost:5000";
            config.RequireHttpsMetadata=false;
            config.Audience = "api1";
        });
        // 如果使用下面这个需要引用【IdentityServer4.AccessTokenValidation】
        // .AddIdentityServerAuthentication(o => {
        //     o.Authority = "http://localhost:5000";
        //     o.ApiName = "api1";
        //     o.RequireHttpsMetadata = false;
        // });
    }
    
    // 启用认证管道
    public void Configure(IApplicationBuilder app, IHostingEnvironment env)
    {
        if (env.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
        }
        // 添加认证管道
        app.UseAuthentication();
        app.UseMvc();
    }
    ```
1. 在控制器里添加`Authorize`标记
    ```csharp
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ValuesController : ControllerBase
    {
        // GET api/values
        [HttpGet]
        public ActionResult<IEnumerable<string>> Get()
        {
            return new string[] { "value1", "value2" };
        }
        ...
    }
    ```
1. `Postman`访问测试
    
    未认证：
    ![img](http://cdn.go99.top/docs/microservices/identity/client3.png)
    认证后：
    ![img](http://cdn.go99.top/docs/microservices/identity/client4.png)

## 测试客户端

1. 创建访问客户端：
    ```bash
    dotnet new console -n Hz.Client
    ```
1. 引用`Identity`客户端程序包：
    ```bash
    dotnet add package IdentityModel
    ```
1. 客户端测试代码:
    ```csharp
    static async Task TestIdentity()
    {
        var client = new HttpClient();

        // 从元数据中发现endpoints
        var discovery = await client.GetDiscoveryDocumentAsync("http://localhost:5000");
        if(discovery.IsError)
        {
            Console.WriteLine(discovery.Error);
            return;
        }

        // 请求token            
        var tokenReseponse = await client.RequestClientCredentialsTokenAsync(new ClientCredentialsTokenRequest{
            Address = discovery.TokenEndpoint,
            ClientId = "client1",
            ClientSecret = "hz",
            Scope = "api1"
        });
        if(tokenReseponse.IsError)
        {
            Console.WriteLine(tokenReseponse.Error);
        }

        Console.WriteLine(tokenReseponse.Json);

        // 访问api
        client.SetBearerToken(tokenReseponse.AccessToken);
        var apiResult = await client.GetAsync("http://localhost:5001/api/values");
        if(!apiResult.IsSuccessStatusCode)
        {
            Console.WriteLine(apiResult.StatusCode);
        } else {
            var content = await apiResult.Content.ReadAsStringAsync();
            Console.WriteLine(content);
        }
    } 
    ```
1. 运行结果：
    ![img](http://cdn.go99.top/docs/microservices/identity/client5.png)

## 总结

客户端授权模式使用下来其实很简单，自己跟着写一次基本上就明白如何使用了。  