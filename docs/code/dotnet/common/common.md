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

## Task.Yield

* 作用：`await Task.Yield()`的作用是直接在进入异步方法的时候立即释放主线程【await 后面的代码是另外的线程去执行的】

* 示例：

    ```csharp
    static void TaskYield()
    {
        Task[] tasks = new Task[20];
        for(int i=0; i< tasks.Length; i++)
        {
            tasks[i] = new Task(_NormalAction, i);
        }

        for(int i=0; i<10; i++)
        {
            tasks[i].Start();
        }
        GotoMyAction();

        for(int i=10; i<tasks.Length; i++)
        {
            tasks[i].Start();
        }

        Thread.Sleep(200000);
    }

    private static void _NormalAction(object number)
    {

        Console.WriteLine($"start {number} NormalAction");
        Thread.Sleep(1000);
        Console.WriteLine($"end {number} NormalAction");
    }

    private static async Task _MyAction()
    {
        await Task.Run(() => {
            Console.WriteLine("start MyAction");
            Thread.Sleep(1000);
            Console.WriteLine("end MyAction");
        });
    }

    private static void _WaitMyFriend(int friendNumber)
    {
        Console.WriteLine("Start WaitMyFriend");

        for(int i=0; i<friendNumber; i++)
        {
            for(int j=0; j<1000000; j++)
            {}
            Console.WriteLine($"Number {i} friend Join");
        }

        Console.WriteLine("End WaitMyFriend");
    }

    static async Task GotoMyAction()
    {
        Console.WriteLine("I'm Coming");
        await Task.Yield();
        _WaitMyFriend(5);
        await _MyAction();
    }
    ```

* 运行结果：

    ```bash
    start 2 NormalAction
    start 1 NormalAction
    start 3 NormalAction
    start 0 NormalAction
    I'm Coming
    start 4 NormalAction
    end 2 NormalAction
    end 0 NormalAction
    end 1 NormalAction
    start 6 NormalAction
    end 3 NormalAction
    start 7 NormalAction
    start 8 NormalAction
    start 5 NormalAction
    end 4 NormalAction
    start 9 NormalAction
    Start WaitMyFriend
    Number 0 friend Join
    Number 1 friend Join
    Number 2 friend Join
    Number 3 friend Join
    Number 4 friend Join
    End WaitMyFriend
    start MyAction
    end 8 NormalAction
    end 6 NormalAction
    end 5 NormalAction
    start 11 NormalAction
    start 12 NormalAction
    end 7 NormalAction
    start 10 NormalAction
    start 13 NormalAction
    end 9 NormalAction
    start 14 NormalAction
    start 15 NormalAction
    end MyAction
    start 16 NormalAction
    end 11 NormalAction
    start 17 NormalAction
    end 12 NormalAction
    end 10 NormalAction
    start 18 NormalAction
    start 19 NormalAction
    end 13 NormalAction
    end 14 NormalAction
    end 15 NormalAction
    end 16 NormalAction
    end 19 NormalAction
    end 18 NormalAction
    end 17 NormalAction
    ```


## Yield Return Break

* 作用：依次返回结果(下次进入方法位置为上次`yield return`的位置)，返回的类型为`IEnumerator`

* 示例代码：

  ```csharp
  static void Main(string[] args)
  {
      var test = YieldTest();
      foreach(var item in test)
      {
          Console.WriteLine(item);
      }
      var test2 = YieldTest2();
      while(test2.MoveNext())
      {
          Console.WriteLine(test2.Current);
      }
  }
  static IEnumerable<int> YieldTest()
  {
      yield return 1;
      yield return 2;
      yield return 3;
      yield break;
      yield return 4;
  }

  static IEnumerator<int> YieldTest2()
  {
      yield return 1;
      yield return 2;
  }
  ```

* 运行结果：

  ```
  1
  2
  3
  1
  2
  ```

## Parallel

* 作用：并行执行

* 示例代码：

  ```csharp
  static void Main(string[] args)
  {
      ParallelTest();
  }

  static void ParallelTest()
  {
      var list = Enumerable.Range(1, 20);
      Parallel.ForEach(list, (item) => {
          Thread.Sleep(1000);
          Console.WriteLine(item);
      });
  }
  ```

* 运行结果：

  ```
  4
  1
  5
  2
  3
  6
  8
  9
  10
  11
  7
  12
  13
  14
  16
  15
  17
  18
  19
  20
  ```


