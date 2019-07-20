# Docker-Compose运行Nginx+Redis+NetCoreAPI

## 一、准备Docker-Compose

### Docker
开始安装Docker-compose之前你需要先确认已经安装了Docker

Docker安装可以参考我之前的【Docker安装教程】：https://blog.go99.top/2019/04/09/docker-install/

也可以参考官网教程安装：https://docs.docker.com/install/

### 安装Docker-compose

* 参考官网：https://docs.docker.com/compose/install/

1. 安装
```bash
sudo curl -L "https://github.com/docker/compose/releases/download/1.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
```
2. 修改`docker-compose`权限，确保当前用户有执行权限
```bash
sudo chmod +x /usr/local/bin/docker-compose
```

3. 测试是否安装成功
```bash
$ docker-compose --version
docker-compose version 1.24.0, build 0aa59064
```

4. 如果没有成功，可以尝试下面操作，`docker-compose`建立软连接到`/usr/bin`目录
```bash
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
```


## 二、准备NetCoreAPI项目

1. 创建api项目
    ```bash
    dotnet new webpai -n composeAPI --no-https
    ```
1. 演示项目中我们涉及了`Redis`操作，所以先引入`Redis`程序包
    ```bash
    dotnet add package Microsoft.Extensions.Caching.StackExchangeRedis
    ```
1. 修改`appsettings.json`,加入`redis`连接字符串配置（注意这里有密码，需要后续修改redis配置文件的访问密码）
    ```json
    {
        "ConnectionStrings": {
            // 这里需要注意，server的名称需要与docker-compose.yml文件中的services名称一致
            "Redis": "redis-service:6379,password=test123"
        }
    }
    ```
1. 修改`StartUp.cs`注入`Redis`服务
    ```csharp
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_2_2);

        services.AddStackExchangeRedisCache(options => {
            options.Configuration = Configuration.GetConnectionString("Redis");
        });

        services.AddHttpContextAccessor();
    }
    ```
1. 修改`ValuesController`内容，到时候在使用nginx访问网站的时候区分放到的是哪个服务

    ```csharp
    [HttpGet("{name}")]
    public ActionResult<string> Get(string name)
    {
        var connection = _httpContextAccessor.HttpContext.Connection;
        var ipv4 = connection.LocalIpAddress.MapToIPv4().ToString();
        var cacheKey = $"test:{name}";
        _distributedCache.SetString(cacheKey, $"{ipv4}  {name}");
        var message = _distributedCache.GetString(cacheKey);

        return message;
    }
    ```

1. 创建`Dockerfile`（打包api项目镜像使用）
    ```dockerfile
    FROM microsoft/dotnet:2.2-sdk AS build
    WORKDIR /src
    COPY . ./
    RUN dotnet restore
    RUN dotnet publish -c Release -o out

    FROM microsoft/dotnet:2.2-aspnetcore-runtime
    WORKDIR /app
    COPY --from=build /src/out .
    ENTRYPOINT [ "dotnet", "composeAPI.dll" ]
    ```
1. 创建`docker-compose.yml`配置文件
    * 查看`version`地址：https://docs.docker.com/compose/compose-file/compose-versioning/ 里面有docker与compose对应关系
    * `docker-compose`配置可以参考：https://docs.docker.com/compose/compose-file/
    ```yml
    version: "3.7"
    services: 
    web-service:
        container_name: composeapi
        build: 
        context: .
        dockerfile: Dockerfile
        restart: always
        ports: 
        - "10001:80"
        volumes: 
        - ./appsettings.json:/app/appsettings.json
    web-service-2:
        container_name: composeapi-2
        depends_on: 
        - web-service
        image: composeapi_web-service
        restart: always
        ports: 
        - "10002:80"
        volumes: 
        - ./appsettings.json:/app/appsettings.json
    web-service-3:
        container_name: composeapi-3
        depends_on:
        - web-service
        image: composeapi_web-service
        restart: always
        ports: 
        - "10003:80"
        volumes: 
        - ./appsettings.json:/app/appsettings.json
    nginx-service:
        container_name: composeapi-nginx
        image: nginx
        restart: always
        ports: 
        - "80:80"
        volumes: 
        - ./conf/nginx.conf:/etc/nginx/conf.d/default.conf
    redis-service:
        container_name: composeapi-redis
        image: redis
        restart: always
        ports: 
        - "6379:80"
        volumes: 
        - ./conf/redis.conf:/etc/redis/redis.conf
    ```
    上面的配置文件中一共包含了5个服务：  
    * 3个webapi服务（由于webapi服务所依赖的镜像都是一样的，所以后面2个我直接使用第一个服务创建出来的镜像，`docker-compose`创建出来的镜像名称格式`project_service`）
    * 1个redis服务，直接使用redis镜像
    * 1个nginx服务，直接使用nginx镜像（反向代理3个webapi服务，实现负载均衡）
1. 创建`nginx`配置文件：
    * 在上一步`docker-compose.yml`文件中我们看到，需要将`./conf/nginx.conf`文件映射到容器的nginx默认配置文件，方便后续维护nginx配置，不然每次修改配置文件都需要进入docker容器再修改比较麻烦。

    新建文件
    ```bash
    mkdir conf && cd conf
    touch nginx.conf
    ```
    `nginx.conf`添加如下配置内容：
    ```conf
    upstream composeapi {
        # 这里需要注意，server的名称需要与docker-compose.yml文件中的services名称一致
        server web-service:80;
        server web-service-2:80;
        server web-service-3:80;
    }

    server {
        listen 80;
        location / {
            proxy_pass http://composeapi;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
    ```
1. `redis`配置文件：
    
    直接到官网拉取基本配置文件：
    ```bash
    wget http://download.redis.io/redis-stable/redis.conf
    ```
    查找`requirepass`配置文件，删除注释，密码修改成与`webapi`项目中的一直，我这边是`test123`
1. OK，所有准备工作都已经完毕，使用`docker-compose`跑起来
    ```bash
    docker-compose up -d
    # 如果提示没有权限，加上sudo
    sudo docker-compose up -d
    # 运行结果
    Creating composeapi-nginx ... done
    Creating composeapi-redis ... done
    Creating composeapi       ... done
    Creating composeapi-2     ... done
    Creating composeapi-3     ... done
    ```

## 三、查看运行结果

1. `docker-compose`状态
    ```bash
    sudo docker-compose ps

    Name                    Command               State               Ports             
    ------------------------------------------------------------------------------------------
    composeapi         dotnet composeAPI.dll            Up      0.0.0.0:10001->80/tcp         
    composeapi-2       dotnet composeAPI.dll            Up      0.0.0.0:10002->80/tcp         
    composeapi-3       dotnet composeAPI.dll            Up      0.0.0.0:10003->80/tcp         
    composeapi-nginx   nginx -g daemon off;             Up      0.0.0.0:80->80/tcp            
    composeapi-redis   docker-entrypoint.sh redis ...   Up      6379/tcp, 0.0.0.0:6379->80/tcp
    ```
1. 网站访问情况（直接使用浏览器打开，我这里的地址是`http://172.16.102.111/api/values/hello`）
    ```bash
    172.18.0.3  hello
    172.18.0.5  hello
    172.18.0.6  hello
    ```
    * 上面的结果每次刷新都会循环显示

## 总结

总体来说使用docker-compose部署多容器应用还是比较简单的，看完文档自己动手去实践一下会理解的更加深刻。

本次测试的代码我已经上传到`Github`地址：https://github.com/yasewang987/Hz.DonetDemo/tree/master/composeAPI

