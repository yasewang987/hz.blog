# Kubernetes - HealthCheck

## 一、K8s中的建康检查

K8s可以帮助我们快捷地部署容器集群，如果部署上错误的容器导致服务崩溃，通常情况下我们都会通过一些高可用机制进行故障转移。但是，前提条件是有健康检查。

K8s自然帮我们考虑到了这个问题，健康检查是K8s的重要特性之一，默认有健康检查机制，此外还可以主动设置一些自定义的健康检查。

默认情况下，每个容器启动时都会执行一个进程，由Dockerfile中的CMD或ENTRYPOINT指定。如果进程退出时的返回码不为0，则认为容器发生了故障，K8s会根据重启策略（restartPolicy）重启容器，例如下面例子所示，注意查看文件中的args选项。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: healthcheck-demo1
  labels:
    name: healthcheck
spec:
  restartPolicy: OnFailure
  containers:
  - name: healthcheck
    image: busybox
    imagePullPolicy: IfNotPresent
    args:
      - /bin/sh
      - -c
      - sleep 10; exit 1
```

其中 sleep 10; exit 1代表启动10秒之后就非正常退出（返回码不为0），然后通过kubectl创建Pod：

```bash
kubectl apply -f health-check.yaml
```

运行效果图如下：
![1](http://cdn.go99.top/docs/devops/k8s/k8s-learning/healthcheck1.png)
可以看到，该容器已经重启了2次。也可以看出，restartPolicy简单直接暴力有效。
但是，这样做会有一个问题：必须等到进程退出后的返回值是非零才会触发重启策略，不能直接监测容器是否是健康。

那么，K8s中有没有更好的机制能够实现智能一点的健康检查呢？答案就是使用Liveness与Readinesss。

## 二、Liveness探测

Liveness：如果健康检查失败，重启pod！（可以自定义判断容器是否健康）

### liveness检查参数、基础实践

```
initialDelaySeconds：容器启动后第一次执行探测是需要等待多少秒,看运行的服务而定。
periodSeconds：执行探测的频率，默认是10秒，最小1秒。
timeoutSeconds：探测超时时间，默认1秒，最小1秒。
successThreshold：探测失败后，最少连续探测成功多少次才被认定为成功，默认是1，对于liveness必须是1，最小值是1。
failureThreshold：探测成功后，最少连续探测失败多少次才被认定为失败。默认是3。最小值是1.
```

下面举一个小例子

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: liveness-demo
  labels:
    test: liveness
spec:
  containers:
  - name: liveness
    image: busybox
    args:
      - /bin/sh
      - -c
      - touch /tmp/healthy; sleep 30; rm -rf /tmp/healthy; sleep 10
    livenessProbe:
      exec:
        command:
          - cat
          - /tmp/healthy
      initialDelaySeconds: 10
      periodSeconds: 5
```
这里启动pod后会创建文件夹 /tmp/healthy，30秒后删除，在我们的设置中，如果 /tmp/healthy 存在，则认为容器处于正常状态，否则认为发生故障。

需要注意的就是livenessProbe部分的定义了：
* 探测方法：通过cat命令查看/tmp/healthy是否存在；如果返回值为0，则探测成功；否则，探测失败；
* initialDelaySeconds: 10 => 容器启动10秒之后开始执行liveness探测；
* periodSeconds: 5 => 每5秒执行一次liveness探测；如果连续执行3次探测都失败，那么就会杀掉并重启容器；

下面快速创建验证一下：

```bash
sudo kubectl apply -f liveness-demo.yaml
```
过一段时间后查看运行情况

```bash
kubectl get pod liveness-demo
```
![2](http://cdn.go99.top/docs/devops/k8s/k8s-learning/healthcheck2.png)

`/tmp/healthy` 被删除了，liveness探测失败，又过了几十秒，重复探测均失败后，开启了重启容器。

### Liveness探针

K8s探针有如下类型探针，上面例子使用的时exec探针：

* exec：在容器中执行一个命令，如果命令退出码返回0则表示探测成功，否则表示失败
* tcpSocket：对指定的容IP及端口执行一个TCP检查，如果端口是开放的则表示探测成功，否则表示失败
* httpGet：对指定的容器IP、端口及路径执行一个HTTP Get请求，如果返回的状态码在 [200,400)之间则表示探测成功，否则表示失败

tcpSocket探针测试(检测80端口是否联通)：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: liveness-tcp
  labels:
    test: liveness
spec:
  containers:
  - name: liveness-tcp
    image: nginx
    livenessProbe:
      tcpSocket:
        port: 80
      initialDelaySeconds: 10
      failureThreshold: 3
      periodSeconds: 10
      successThreshold: 1
      timeoutSeconds: 10
```
过一段时间查看pod是否有重启，没有重启说明正常
![3](http://cdn.go99.top/docs/devops/k8s/k8s-learning/healthcheck3.png)

httpGet探针测试(检测index.html文件是否可以正常访问):

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: liveness-http
  labels:
    test: liveness
spec:
  containers:
  - name: liveness-http
    image: nginx
    livenessProbe:
      httpGet:
        path: /index.html
        port: 80
        scheme: HTTP
      initialDelaySeconds: 10
      failureThreshold: 3
      periodSeconds: 10
      successThreshold: 1
      timeoutSeconds: 10
```

过一段时间查看pod是否有重启，没有重启说明正常
![4](http://cdn.go99.top/docs/devops/k8s/k8s-learning/healthcheck4.png)

## Readiness探测

Readiness：如果检查失败，K8s会将该Pod从服务代理的分发后端去除，不分发请求给该Pod。如果检测成功，那么K8s就会将容器加入到分发后端，重新对外提供服务。

readiness简单测试：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: readiness-demo
  labels:
    test: readiness
spec:
  containers:
  - name: readiness
    image: busybox
    args:
      - /bin/sh
      - -c
      - touch /tmp/healthy; sleep 30; rm -rf /tmp/healthy; sleep 10
    readinessProbe:
      exec:
        command:
          - cat
          - /tmp/healthy
      initialDelaySeconds: 10
      periodSeconds: 5
```

运行效果图如下：
![5](http://cdn.go99.top/docs/devops/k8s/k8s-learning/healthcheck5.png)

可以看出readiness和liveness运行的效果不同：

* 刚被创建时，其READY状态为不可用
* 15秒（initialDelaySeconds + periodSeconds = 10 + 5 = 15）之后，第一次进行Readiness探测成功，其READY状态变为可用
* 30秒之后，/tmp/healthy被删除，连续3次Readiness探测均失败后，其READY状态又变为了不可用。
* Liveness与Readiness都是K8s的Health Check机制，Liveness探测是重启容器，而Readiness探测则是将容器设置为不可用，不让其再接受Service转发的请求。

Liveness与Readiness是独立执行的，二者无依赖，可以单独使用也可以同时使用。

## HealthCheck在实际项目中的应用

### 一、在Scale Up中的应用

对于多副本应用，当执行Scale Up操作时，新的副本会作为后端服务加入到Service的负载均衡列表中。但是，很多时候应用的启动都需要一定的时间做准备（比如加载缓存、连接数据库等等），这时我们可以通过Readiness探测判断容器是否真正就绪，从而避免将请求发送到还未真正就绪的后端服务。

下面一个示例YAML配置文件定义了Readiness探测，重点关注readinessProbe部分：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapi-deployment
  namespace: aspnetcore
spec:
  replicas: 2
  selector:
    matchLabels:
      name: webapi
  template:
    metadata:
      labels:
        name: webapi
    spec:
      containers:
      - name: webapi-container
        image: yasewang/k8s-demo:1.2
        ports:
        - containerPort: 80
        imagePullPolicy: IfNotPresent
        readinessProbe:
          httpGet:
            scheme: HTTP
            path: /api/health
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 5

---

apiVersion: v1
kind: Service
metadata:
  name: webapi-service
  namespace: aspnetcore
spec:
  type: NodePort
  ports:
    - nodePort: 31000 
      port: 8080
      targetPort: 80
  selector:
    name: webapi
```

对于readinessProbe部分：
* schema指定了协议，这里是HTTP协议，也可以是HTTPS协议
* path指定访问路径，这里是我们自定义的一个Controller中的接口：简单地返回一个状态码为200的响应
  ```csharp
  [Produces("application/json")]
  [Route("api/Health")]
  public class HealthController : Controller
  {
      [HttpGet]
      public IActionResult Get() => Ok("ok");
  }
  ```
* port指定端口，这里是容器的端口80；
* initialDelaySeconds和periodSeconds指定了容器启动10秒之后开始探测，然后每隔5秒执行探测，如果发生3次以上探测失败，则该容器会从Service的负载均衡中移除，直到下次探测成功后才会重新加入。

### 二、在Rolling Update中的应用

假设现在有一个正常运行的多副本应用，我们要对其进行滚动更新即Rolling Update，K8S会逐步用新Pod替换旧Pod，结果就有可能发生这样的一个场景：当所有旧副本被替换之后，而新的Pod由于人为配置错误一直无法启动，因此整个应用将无法处理请求，无法对外提供服务，后果很严重！

因此，Readiness探测还提供了用于避免滚动更新中出现这种情况的一些解决办法，比如maxSurge和maxUnavailable两个参数，用来控制副本替换的数量。

继续以上面的YAML配置文件为例，重点关注strategy部分：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapi-deployment
  namespace: aspnetcore
spec:
  strategy:
    rollingupdate:
      maxSurge: 25%
      maxUnavailable: 25%
  replicas: 10
  selector:
    matchLabels:
      name: webapi
  template:
    metadata:
      labels:
        name: webapi
    spec:
      containers:
      - name: webapi-container
        image: yasewang/k8s-demo:1.2
        ports:
        - containerPort: 80
        imagePullPolicy: IfNotPresent
        readinessProbe:
          httpGet:
            scheme: HTTP
            path: /api/health
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 5

---

apiVersion: v1
kind: Service
metadata:
  name: webapi-service
  namespace: aspnetcore
spec:
  type: NodePort
  ports:
    - nodePort: 31000 
      port: 8080
      targetPort: 80
  selector:
    name: webapi
```

* maxSurge : 25% => 控制滚动更新过程中副本总数超过预期（这里预期是10个副本 replicas: 10）的上限，可以是数值也可以是百分比，然后向上取整。这里写的百分比，默认值是25%；如果预期副本数为10，那么副本总数的最大值为RoundUp(10 + 10 * 25%)=13个。
* maxUnavailable : 25% => 控制滚动更新过程中不可用的副本（这里预期是10个副本 replicas: 10）占预期的最大比例，可以是数值也可以是百分比，然后向下取整，同样地默认值也是25%；如果预期副本总数为10，那么可用的副本数至少要为10-roundDown(10 * 25%)=10-2=8个。

综上看来，maxSurge的值越大，初始创建的新副本数量就越多；maxUnavaliable值越大，初始销毁的旧副本数量就越多；
