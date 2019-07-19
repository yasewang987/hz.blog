# K8s常用命令

创建服务

    ```bash
    # 创建
    kubectl create xxx.yaml --validate=false

    # 重启
    kubectl replace xxx.yaml --force --validate=false
    ```

获取Pod信息

    ```bash
    # 获取default命名空间下的pods
    kubectl get pods

    # 获取kube-system命名空间下的pods
    kubectl -n kube-system get pods
    ```

获取service信息

    ```bash
    # 获取default命名空间下的
    kubectl get services

    # 获取kube-system命名空间下的
    kubectl -n kube-system get services
    ```

获取Deployment信息

    ```bash
    # 获取default命名空间下的
    kubectl get deployments

    # 获取kube-system命名空间下的
    kubectl -n kube-system get deployments
    ```

删除信息

    ```bash
    # 删除defalut命名空间下的
    kubectl delete pod xxxx
    kubectl delete service xxxx
    kubectl delete deployment xxxx

    # 删除kube-system命名空间下的
    kubectl -n kube-system delete pod xxxx
    kubectl -n kube-system delete service xxxx
    kubectl -n kube-system delete deployment xxxx
    ```