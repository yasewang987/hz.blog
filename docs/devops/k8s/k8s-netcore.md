# K8s-从0开始部署AspNet.Core

## 一、准备镜像
1. 准备k8s集群，如果单机部署可以[参考我的部署教程](./k8s-install.md)

1. 新建webapi项目:

    ```bash
    dotnet new webapi k8stest --no-https
    ```
1. 在项目的根目录添加`docker`配置文件，文件内容如下：

    ```dockerfile
    FROM mcr.microsoft.com/dotnet/core/aspnet:2.2 AS base
    WORKDIR /app
    EXPOSE 80

    FROM mcr.microsoft.com/dotnet/core/sdk:2.2 AS build
    WORKDIR /src
    COPY ["k8stest.csproj", "./"]
    RUN dotnet restore "./k8stest.csproj"
    COPY . .
    WORKDIR "/src/."
    RUN dotnet build "k8stest.csproj" -c Release -o /app

    FROM build AS publish
    RUN dotnet publish "k8stest.csproj" -c Release -o /app

    FROM base AS final
    WORKDIR /app
    COPY --from=publish /app .
    ENTRYPOINT ["dotnet", "k8stest.dll"]
    ```
1. docker镜像仓库准备，可以直接在 [docker官方镜像仓库](https://hub.docker.com) 注册账户
1. 生成镜像，并上传到docker仓库

    ```bash
    # 生成镜像
    docker build -t 你的docker仓库用户名/k8stest:v1

    # 登录docker仓库
    docker login -u 你的docker仓库用户名 -p 密码

    # 上传镜像
    docker push 你的docker仓库用户名/k8stest:v1
    ```

至此完成已经完成了所有的准备工作

## 二、Pod

Kubernetes最基础的对象就是`Pod`,Pod是Kubernetes集群中运行部署应用的最小单元,一个Pod里面可以包含多个容器，Pod的设计理念是支持多个容器在一个Pod中共享网络地址和文件系统，可以通过进程间通信和文件共享这种简单高效的方式组合完成服务。

接下来开始准备在k8s中运行`Asp.Net Core`

1. 准备yaml文件k8stest.yaml

    ```yaml
    apiVersion: v1
    kind: Pod
    metadata:
      name: k8stest # 资源名称
      labels:
        app: k8stest # 资源标签，后续筛选会用到
    spec:
      containers:
        - name: k8stest
          image: 你的docker仓库用户名/k8stest:v1
          ports:
            - containerPort: 80
    ```

1. k8s中运行这个pod

    ```bash
    kubectl create -f k8stest.yaml
    # pod "k8stest" created

    # 如果上传的创建命令报错,可以加上参数忽滤
    # error validating "k8stest1.yaml"
    kubectl create -f k8stest.yaml --validate=false
    ```
1. 查看k8s集群的pods列表

    ```bash
    kubectl get pods
    # NAME                           READY   STATUS    RESTARTS   AGE
    # k8stest                       1/1     Running   0          65s
    
    # 运行成功之后也可以通过查看docker容器运行状态看到容易已经运行
    docker ps
    ```
1. 访问应用程序查看是否成功

    ```bash
    # 如果进入docker容器里面可以使用如下命令查看
    curl http://127.0.0.1/api/values

    # 宿主机访问应用程序需要通过代理
    kubectl port-forward k8stest 11111:80
    # 宿主机运行如下命令
    curl http://127.0.0.1:11111/api/values
    # 如果上面的命令报错：unable to do port forwarding: socat not found.
    # 需要安装socat
    yum install -y socat
    ```

* 不过，端口转发的方式只能在本机访问，为了从外部访问应用程序，我们需要创建Kubernetes中的另外一种资源：Service。

## 三、Service

Kubernetes中的Service资源可以作为一组提供相同服务的Pod的入口，这个资源肩负发现服务和平衡Pod之间负荷的重任,Service通过标签Labels来筛选Pod。

1. 前面的yaml文件里面可以查看pod的label，如果不知道可以通过命令查看Pod标签

    ```bash
    kubectl get pods --show-labels
    ```
1. 现在为刚才的pod创建一个service，`k8stest-service.yaml`：

    ```yaml
    apiVersion: v1
    kind: Service
    metadata:
        name: k8stest-service
    spec:
        selector: # 标签选择器
            app: k8stest
    ports:
        - protocol: TCP  # 协议类型
          port: 80  # Service访问的端口
          targetPort: 80 # Service转发请求的端口
          nodePort: 31111
    type: NodePort # 使用NodePort访问
    ```

    `type`有如下4中类型：
    * ClusterIP：默认值，通过集群的内部IP暴露服务，该模式下，服务只能够在集群内部可以访问
    * NodePort：通过每个Node上的IP和静态端口（NodePort）暴露服务，NodePort服务会路由到ClusterIP服务，这个ClusterIP服务会自动创建
    * LoadBalancer：使用云提供商的负载均衡器，可以向外部暴露服务，外部的负载均衡器可以路由到NodePort服务和ClusterIP服务
    * ExternalName：通过返回CNAME和它的值，可以将服务映射到externalName字段的内容（如：foo.bar.example.com）。没有任何类型代理被创建，这只有 Kubernetes 1.7 或更高版本的kube-dns才支持

1. 在k8s上创建这个service：

    ```bash
    kubectl create -f k8stest-service.yaml
    # service "k8stest-service" created

    # 查看service运行状态
    kubectl get services
    # NAME               TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)        AGE
    # k8stest-service   NodePort    10.105.132.214   <none>        80:31111/TCP   10s
    ```
    * 如上，它有一个CLUSTER-IP为10.105.132.214，因此我们可以在集群内使用10.105.132.214:80来访问该服务，如果是在集群外部，可以使用NodeIP:30000来访问

## 四、服务负载均衡

上面介绍service的时候已经知道，service是通过labels来筛选pod的，那要通过service实现负载均衡只需要再添加一个label与前面一样的pod即可。

1. 新建yaml文件
    
    ```yaml
    # k8stest1.yaml
    apiVersion: v1
    kind: Pod
    metadata:
      name: k8stest1
    labels:
      app: k8stest
    spec:
      containers:
        - name: k8stest
          image: 你的docker仓库用户名/k8stest:v1
          ports:
            - containerPort: 80
    ```
1. 启动pod

    ```bash
    kubectl create -f k8stest1.yaml
    # pod "k8stest1" created

    kubectl get pods
    # 会看到已经有2个pod处于运行状态
    ```
1. 通过dashboard可以查看pod运行情况，直接在dashboard上连接到容器测试服务是否正常运行

    ```bash
    curl http://127.0.0.1/api/values
    ```
1. 通过dashboard查看`服务`，会看到该服务下面已经存在2个pod，`k8stest`, `k8stest1`

## 五、Deployment

前面使用pod部署感觉是不是和docker部署差不多，并且回滚也不是很方便，并不能体现k8s的优势。

其实在k8s中很少会直接使用pod的方式去部署应用，更多更常用的是使用`deployment`部署。

Deployment表示用户对Kubernetes集群的一次更新操作。可以是创建一个新的服务或是更新一个新的服务，也可以是滚动升级一个服务。Deployment可以帮助每一个应用程序的生命都保持相同的一点：那就是变化。此外，只有挂掉的应用程序才会一尘不变，否则，新的需求会源源不断地涌现，更多代码会被开发出来、打包以及部署，这个过程中的每一步都有可能出错。Deployment可以自动化应用程序从一版本升迁到另一版本的过程，并保证服务不间断，如果有意外发生，它可以让我们迅速回滚到前一个版本。

下面开始使用`deployment`来部署`pod`，实现不间断服务。

1. 创建`k8stest-deployment.yaml`，内容如下：

    ```yaml
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: k8stest-deployment
      labels:
        app: k8stest-deployment
    spec:  # 定义资源的状态
      replicas: 2 # 定义我们想运行多少个Pod
      selector:
        matchLabels: # 定义该部署匹配哪些Pod
          app: k8stest
      minReadySeconds: 5 # 可选，指定Pod可以变成可用状态的最小秒数，默认是0
      strategy: # 指定更新版本时，部署使用的策略
        type: RollingUpdate # 策略类型，使用RollingUpdate可以保证部署期间服务不间断
        rollingUpdate:
          maxUnavailable: 1 # 部署更新时最大允许停止的Pod数量（与replicas相比）
          maxSurge: 1 # 部署更新时最大允许创建的Pod数量（与replicas相比）
    template: # 用来指定Pod的模板，与Pod的定义类似
        metadata:
          labels: # 根据模板创建的Pod会被贴上该标签，与上面的matchLabels对应
            app: k8stest
          spec:
          containers:
            - name: k8stest
            image: 你的docker仓库用户名/k8stest:v1
            imagePullPolicy: Always # 默认是IfNotPresent，如果设置成Always，则每一次部署都会重新拉取容器映像（否则，如果本地存在指定的镜像版本，就不会再去拉取）
            ports:
                - containerPort: 80
    ```
1. 运行`deployment`

    ```bash
    kubectl create -f k8stest-deployment.yaml --validate=false
    # deployment "k8stest-deployment" created

    # 查看是否运行
    kubectl get deplpoyments

    # 查看pod
    kubectl get pods
    # NAME                                  READY     STATUS              RESTARTS   AGE
    # k8stest                               1/1       Running             0          1d
    # k8stest-deployment-84d64dd896-5v9mr   1/1       Running             0          30s
    # k8stest-deployment-84d64dd896-rssbm   0/1       ContainerCreating   0          30s
    # k8stest1                              1/1       Running             0          13h
    # k8stest111-6f7b5c448c-wlqmr           1/1       Running             0          1d
    ```

    可以看到通过deploy创建了2个pod，就是以`k8stest-deployment-`开头的2个pod。

1. 删除其中一个pod，测试deployment的自动恢复功能

    ```bash
    kubectl delete pod k8stest-deployment-84d64dd896-5v9mr
    # pod "k8stest-deployment-84d64dd896-5v9mr" deleted

    kubectl get pods
    #NAME                                  READY     STATUS              RESTARTS   AGE
    # k8stest                               1/1       Running             0          1d
    # k8stest-deployment-84d64dd896-rssbm   1/1       Running             0          2m
    # k8stest-deployment-84d64dd896-vtht7   0/1       ContainerCreating   0          3s
    # k8stest1                              1/1       Running             0          13h
    # k8stest111-6f7b5c448c-wlqmr           1/1       Running             0          1d
    ```

    删除了一个pod之后发现又马上重新创建了一个Pod:`k8stest-deployment-84d64dd896-vtht7`, k8s会监控Deployment创建的Pod，保持Pod的数量与Deployment中设定的预期数量相等。

## 六、Deployment版本升级、回滚

  ### 升级
  1. 修改配置文件`k8stest-deployment.yaml`内容如下：

      ```yaml
      ...
      image: 你的docker仓库用户名/k8stest:v2
      ...
      ```
      * v2版本的镜像里面修改了values控制器的返回值
  1. 运行升级命令：

      ```bash
      # --record设置为true可以在annotation中记录当前命令创建或者升级了该资源
      kubectl apply -f k8stest-deployment.yaml --record

      # 检查服务升级状态
      kubectl rollout status deployment demo-web-deployment
      ```
      * 等升级完成之后刷新浏览器就能看到内容已经变成v2版本的了

  ### 回滚
  1. 查看历史版本：

      ```bash
      kubectl rollout history deployment k8stest-deployment

      # REVISION	CHANGE-CAUSE
      # 1		<none>
      # 2		kubectl apply -f k8stest-deployment.yaml --record --validate=false
      ```
  1. 回滚版本：

      ```bash
      kubectl rollout undo deployment k8stest-deployment --to-revision=1
      # deployment "k8stest-deployment" rolled back
      ```
      * 刷新浏览器查看版本已经回退
## k8s多服务调用

新建一个服务调用上一个服务

### 部署新webapi镜像

1. 新建webapi:`dotnet new webapi -n k8stest2 --no-https`，主要修改内容如下：

  ```csharp
  // startup.cs
  public void ConfigureServices(IServiceCollection services)
  {
      // 注意这里的Uri取的是k8s环境变量的值
      services.AddHttpClient("k8stest", cl => {
          cl.BaseAddress = new Uri(Configuration["k8stestUrl"]);
      });
  }

  // valuescontroller.cs
  private readonly HttpClient _client;

  public ValuesController(IHttpClientFactory httpClientFactory)
  {
      _client = httpClientFactory.CreateClient("k8stest");
  }
  [HttpGet]
  public async Task<ActionResult<IEnumerable<string>>> Get()
  {
      var rest = await _client.GetStringAsync("/api/values/1");
      return new string[] { "value1", "value2", rest };
  }
  ```
1. 新建`Dockerfile`内容如下：

  ```dockerfile
  FROM mcr.microsoft.com/dotnet/core/aspnet:2.2
  WORKDIR /app
  COPY bin/Release/netcoreapp2.2/publish .
  ENTRYPOINT ["dotnet", "k8stest2.dll"]
  ```
1. 编译生成镜像并上传：

  ```bash
  # 编译项目
  dotnet publish -c Release

  # 打包镜像
  docker build -t 你的docker仓库用户名/k8stest2:v1

  # 上传镜像
  docker publish 你的docker仓库用户名/k8stest2:v1
  ```

### 给新的api创建deployment

1. 新建`k8stest2-deployment.yaml`内容如下：

  ```yaml
  apiVersion: extensions/v1beta1
  kind: Deployment
  metadata:
    name: k8stest2-deployment
    labels:
      app: k8stest2-deployment
  spec:
    replicas: 2
    selector:
      matchLabels:
        app: k8stest2
    minReadySeconds: 5
    strategy:
      type: RollingUpdate
      rollingUpdate:
        maxUnavailable: 1
        maxSurge: 1
    template:
      metadata:
        labels:
          app: k8stest2
      spec:
        containers:
          - name: k8stest2
            image: 你的docker仓库用户名/k8stest2:v1
            imagePullPolicy: Always
            ports:
              - containerPort: 80
            env:
              - name: k8stestUrl # 这里名称与webapi中注入的一致
                value: "http://k8stest-service" # 这里使用前面一个服务的service
  ```
  * 这里可以直接使用service的名称是因为CoreDNS(Kube-DNS)帮我们完成了域名解析

  DNS服务器监控kubernetes创建服务的API, 并为每个服务创建一组dns记录。如果在整个群集中启用了dns, 所有Pod都会使用它作为DNS服务器。比如我们的k8stest-service服务，DNS服务器会创建一条"my-service.my-ns"也就是10.107.96.166:k8stest-service.default的dns记录，因为我们的2个Api应用在同一个命名空间(default)中，所以可以直接使用k8stest-service来访问

1. 启动deployment:

  ```bash
  kubectl create -f k8stest2-deployment.yaml --validate=false
  ```

### 为新的api创建新的service

1. 创建`k8stest2-service.yaml`文件，内容如下：

  ```yaml
  appVersion: v1
  kind: Service
  metadata:
    name: k8stest2-service
  spec:
    selector:
      app: k8stest2
    ports:
    - protocol: TCP
      port: 80
      targetPort: 80
      nodePort: 31112
    type: NodePort
  ```
1. 启动service：

  ```
  kubectl create -f k8stest2-service.yaml --validate=false
  ```
### 验证请求

在网页中直接输入`Node节点ip地址:31112/api/values`可以看到返回内容如下：

  ```text
  ["value1","value2","172.17.0.9"]
  ```




