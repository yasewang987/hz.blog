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