# Kubernetes - Volume

k8s和docker一样也提供了数据持久化方案，存储模型Volume。其本质也是一个目录。

需要注意的是：k8s Volume的生命周期独立于容器，Pod中的容器可能被销毁、重建，但是volume会报保留

当volume被挂载到pod上时，pod中的所有容器都能访问该volume。

k8s中支持的volume类型：emptyDir,hostPath,NFS,Ceph以及阿里云等云服务商提供的存储，不管哪种类型的volume，pod认为所有的volume就是一个目录。

## 一、使用Volume

* emptyDir：属于k8s最基础的持久化方案，emptyDir提供的持久化是相对于容器来说的，但是对于pod来说不是持久的，因为在pod删除的时候，Volume的内容也会一起被删除，emptyDir Volume生命周期与Pod一致，所以在实际应用中基本上不会用这种类型。

* hostPath：相对于emptyDir来说，hostPath方式解决了emptyDir的生命周期问题，pod删除时，Volume中的内容不会被删除，但是如果Node节点Down掉，hostPath也无法访问了。因为hostPath是将Node文件系统中已经存在的目录mount到Pod的容器。

hostPath在K8s的Master节点就有使用到，比如kube-apiserver、kube-controller-manager等（配置文件在`/etc/kubernetes/manifests/`目录下）。查看kube-apiserver的持久化设置：

```yaml
...
    volumeMounts:
    - mountPath: /etc/ssl/certs
      name: ca-certs
      readOnly: true
    - mountPath: /etc/ca-certificates
      name: etc-ca-certificates
      readOnly: true
    - mountPath: /etc/kubernetes/pki
      name: k8s-certs
      readOnly: true
    - mountPath: /usr/local/share/ca-certificates
      name: usr-local-share-ca-certificates
      readOnly: true
    - mountPath: /usr/share/ca-certificates
      name: usr-share-ca-certificates
      readOnly: true
  hostNetwork: true
  priorityClassName: system-cluster-critical
  volumes:
  - hostPath:
      path: /etc/ssl/certs
      type: DirectoryOrCreate
    name: ca-certs
  - hostPath:
      path: /etc/ca-certificates
      type: DirectoryOrCreate
    name: etc-ca-certificates
  - hostPath:
      path: /etc/kubernetes/pki
      type: DirectoryOrCreate
    name: k8s-certs
  - hostPath:
      path: /usr/local/share/ca-certificates
      type: DirectoryOrCreate
    name: usr-local-share-ca-certificates
  - hostPath:
      path: /usr/share/ca-certificates
      type: DirectoryOrCreate
    name: usr-share-ca-certificates
```

* 外部Sotrage Povider：各种共有云上的云盘作为Volume，可以参考各个云服务商的文档进行配置。

## 二、PersistentVolume与PersistentVolumeClaim

### 2.1 介绍

前面提到的方案在可管理性上均有不足，特别是大规模集群，效率和安全性都不够，因此K8s提供了一个解决方案，使用PersistentVolume（PV）和PersistentVolumeClaim（PVC）。

* PV：外部存储系统提供的一块存储空间，由管理员创建、维护。与Volume一样，PV具有持久性，生命周期独立于Pod。

* PVC：对PV的申请（Claim），PVC通常由使用者创建、维护，当需要为Pod分配存储资源的时候，用户就可以新建一个PVC，指明需要的存储资源容量大小和访问方式（比如ReadOnly）等信息，K8s会自动分配满足条件的PV。

PV与PVC的管理有点类似接口与实现的关系，Pod只需要关心接口（我需要的存储满足什么条件），具体的实现不需要关心，K8s会处理。

PersistentVolume支持如NFS、Ceph、AWS EBS等。

### 2.2 NFS PV使用

NFS是网络文件系统（NetWork File System），它允许系统将本地目录和文件共享给网络上的其他系统。通过NFS，用户可以像访问本地文件一样访问远程系统上的文件。

* 首先要创建一个NFS，[参考我的NFS创建](../../../other/linux/cmd.md),只需要执行到重启nfs服务即可。确认nfs信息
  ```bash
  showmount -e
  # 展示如下信息则正常
  Export list for xb-master:
  /home/nfsdata *
  ```

* 创建一个PV

  yaml文件内容如下：

    ```yaml
    apiVersion: v1
    kind: PersistentVolume
    metadata:
      name: xb-pv
    spec:
      capacity:
        storage: 1Gi
      accessModes:
        - ReadWriteOnce
      persistentVolumeReclaimPolicy: Recycle
      storageClassName: nfs
      nfs:
        path: /home/nfsdata/xb-pv
        server: 99.99.99.100
    ```
    * capacity指定了PV的容量为1GB
    * accessModes指定访问模式为ReadWriteOnce，表示PV能够以Read-Write模式mount到单个节点。此外，还支持ReadOnlyMany和ReadWriteMany，分别代表PV能以Read-Only模式或者Read-Write模式mount到多个节点。这里ReadWriteOnce只mount到单个节点，即xb-master（99.99.99.100）
    * persistentVolumeReclaimPolicy指定了此PV的回收策略为Recycle，表示清除PV中的数据。此外，还支持Retain和Delete，Retain表示需要管理员手动回收，类似于你用C/C++还需要手动写free代码释放空间。而Delete呢，表示删除Storage Provider中的对应存储资源，如果你使用的是外部云服务提供商的存储空间的话。
    * storageClassName指定了PV的class为nfs。
    * nfs配置项指定了PV在NFS服务器上对应的目录，如果没有可以事先创建一下。

  创建PV：

  ```bash
  kubectl apply -f xb-pv.yaml
  # 执行成功之后查看pv状态
  kubectl get pv

  # 可以看到其状态Status变为了Available，表示可以被PVC申请了
  NAME    CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM   STORAGECLASS   REASON   AGE
  xb-pv   1Gi        RWO            Recycle          Available           nfs                     18s
  ```

* 创建一个PVC

  与创建PV不同，创建PVC只需指定PV容量、访问模式以及class即可

  yaml配置文件内容如下：

  ```yaml
  apiVersion: v1
  kind: PersistentVolumeClaim
  metadata:
    name: xb-pvc
  spec:
    accessModes:
      - ReadWriteOnce
    resources:
      requests:
        storage: 1Gi
    storageClassName: nfs
  ```
  执行创建PVC
  ```bash
  kubectl apply -f xb-pvc.yaml
  # persistentvolumeclaim/xb-pvc created

  sudo kubectl get pvc
  # 内容如下
  NAME     STATUS   VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE
  xb-pvc   Bound    xb-pv    1Gi        RWO            nfs            24s

  sudo kubectl get pv
  NAME    CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM            STORAGECLASS   REASON   AGE
  xb-pv   1Gi        RWO            Recycle          Bound    default/xb-pvc   nfs                     13m
  ```
  可以看到，xb-pvc已经Bound到xb-pv了，申请PV成功。

* 在Pod中使用

  申请成功之后，我们就可以在Pod中使用了，下面是一个示例Pod的配置文件：
  ```yaml
  apiVersion: v1
  kind: Pod 
  metadata:
    name: xb-pod
  spec:
    containers:
    - name: xb-pod
      image: busybox
      args:
      - /bin/sh
      - -c
      - sleep 3000
      volumeMounts:
      - mountPath: "/mydata"
        name: mydata
    volumes:
      - name: mydata
        persistentVolumeClaim:
          claimName: xb-pvc
  ```
  创建pod
  ```bash
  kubectl apply -f xb-pod.yaml

  # 查看运行状态
  kubectl get pod xb-pod
  # 结果
  NAME     READY   STATUS    RESTARTS   AGE   IP             NODE       NOMINATED NODE   READINESS GATES
  xb-pod   1/1     Running   0          27s   192.168.3.68   xb-node1   <none>           <none>

  # 验证
  sudo kubectl exec xb-pod touch /mydata/hello
  ls /home/nfsdata/xb-pv/
  ```
  可以看到，在Pod中创建的文件/mydata/hello已经保存到了NFS服务器目录的edc-pv目录下了

  如果在创建pod的时候一致不成功，查看运行日志发现是volume挂载不成功的问题，则在node节点执行如下命令：
    ```bash
    apt-get install nfs-common
    ```
### 2.3 NFS PV回收

如果不需要某个PV，可以通过PVC来回收PV：

```bash
kubectl delete pvc xb-pvc
```
当edc-pvc被删除后，我们会发现K8S启动了一个新Pod，这个Pod就是用来清除edc-pv的数据的。数据的清理需要一个过程，完成后edc-pv的状态会重新恢复为Available，此时可以被新的PVC申请

```bash
sudo kubectl get pv
NAME    CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM   STORAGECLASS   REASON   AGE
xb-pv   1Gi        RWO            Recycle          Available           nfs                     61m
```

此外，由于我们设置的回收策略为Recycle，所以Pod中的数据也被清除了：

```bash
ls /home/nfsdata/xb-pv
# 发现hello已经被清理
```

如果希望能够保留这些数据，那么我们需要将PV的回收策略改为Retain。

## MySql持久化存储演示

1. 准备PV、PVC的yaml

    ```yaml
    apiVersion: v1
    kind: PersistentVolume
    metadata:
      name: mysql-pv
    spec:
      capacity:
        storage: 1Gi
      accessModes:
        - ReadWriteOnce
      persistentVolumeReclaimPolicy: Retain
      storageClassName: nfs
      nfs:
        path: /home/nfsdata/mysql-pv
        server: xb-master
    ```

    ```yaml
    apiVersion: v1
    kind: PersistentVolumeClaim
    metadata:
      name: mysql-pvc
    spec:
      accessModes:
        - ReadWriteOnce
      resources:
        requests:
          storage: 1Gi
      storageClassName: nfs
    ```

1. 创建PV、PVC

    ```bash
    kubectl apply -f mysql-pv.yaml
    kubectl apply -f mysql-pvc.yaml
    ```
1. mysql配置文件yaml

    ```yaml
    apiVersion: v1
    kind: Service
    metadata:
      name: mysql-service
    spec:
      ports:
      - port: 3306
      selector:
        app: mysql

    ---

    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: mysql
    spec:
      selector:
        matchLabels:
          app: mysql
      template:
        metadata:
          labels:
            app: mysql
        spec:
          containers:
          - image: mysql:5.6
            name: mysql
            env:
            - name: MYSQL_ROOT_PASSWORD
              value: password
            ports:
            - containerPort: 3306
              name: mysql-container
            volumeMounts:
            - name: mysql-storage
              mountPath: /var/lib/mysql
          volumes:
          - name: mysql-storage
            persistentVolumeClaim:
              claimName: mysql-pvc
    ```
1. 部署mysql
    
    ```bash
    kubectl apply -f mysql-service.yaml
    kubectl get pod -o wide
    NAME                     READY   STATUS    RESTARTS   AGE     IP             NODE       NOMINATED NODE   READINESS GATES
    mysql-7dc6789fbf-v7zgc   1/1     Running   0          3m28s   192.168.3.69   xb-node1   <none>           <none>
    ```
1. 客户端访问MySQL

    ```bash
    kubectl run -it --rm --image=mysql:5.6 --restart=Never mysql-client -- mysql -h mysql-service -ppassword

    # 进入了MySQL数据库,我们更新一下数据库
    use mysql

    create table xb_test( id int(11) );
    # 结果
    Query OK, 0 rows affected (0.01 sec)

    insert into xb_test values(111);
    # 结果
    Query OK, 1 row affected (0.01 sec)

    select * from xb_test;
    # 结果
    +------+
    | id   |
    +------+
    |  111 |
    +------+
    1 row in set (0.00 sec)
    ```

1. 验证mysql的数据被持久化
  * 模拟xb-node1故障，直接关闭，在node1上执行如下命令
    ```bash
    shutdown now
    ```
  * master上执行查询命令验证
    ```sql
    select * from xb_test;
    ERROR 2013 (HY000): Lost connection to MySQL server during query
    ```
  * 验证K8S迁移MySQL
    ```bash
    sudo kubectl get pod -o wide
    # 结果
    NAME                     READY   STATUS        RESTARTS   AGE   IP               NODE       NOMINATED NODE   READINESS GATES
    mysql-7dc6789fbf-hdrm2   1/1     Running       0          53s   192.168.82.137   xb-node2   <none>           <none>
    mysql-7dc6789fbf-v7zgc   1/1     Terminating   0          18m   192.168.3.69     xb-node1   <none>           <none>
    ```
  * 验证数据一致性（迁移完成后在master上查询xb_test数据库）：
    ```bash
    select * from xb_test;
    # 结果
    +------+
    | id   |
    +------+
    |  111 |
    +------+
    1 row in set (0.00 sec)
    ```
  * 如果我们将部署的Service和Deployment删掉，那么其Pod也会停止被删除，但是由于我们的PV的回收策略是Retain，因此其数据不会被清除

    ```bash
    ls /home/nfsdata/mysql-pv/
    # 结果
    auto.cnf  ibdata1  ib_logfile0  ib_logfile1  mysql  performance_schema
    ```
    发现数据还是有的。
  

  





  

