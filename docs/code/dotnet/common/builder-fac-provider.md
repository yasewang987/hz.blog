# Builder,Factory,Provider区别

这里只介绍在 dotnet 中的定义

## 介绍

* `Provider`: 创建单一对象的，只支持一种方式创建（一种方式对应一个 `Provider`）。
* `Factory`: 创建某个对象，主要是为了屏蔽多种方式（`Provider`）创建对象的细节。工厂里面会有多种创建对象的方式（`Provider`），并且会有一个创建对象的方法（里面包含了如何选择某个创建方式去创建对象）。
* `Builder`: 将多种对象的创建方式（`Provider`）组合起来，放入特定的位置，工厂(`Factory`)中就可以直接使用了，使工厂可以不用关心对象创建方式（`Provider`）如何加入管理。

## 关联

* `Privider`：只关心 `对象` 如何创建
* `Factory`: 只关心 `Provider` 如何使用
* `Builder`: 只关心 `Provider` 如何管理

## dotnet代码示例

下面是一个时区上下文的目录结构

![1](http://cdn.go99.top/docs/code/dotnet/common/builderfacprovider1.png-mark)

每个文件对应代码展示

* Xiaobao.Extensions.Timezone.Context.Abstractions

```csharp
// TimezoneContext
public class TimezoneContext
{
    public const int BaseTimezone = 8;
    public int CurrentTimeZone { get; set; }
}

// DefaultTimezoneContextProvider
public class DefaultTimezoneContextProvider
{
    public TimezoneContext GetTimezoneContext()
    {
        return new TimezoneContext() { CurrentTimeZone = TimezoneContext.BaseTimezone };
    }
}

// ITimezoneContextProvider
public interface ITimezoneContextProvider
{
    /// <summary>
    /// 获取时区上下文
    /// </summary>
    /// <returns></returns>
    TimezoneContext GetTimezoneContext();
}

// ITimezoneContextFactory
public interface ITimezoneContextFactory
{
    /// <summary>
    /// 获取时区上下文
    /// </summary>
    /// <returns></returns>
    TimezoneContext GetTimezoneContext();
}

// ITimezoneContextBuilder
public interface ITimezoneContextBuilder
{
    IServiceCollection Services { get; }
}
```

* Xiaobao.Extensions.Timezone.Context

```csharp
// TimezoneContextFactory
public class TimezoneContextFactory : ITimezoneContextFactory
{
    private readonly IEnumerable<ITimezoneContextProvider> _timezoneContextProviders;
    
    public TimezoneContextFactory(IEnumerable<ITimezoneContextProvider> timezoneContextProviders)
    {
        _timezoneContextProviders = timezoneContextProviders;
    }

    public TimezoneContext GetTimezoneContext()
    {
        foreach(var provider in _timezoneContextProviders)
        {
            var timezoneContext = provider.GetTimezoneContext();

            if (timezoneContext != null)
            {
                return timezoneContext;
            }
        }

        return null;
    }
}

// TimezoneContextBuilder
public class TimezoneContextBuilder : ITimezoneContextBuilder
{
    public IServiceCollection Services { get; }

    public TimezoneContextBuilder(IServiceCollection services)
    {
        Services = services;
    }
}

// TimezoneServiceCollectionExtensions
public static class TimezoneServiceCollectionExtensions
{
    public static IServiceCollection AddTimezoneContext(this IServiceCollection services) => services.AddTimezoneContext(builderAction => { });
    /// <summary>
    /// 注入时区相关服务
    /// </summary>
    /// <param name="services"></param>
    /// <param name="builderAction"></param>
    /// <returns></returns>
    public static IServiceCollection AddTimezoneContext(this IServiceCollection services, Action<ITimezoneContextBuilder> builderAction)
    {
        if(services == null)
        {
            throw new ArgumentNullException(nameof(services));
        }

        builderAction?.Invoke(new TimezoneContextBuilder(services));

        services.TryAdd(ServiceDescriptor.Singleton<ITimezoneContextFactory, TimezoneContextFactory>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<ITimezoneContextProvider, DefaultTimezoneContextProvider>());
        services.TryAdd(ServiceDescriptor.Scoped(sp => sp.GetRequiredService<ITimezoneContextFactory>().GetTimezoneContext()));

        return services;
    }
}
```

* Xiaobao.Extensions.Timezone.Context.Header

```csharp
// HeaderTimezoneContextProvider

public class HeaderTimezoneContextProvider : ITimezoneContextProvider
{
    private const string HEADER_KEY = "timezone";
    private readonly IHttpContextAccessor _httpContext;
    
    public HeaderTimezoneContextProvider(IHttpContextAccessor httpContext)
    {
        _httpContext = httpContext;
    }

    public TimezoneContext GetTimezoneContext()
    {
        var headerTimezone = _httpContext?.HttpContext?.Request?.Headers?[HEADER_KEY];
        if(headerTimezone.HasValue && int.TryParse(headerTimezone.Value, out int timezone))
        {
            return new TimezoneContext() { CurrentTimeZone = timezone };
        }

        return null;
    }
}

// TimezoneContextBuilderExtensions

public static class TimezoneContextBuilderExtensions
{
    /// <summary>
    /// 注入请求头获取时区
    /// </summary>
    /// <param name="builder"></param>
    /// <returns></returns>
    public static ITimezoneContextBuilder AddHeader(this ITimezoneContextBuilder builder)
    {
        if(builder == null)
        {
            throw new ArgumentNullException(nameof(builder));
        }

        builder.Services.TryAddSingleton<IHttpContextAccessor, HttpContextAccessor>();
        builder.Services.TryAddEnumerable(ServiceDescriptor.Singleton<ITimezoneContextProvider, HeaderTimezoneContextProvider>());

        return builder;
    }
}
```

* Xiaobao.Extensions.Timezone.Context.ClaimsPrincipal

```csharp
// ClaimsPrincipalTimezoneContextProvider
public class ClaimsPrincipalTimezoneContextProvider : ITimezoneContextProvider
{
    private const string CLAIM_TYPE_NAME = "Timezone";
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ClaimsPrincipalTimezoneContextProvider(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public TimezoneContext GetTimezoneContext()
    {
        var claim = _httpContextAccessor?.HttpContext?.User?.Claims.FirstOrDefault(i => string.Equals(CLAIM_TYPE_NAME, i.Type, StringComparison.CurrentCultureIgnoreCase));

        if(claim != null && int.TryParse(claim.Value, out int timezone))
        {
            return new TimezoneContext { CurrentTimeZone = timezone };
        }

        return null;
    }
}

// TimezoneContextBuilderExtensions
public static class TimezoneContextBuilderExtensions
{
    /// <summary>
    /// 注入用户身份中获取时区
    /// </summary>
    /// <param name="builder"></param>
    /// <returns></returns>
    public static ITimezoneContextBuilder AddClaimsPrincipal(this ITimezoneContextBuilder builder)
    {
        if(builder is null)
        {
            throw new ArgumentNullException(nameof(builder));
        }

        builder.Services.TryAddSingleton<IHttpContextAccessor, HttpContextAccessor>();
        builder.Services.TryAddEnumerable(ServiceDescriptor.Singleton<ITimezoneContextProvider, ClaimsPrincipalTimezoneContextProvider>());

        return builder;
    }
}
```