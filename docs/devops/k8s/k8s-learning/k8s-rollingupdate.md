# Kubernetes - Rolling Update

K8S提供了Rolling Update机制，它可以使得服务近乎无缝地平滑升级，即在不停止对外服务的前提下完成应用的更新。如果新版本有问题，也可以通过回滚操作恢复到更新前的状态。

## 准备工作

1. 准备一个3个`ASP.NET Core WebAPI`项目，并添加新接口区分版本：

    ```csharp
    [Route("api/[controller]")]
    [ApiController]
    public class HomeController : ControllerBase
    {
        // GET api/home
        [HttpGet]
        public ActionResult<IEnumerable<string>> Get()
        {
            // 这里不同的版本设置不同Version: 1.0,1.1,1.2
            return new string[] {
                "Version: 1.0"
            };
        }
    }
    ```
1. 将3个项目分别打包成不同版本的镜像：`k8s-demo:1.0,1.1,1.2`
1. 将镜像推送到远程仓库
    ```bash
    docker push yasewang/k8s-demo:1.0
    docker push yasewang/k8s-demo:1.1
    docker push yasewang/k8s-demo:1.2
    ```
    ![1](http://cdn.go99.top/docs/devops/k8s/k8s-learning/rollingupdate1.png)

## Deployment、Service部署

1. 新建1.0版本yaml配置文件`demo-deployment.yaml`内容如下：

    ```yaml
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: k8s-demo-deployment
      namespace: aspnetcore
    spec:
      replicas: 2
      selector:
        matchLabels:
          app: k8s-demo-webapi
      template:
        metadata:
          labels:
            app: k8s-demo-webapi
        spec:
          containers:
          - name: k8s-demo-container
            image: yasewang/k8s-demo:1.0
            resources:
              limits:
                memory: "128Mi"
                cpu: "200m"
            ports:
            - containerPort: 80
            imagePullPolicy: IfNotPresent
    ```
1. 部署1.0版本的应用：

    ```bash
    kubectl apply -f demo-deployment.yaml
    ```
1. 查看deployment状态：
    ```bash
    kubectl get deployment -n aspnetcore -o wide
    ```
    ![2](http://cdn.go99.top/docs/devops/k8s/k8s-learning/rollingupdate2.png)
1. 创建Service配置文件`demo-service.yaml`,内容如下：

    ```yaml
    apiVersion: v1
    kind: Service
    metadata:
      name: k8s-demo-service
      namespace: aspnetcore
    spec:
      type: NodePort
      selector:
        app: k8s-demo-webapi
      ports:
      - port: 8080
        targetPort: 80
        nodePort: 31000
    ```
1. 运行Service：
    ```bash
    kubectl apply -f demo-service.yaml
    ```
1. 查看Service运行状态：
    ```bash
    kubectl get service -n aspnetcore -o wide
    ```
    ![3](http://cdn.go99.top/docs/devops/k8s/k8s-learning/rollingupdate3.png)
1. 查看网页效果:
    ![4](http://cdn.go99.top/docs/devops/k8s/k8s-learning/rollingupdate4.png)


## Rolling Update测试

### 应用升级

假如我们系统增加了部分功能，需要发布1.1版本，只要更新yaml配置文件即可。

1. 修改yaml文件
    ```yaml
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: k8s-demo-deployment
      namespace: aspnetcore
    spec:
      replicas: 2
      selector:
        matchLabels:
          app: k8s-demo-webapi
      template:
        metadata:
          labels:
            app: k8s-demo-webapi
        spec:
          containers:
          - name: k8s-demo-container
            image: yasewang/k8s-demo:1.1
            resources:
              limits:
                memory: "128Mi"
                cpu: "200m"
            ports:
            - containerPort: 80
            imagePullPolicy: IfNotPresent
    ```
1. 滚动升级（和部署一样的命令）：

    ```bash
    kubectl apply -f demo-deployment.yaml
    ```
    ![5](http://cdn.go99.top/docs/devops/k8s/k8s-learning/rollingupdate5.png)
1. 验证deployment使用的镜像是否更新成1.1：
    
    ```bash
    kubectl get deployment -n aspnetcore -o wide
    ```
    ![6](http://cdn.go99.top/docs/devops/k8s/k8s-learning/rollingupdate6.png)
    访问网页查看效果
    ![7](http://cdn.go99.top/docs/devops/k8s/k8s-learning/rollingupdate7.png)

### 应用回滚

kubectl每次更新应用时都会保存一个`revision`,这样我们就可以根据revision回滚到指定版本了。

![9](http://cdn.go99.top/docs/devops/k8s/k8s-learning/rollingupdate9.png)

* 可以通过修改Deployment配置文件中的`revisionHistoryLimit`属性设置revision保存的数量：
    ```yaml
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: k8s-demo-deployment
      namespace: aspnetcore
    spec:
      revisionHistoryLimit: 10
    ....
    ```

如果我们发现我们现在的1.1版本存在bug，需要回滚到1.0版本可以通过下面命令回滚：

  ```bash
  kubectl rollout undo deployment k8s-demo-deployment -n aspnetcore
  ```
  ![8](http://cdn.go99.top/docs/devops/k8s/k8s-learning/rollingupdate8.png)
  ![4](http://cdn.go99.top/docs/devops/k8s/k8s-learning/rollingupdate4.png)

其实我们会发现上面的`revision`历史纪录里面没有明显的信息可以让我们区分每个版本有什么区别，这样对于回滚到指定版本很不方便，这个时候就需要通过`--record`命令解决这个问题了,`--record`会记录本次执行的命令内容。

1. 修改`demo-deployment.yaml`文件名为`demo-deployment1.2.yaml`

    ```bash
    mv demo-deployment.yaml demo-deployment1.2.yaml
    ```
1. 升级Deployment:

    ```bash
    kubectl apply -f demo-deployment1.2.yaml --record
    ```
1. 查看升级的历史版本：

    ```bash
    kubectl rollout history deployment k8s-demo-deployment -n aspnetcore
    ```
    ![10](http://cdn.go99.top/docs/devops/k8s/k8s-learning/rollingupdate10.png)
    加上`--record`的作用在于将当前命令记录到revision（版次）记录中，这样可以方便我们在后面通过kubectl rollback时去指定revision

1. 知道了每次更新的版本命令就能很清楚的知道我们需要回滚的版本了，然后通过如下命令回滚版本：

    ```bash
    kubectl rollout undo deployment k8s-demo-deployment --to-revision=2 -n aspnetcore
    ```
    ![11](http://cdn.go99.top/docs/devops/k8s/k8s-learning/rollingupdate11.png)

## Rolling Update原理

K8S中对于更Rolling Update的操作主要是针对ReplicaSet的操作，可以通过如下命令查看验证：

```bash
kubectl get replicaset -n aspnetcore -o wide
```
![13](http://cdn.go99.top/docs/devops/k8s/k8s-learning/rollingupdate13.png)
可以看到1.0和1.2版本的ReplicaSet创建之后然后被清理了，已经没有正在运行的Pod了。转而创建了新的1.1版本的ReplicaSet，它有两个正在运行的Pod。

具体过程我们还可以通过以下命令查看：

```bash
kubectl describe deployment k8s-demo-deployment -n aspnetcore
```
![14](http://cdn.go99.top/docs/devops/k8s/k8s-learning/rollingupdate14.png)
通过日志可以看到，在进行对ReplicaSet的伸缩过程中，ReplicaSet会随之增加或减少一个Pod，从而完成Pod的替换以实现滚动更新的结果。

* 滚动更新的最大好处在于零停机，整个更新过程始终有副本在运行，从而保证了业务的连续性