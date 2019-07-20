# Ocelot添加自定义Middleware

修改Startup.cs文件的Configure方法

```csharp
public void Configure(IApplicationBuilder app, IHostingEnvironment env)
{
    app.UseOcelot(config => {
        config.PreQueryStringBuilderMiddleware = async (ctx, next) => {
            if(ctx.HttpContext.Request.Headers["clientId"] != "test")
            {
                ctx.HttpContext.Response.StatusCode = 401;
                ctx.HttpContext.Response.ContentType="json";
                using(StreamWriter sw = new StreamWriter(ctx.HttpContext.Response.Body))
                {
                    sw.Write("{ \"code\": 401, \"message\": \"未授权\"}");
                }
                return; // 直接返回不执行后面中间件逻辑
            }
            await next();
        };
    }).Wait();
}
```
