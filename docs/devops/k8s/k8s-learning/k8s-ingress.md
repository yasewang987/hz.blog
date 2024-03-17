# Kubernetes - Ingress

## Ingress Controller 安装

这里以 `Nginx Ingress` 测试， [Nginx 官网参考](https://docs.nginx.com/nginx-ingress-controller/installation/installation-with-manifests/)

> 注意本地测试的时候通过 `NodePort` 的形式暴露 `Nginx Ingress Controller Service`

## Ingress部署测试

### 一、准备测试的服务

基本后端服务，获取ip，yaml文件如下

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: normal-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: normal-service
  template:
    metadata:
      labels:
        app: normal-service
    spec:
      containers:
      - name: normal-service
        image: yasewang/normalservice
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: normal-service
spec:
  selector:
    app: normal-service
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30300
  type: NodePort
```

### 二、Ingress配置

通过ingress访问后端服务,里面定义了路由规则, [nginx官网配置参考](https://docs.nginx.com/nginx-ingress-controller/configuration/ingress-resources/basic-configuration/)

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: nginx-ingress
  annotations:
    nginx.org/rewrites: "serviceName=normal-service rewrite=/"
spec:
  rules:
  # 本地绑定一下hosts
  - host: xxx.yyy.com
    http:
      paths:
      - path: /
        backend:
          serviceName: normal-service
          servicePort: 80
      - path: /test/
        backend:
          serviceName: normal-service2
          servicePort: 80
```

或者使用`VirtualServer`

```yaml
apiVersion: k8s.nginx.org/v1
kind: VirtualServer
metadata:
  name: normal-virtualserver
spec:
  host: xxx.yyy.com
  upstreams:
  - name: normal
    service: normal-service
    port: 80
  routes:
  - path: /
    action:
      pass: normal
```

部署完毕即可通过ingress统一对外提供服务


## 路径重定向

**示例1：`www.test.com/a/api/v1/apps` 重定向到 `www.test.com/api/v1/apps`**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
  name: rewrite
  namespace: default
spec:
  ingressClassName: nginx
  rules:
  - host: www.test.com
    http:
      paths:
      - path: /a(/|$)(.*)
        pathType: Prefix
        backend:
          service:
            name: http-svc
            port: 
              number: 80
```

在这个 `ingress` 的定义中，通过在 `annotations` 中指定了 `nginx.ingress.kubernetes.io/rewrite-target: /$2` 来进行重定向，`(.*)` 捕获的任何字符都将被分配给占位符 `$2`，然后在 `rewrite-target` 中用作参数。

应用上面的 ingress 配置，可以实现下面的重定向：

* `www.test.com/a` 重定向到 `www.test.com/`
* `www.test.com/a/` 重定向到 `www.test.com/`
* `www.test.com/a/api/v1/apps` 重定向到 `www.test.com/api/v1/apps`

`rewriting` 可以使用下面的 `anntations` 进行控制：

名称|描述|值
---|---|---
nginx.ingress.kubernetes.io/rewrite-target|必须重定向流量的目标URI|string
nginx.ingress.kubernetes.io/ssl-redirect|表示位置部*分是否可访*问SSL（当Ingress包含证书时默认为True）|bool
nginx.ingress.kubernetes.io/force-ssl-redirect|强制重定向到HTTPS，即使入口没有启用TLS|bool
nginx.ingress.kubernetes.io/app-root|定义应用根，如果它在'/'上下文中，控制器必须重定向它|string
nginx.ingress.kubernetes.io/use-regex|表示Ingress上定义的路径是否使用正则表达式|bool

**示例2：`http://approot.bar.com/` 访问 `http://approot.bar.com/app1`**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/app-root: /app1
  name: approot
  namespace: default
spec:
  ingressClassName: nginx
  rules:
  - host: approot.bar.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: http-svc
            port: 
              number: 80
```