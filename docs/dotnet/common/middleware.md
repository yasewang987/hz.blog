# NetCore API自定义中间件

使用场景一般为简单项目的api授权验证

## 修改返回信息

添加自定义中间件MyMiddleWare,修改内容如下即可

```csharp
public class MyMiddleware
{
    private readonly RequestDelegate _next;

    public MyMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    // config加入依赖注入
    public async Task Invoke(HttpContext httpContext, MyConfig config)
    {
        if(httpContext.Request.Headers["clientId"] != config.ClientId)
        {
            httpContext.Response.StatusCode = 401;
            httpContext.Response.ContentType="json";
            using(StreamWriter sw = new StreamWriter(ctx.HttpContext.Response.Body))
            {
                sw.Write("{ \"code\": 401, \"message\": \"未授权\"}");
            }
            return; // 直接return就不需要执行后面的管道了
        }
        await next();
    }
}

// 中间件使用封装
public static IApplicationBuilder UseException(this IApplicationBuilder app)
{
    return app.UseMiddleware<ExceptionMiddleware>();
}
```