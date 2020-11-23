# WebApi请求出入参修改

下面展示修改时间例子

例子中的 `Timezone`, [请参考这里](./builder-fac-provider.md)

代码结构如下：

![1](http://cdn.go99.top/docs/code/dotnet/common/webapimodel1.png)


思路：

* 请求：webapi请求时会先将请求的参数先转换成 `object`，然后通过各种数据类型的 `DataBinder`将 `object` 转换成具体类型。这里就是通过重写 `DateTimeBinder`, 并且添加到 `MvcOptions` 实现时间的修改。

* 响应：mvc的 `JsonOptions` 配置中可以设置在将请求结果序列化为 `string` 的时候如果处理对应类型数据（即重写 `DateTime` 的 `Json` 反序列化配置）。

使用集成测试：https://docs.microsoft.com/zh-cn/aspnet/core/test/integration-tests?view=aspnetcore-5.0

代码如下：

```csharp
////////// 请求 /////////////////

// TimezoneDateTimeModelBinder
public class TimezoneDateTimeModelBinder : IModelBinder
{
    private readonly DateTimeStyles _supportedStyles;
    private readonly ILogger _logger;

    /// <summary>
    /// Initializes a new instance of <see cref="TimezoneDateTimeModelBinder"/>.
    /// </summary>
    /// <param name="supportedStyles">The <see cref="DateTimeStyles"/>.</param>
    /// <param name="loggerFactory">The <see cref="ILoggerFactory"/>.</param>
    public TimezoneDateTimeModelBinder(DateTimeStyles supportedStyles, ILoggerFactory loggerFactory)
    {
        if (loggerFactory == null)
        {
            throw new ArgumentNullException(nameof(loggerFactory));
        }

        _supportedStyles = supportedStyles;
        _logger = loggerFactory.CreateLogger<TimezoneDateTimeModelBinder>();
    }

    /// <inheritdoc />
    public Task BindModelAsync(ModelBindingContext bindingContext)
    {
        if (bindingContext == null)
        {
            throw new ArgumentNullException(nameof(bindingContext));
        }

        var modelName = bindingContext.ModelName;
        var valueProviderResult = bindingContext.ValueProvider.GetValue(modelName);
        if (valueProviderResult == ValueProviderResult.None)
        {
            return Task.CompletedTask;
        }

        var modelState = bindingContext.ModelState;
        modelState.SetModelValue(modelName, valueProviderResult);

        var metadata = bindingContext.ModelMetadata;
        var type = metadata.UnderlyingOrModelType;
        try
        {
            var value = valueProviderResult.FirstValue;

            object model;
            if (string.IsNullOrWhiteSpace(value))
            {
                // Parse() method trims the value (with common DateTimeSyles) then throws if the result is empty.
                model = null;
            }
            else if (type == typeof(DateTime))
            {
                var timezoneContextFactory = bindingContext.HttpContext.RequestServices.GetRequiredService<ITimezoneContextFactory>();
                var timezoneContext = timezoneContextFactory.GetTimezoneContext();
                var timezoneOffset = DefaultTimezone.BaseTimezone - timezoneContext.CurrentTimeZone;

                model = DateTime.Parse(value, valueProviderResult.Culture, _supportedStyles).AddHours(timezoneOffset);
            }
            else
            {
                throw new NotSupportedException();
            }

            // When converting value, a null model may indicate a failed conversion for an otherwise required
            // model (can't set a ValueType to null). This detects if a null model value is acceptable given the
            // current bindingContext. If not, an error is logged.
            if (model == null && !metadata.IsReferenceOrNullableType)
            {
                modelState.TryAddModelError(
                    modelName,
                    metadata.ModelBindingMessageProvider.ValueMustNotBeNullAccessor(
                        valueProviderResult.ToString()));
            }
            else
            {
                bindingContext.Result = ModelBindingResult.Success(model);
            }
        }
        catch (Exception exception)
        {
            // Conversion failed.
            modelState.TryAddModelError(modelName, exception, metadata);
        }

        return Task.CompletedTask;
    }
}

// TimezoneDateTimeModelBinderProvider

public class TimezoneDateTimeModelBinderProvider : IModelBinderProvider
{
    internal static readonly DateTimeStyles SupportedStyles = DateTimeStyles.AdjustToUniversal | DateTimeStyles.AllowWhiteSpaces;

    /// <inheritdoc />
    public IModelBinder GetBinder(ModelBinderProviderContext context)
    {
        if (context == null)
        {
            throw new ArgumentNullException(nameof(context));
        }

        var modelType = context.Metadata.UnderlyingOrModelType;
        if (modelType == typeof(DateTime))
        {
            var loggerFactory = context.Services.GetRequiredService<ILoggerFactory>();
            return new TimezoneDateTimeModelBinder(SupportedStyles, loggerFactory);
        }

        return null;
    }
}

// TimezoneDateTimeMvcOptionsExtensions

public static class TimezoneDateTimeMvcOptionsExtensions
{
    /// <summary>
    /// 添加DateTime模型绑定转换
    /// 其他时区 转换 东八区
    /// </summary>
    /// <param name="options"></param>
    public static void AddDateTimeModelBinderProvider(this MvcOptions options)
    {
        if(options is null)
        {
            throw new ArgumentNullException(nameof(options));
        }

        options.ModelBinderProviders.Insert(0, new TimezoneDateTimeModelBinderProvider());
    }
}

///////// 响应 /////////////////

// TimezoneDateTimeConverter

public class TimezoneDateTimeConverter : JsonConverter<DateTime>
{
    private readonly IServiceProvider _serviceProvider;

    public TimezoneDateTimeConverter(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) => throw new NotImplementedException();

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        if (writer is null) return;

        var timezoneContextFactory = _serviceProvider.GetRequiredService<ITimezoneContextFactory>();
        var timezoneContext = timezoneContextFactory.GetTimezoneContext();
        var timezoneOffset = timezoneContext.CurrentTimeZone - DefaultTimezone.BaseTimezone;

        writer.WriteStringValue(value.AddHours(timezoneOffset));
    }
}

// JsonPostConfigureOptions
// 这里的 JsonOptions 在 Microsoft.AspNetCore.Mvc 命名空间下
public class JsonPostConfigureOptions : IPostConfigureOptions<JsonOptions>
{
    private readonly IServiceProvider _serviceProvider;

    public JsonPostConfigureOptions(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public void PostConfigure(string name, JsonOptions options)
    {
        if(options is null)
        {
            throw new ArgumentNullException(nameof(options));
        }

        options.JsonSerializerOptions.Converters.Add(new TimezoneDateTimeConverter(_serviceProvider));
    }
}

// OptionsServiceCollectionExtensions

public static class OptionsServiceCollectionExtensions
{
    /// <summary>
    /// 添加JsonOptions配置
    /// </summary>
    /// <param name="services"></param>
    /// <returns></returns>
    public static IServiceCollection AddJsonPostConfigureOptions(this IServiceCollection services)
    {
        services.TryAddEnumerable(ServiceDescriptor.Transient<IPostConfigureOptions<JsonOptions>, JsonPostConfigureOptions>());

        return services;
    }
}
```