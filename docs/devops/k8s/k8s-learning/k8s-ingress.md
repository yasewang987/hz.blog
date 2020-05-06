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
          serviceName: normal-service
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