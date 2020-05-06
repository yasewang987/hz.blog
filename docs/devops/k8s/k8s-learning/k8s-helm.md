# Kubernetest - Helm

## helm参考资料

* [helm官方文档](https://helm.sh/docs/)
* [helm github](https://github.com/helm/helm)

## 安装helm

参考`github`中的安装

这里使用`snap`:

```bash
snap install helm --classic
```

修改 `chart` 源：

```bash
# 通过帮助命令查看
helm repo -h

# 查询仓库列表
helm repo list

# 新增源 add {仓库名字} {仓库地址}
helm repo add stable http://mirror.azure.cn/kubernetes/charts/

# 查询 chart 包
helm search repo

# 删除仓库
helm repo remove stable
```

## helm基本使用

1. 新建 `chart`：
    ```bash
    helm create mytest
    ```

1. 修改文件内容（根据测试场景自行配置）：

    ```yaml
    # mytest/values.yaml
    ...
    image:
      repository: yasewang/normalservice
      pullPolicy: IfNotPresent
      tag: latest
    service:
      type: NodePort
      port: 80
      nodePort: 30301
    # 不创建sa
    serviceAccount:
      create: false
    ...
    ```

    ```yaml
    # mytest/templates/service.yaml
    ...
    apiVersion: v1
    kind: Service
    metadata:
      name: {{ include "mytest.fullname" . }}
      labels:
        {{- include "mytest.labels" . | nindent 4 }}
    spec:
      type: {{ .Values.service.type }}
      ports:
        - port: {{ .Values.service.port }}
          nodePort: {{ .Values.service.nodePort }}
          targetPort: http
          protocol: TCP
          name: http
      selector:
        {{- include "mytest.selectorLabels" . | nindent 4 }}
    ```

1. 打包：
    ```bash
    helm package mytest
    ```
1. 安装：
    ```bash
    # helm install 名称 包
    helm install mytest mytest-0.1.0.tgz

    # 查询
    helm ls

    # 删除
    helm delete mytest
    # 或者
    helm uninstall mytest
    ```
1. 验证结果：
    ```bash
    # 查看pod,是否存在mytest-开头的pods
    kubectl get pods

    # 查看service
    kubectl get service
    ```

    例子中使用的是 `NodePort` 的模式，那就可以直接使用浏览器访问确认服务是否正常运行 `192.168.40.100:30301`
