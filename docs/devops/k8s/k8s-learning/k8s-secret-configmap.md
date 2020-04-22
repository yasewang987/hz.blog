# Kubernetes - Secret & ConfigMap

## Secret

Secret 会以密文的方式存储数据，避免了直接在配置文件中保存敏感信息。

Secret 会以 Volume 的形式被 mount 到 Pod，容器可通过文件的方式使用 Secret 中的敏感数据，也可以使用环境变量的方式使用。

### 创建和查看Secret

#### 3种普通方式创建

```bash
# 通过 --from-literal
kubectl create secret generic mysecret --from-literal=username=Hello --from-literal=password=World

# 通过 --from-file
echo -n Hello > ./username
echo -n World > ./password
kubectl create secret generic mysecret --from-file=./username --from-file=./password

# 通过 --from-env-file
cat << EOF > env.txt
username=Hello
password=World
EOF
kubectl create secret generic mysecret --from-env-file=env.txt
```

#### Yaml方式创建（推荐）

由于配置文件中的敏感数据必须是通过base64编码后的结果，因此需要获取base64编码后的值

1. 提取base64加密后内容
    
    ```bash
    # SGVsbG8=
    echo -n Hello | base64

    # V29ybGQ=
    echo -n World | base64
    ```

1. 创建Secret的yaml文件，内容如下：

    ```yaml
    # secret-test.yaml
    apiVersion: v1
    kind: Secret
    metadata:
    name: test-secret
    data:
    username: SGVsbG8=
    password: V29ybGQ=
    ```
1. 创建Secret

    ```bash
    kubectl apply -f secret-test.yaml
    ```
1. 查看Secret

    ```bash
    kubectl get secret
    ```

### 在Pod中使用Secret

K8S中Pod中使用Secret有两种方式，一是Volume方式，二是环境变量的方式。

#### Volume方式

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret-demo
spec:
  containers:
  - name: secret-demo
    image: busybox
    args:
    - /bin/sh
    - -c
    - sleep 10; touch /tmp/healthy; sleep 3000
    volumeMounts:
    - name: test-secret
      mountPath: /etc/test-secret
      readOnly: true
  volumes:
  - name: test-secret
    secret:
      secretName: test-secret
```

查看是否挂载成功

```bash
# 进入pod
kubectl exec -it secret-demo /bin/sh

# 查看secret信息
cat /etc/test-secret/username
cat /etc/test-secret/password
```

当然，你也可以自定义存放数据的目录，如下配置所示：

```yaml
# secret-volume.yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret-demo
spec:
  containers:
  - name: secret-demo
    image: busybox
    args:
    - /bin/sh
    - -c
    - sleep 10; touch /tmp/healthy; sleep 3000
    volumeMounts:
    - name: test-secret
      mountPath: /etc/test-secret
      readOnly: true
  volumes:
  - name: test-secret
    secret:
      secretName: test-secret
      items:
      - key: username
        path: /my/username
      - key: password
        path: /my/password
```

这时，该secret就会存放于/etc/foo/edc-group/username 和 /etc/foo/edc-group/password 两个目录下了。

以Volume方式使用Secret，其中一个优点就是支持动态更新。例如，我们将Secret更新一下，重新应用到K8S中：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: test-secret
data:
  username: SGVsbG8=
  password: aHoxMjM0NTY= #改成了 hz123456
```

应用配置，查看pod中的secret信息已经改了。

```bash
kubectl apply -f secret-test.yaml

# 进入pod
kubectl exec -it secret-demo /bin/sh

# 查看secret信息，变成了hz123456
cat /etc/test-secret/password
```

#### 环境变量方式

通过Volume使用Secret看起来稍微麻烦了一点，容器必须通过文件读取数据。K8S提供了另外一种方式，那就是环境变量方式。 

> *需要注意的也是，虽然通过环境变量读取Secret比较方便，但是无法支持Secret动态更新！*

```yaml
# secret-env.yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret-env
spec:
  containers:
  - name: secret-env
    image: busybox
    args:
    - /bin/sh
    - -c
    - sleep 10; touch /tmp/healthhy; sleep 30000
    env:
      - name: SECRET_USERNAME
        valueFrom:
          secretKeyRef:
            name: test-secret
            key: username
      - name: SECRET_PASSWORD
        valueFrom:
          secretKeyRef:
            name: test-secret
            key: password
```

运行，并查看内容

```bash
# 运行
kubectl apply -f secret-env.yaml

# 查看环境变量
echo $SECRET_USERNAME
echo $SECRET_PASSWORD
```

## ConfigMap

Configmap的创建与使用方式与Secret非常类似，不同点只在于数据以明文形式存放

和Secret一样，可以通过 --from-literal，--from-file 和 --from-env-file来创建，这里我们跳过，直接说下我们最常用的yaml配置文件的方式。

### 创建Configmap

以core项目中的appsettings为例子

```yaml
# cm-test.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cm-test
data: # data中的数据以key: value的形式，多行使用 ｜
  appsettings.json: |
    {
      "Logging": {
        "LogLevel": {
          "Default": "Information",
          "Microsoft": "Warning",
          "Microsoft.Hosting.Lifetime": "Information"
        }
      },
      "AllowedHosts": "*"
    }
```

创建,查看 configmap

```bash
# 创建
kubectl apply -f cm-test.yaml

# 查看
kubectl get configmap
```

### 使用Configmap

ConfigMap与Secret一样，可以使用 Volume，Env 2种方式挂载

1. Volume方式：

    ```yaml
    # cm-volume.yaml
    apiVersion: v1
    kind: Pod
    metadata:
      name: cm-pod
    spec:
        containers:
        - name: cm-container
          image: busybox
          args:
          - /bin/sh
          - -c
          - sleep 10; touch /tmp/healthy; sleep 30000
          volumeMounts:
          - name: cm-test
            mountPath: /etc/configmap
        volumes:
        - name: cm-test
          configMap:
          name: cm-test
          items:
          - key: appsettings.json # configmap - data中的key
            path: appsettings.json # 容器中保存的位置
    ```

    执行并查看结果

    ```bash
    # 创建
    kubectl apply -f cm-volume.yaml

    # 查看
    kubectl exec -it cm-pod /bin/sh
    cat /etc/configmap/appsettings.json
    ```

1. 环境变量方式

    ```yaml
    # cm-env.yaml
    apiVersion: v1
    kind: Pod
    metadata:
      name: cm-env
    spec:
        containers:
        - name: cm-env
          image: busybox
          args:
          - /bin/sh
          - -c
          - sleep 10; touch /tmp/healthy; sleep 30000
          env:
          - name: APPSETTINGS
            valueFrom:
              configMapKeyRef:
                name: cm-test
                key: appsettings.json
    ```

    执行并查看结果

    ```bash
    # 创建
    kubectl apply -f cm-env.yaml

    # 查看
    kubectl exec -it cm-env /bin/sh
    echo $APPSETTINGS
    ```


