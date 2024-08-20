# 常用Yamls记录

## ingress

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: nginx-ingress
  annotations:
    nginx.org/rewrites: "serviceName=normal-service rewrite=/"
spec:
  rules:
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

## nas存储创建

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  finalizers:
    - kubernetes.io/pv-protection
  labels:
    alicloud-pvname: nas-znsj-fc
  name: nas-znsj-fc
  resourceVersion: '4110625'
  uid: fff6ccb5-2c45-440e-a7ab-b5a65ace1152
spec:
  accessModes:
    - ReadWriteMany
  capacity:
    storage: 500Gi
  csi:
    driver: nasplugin.csi.alibabacloud.com
    volumeAttributes:
      path: ''
      server: 190eb4914a-d9936.cn-beijing-pdcloud-d01.nas.ops.pdcloud.cn
      vers: '3'
    volumeHandle: nas-znsj-fc
  persistentVolumeReclaimPolicy: Retain
  storageClassName: nas
  volumeMode: Filesystem
status:
  phase: Available
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  annotations:
    pv.kubernetes.io/bind-completed: 'yes'
    pv.kubernetes.io/bound-by-controller: 'yes'
  finalizers:
    - kubernetes.io/pvc-protection
  name: nas-znsj-fc-pvc
  namespace: default
  resourceVersion: '4111299'
  uid: cc071dad-62fa-436e-88f4-7d979e75be58
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 500Gi
  selector:
    matchLabels:
      alicloud-pvname: nas-znsj-fc
  storageClassName: nas
  volumeMode: Filesystem
  volumeName: nas-znsj-fc
status:
  accessModes:
    - ReadWriteMany
  capacity:
    storage: 500Gi
  phase: Bound
```

## deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fc-deployment
  namespace: znsj-gpu-sit # 这个不能修改
spec:
  selector:
    matchLabels:
      app: fc-pod
  replicas: 1  # 副本数量默认设置成1，池化平台会在添加完服务之后动态调整成1
  template:
    metadata:
      labels:
        app: fc-pod
    spec:
      nodeSelector:
        gpu: A10 # （T4/A10/V100）通过node节点标签选择部署到哪种显卡的node节点上
      imagePullSecrets:
      - name: "registry-key"
      containers:
      - name: fc-crm
        image: cr.registry.res.pdcloud.cn/znsj-repo/fc-crm:1
        ports:
        - containerPort: 18501
        command: ["/data/start.sh"]
        livenessProbe:
          httpGet:
            path: /actuator/health # java，其他的自己定义
            port: 18501
          failureThreshold: 5 # 根据厂家服务启动时间设置
          initialDelaySeconds: 90 # 根据厂家启动时间设置
          periodSeconds: 10
        resources:
          requests:
            cpu: 2
            memory: 5Gi
          limits:
            cpu: 2
            memory: 5Gi
        env:
        - name: spring.datasource.url
          value: "jdbc:mysql://10.3.5.7:28003/fcbms-new?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai&allowMultiQueries=true"
        - name: spring.datasource.username
          value: "root"
        - name: spring.datasource.password
          value: "yourpassword"
        - name: spring.redis.host
          value: "10.3.5.7"
        - name: spring.redis.port
          value: "28000"
        - name: spring.redis.password
          value: "yourpassword"
      - name: fc-integration
        image: cr.registry.res.pdcloud.cn/znsj-repo/fc-integration:1
        ports:
        - containerPort: 18350
        - containerPort: 18400
        - containerPort: 18450
        - containerPort: 18600
        command: ["./start-integration.sh"]
        startupProbe:
          httpGet:
            path: /check # 检查接口需要保证核心服务运行正常，如果多个服务需要合并检测
            port: 18450
          failureThreshold: 30
          periodSeconds: 10
        livenessProbe: # 可选
          httpGet:
            path: /check
            port: 18450
          periodSeconds: 60
        resources:
          requests:
            cpu: 16
            memory: 20Gi
          limits:
            cpu: 16
            memory: 20Gi
        env: # 可选，可自己定义
        - name: es_host
          value: "10.3.5.7"
        - name: es_port
          value: "28001"
        - name: es_user
          value: "elastic"
        - name: es_password
          value: "yourpassword"
        - name: redis_host
          value: "10.3.5.7"
        - name: redis_port
          value: "28000"
        - name: redis_db
          value: "0"
        - name: password
          value: "yourpassword"
        - name: query_redis_host
          value: "10.3.5.7"
        - name: query_redis_port
          value: "28000"
        - name: query_redis_db
          value: "0"
        - name: query_password
          value: "yourpassword"
      - name: fc-slc
        image: cr.registry.res.pdcloud.cn/znsj-repo/fc-slc:1
        ports:
        - containerPort: 13000
        command: ["./start-slc.sh"]
        startupProbe:
          httpGet:
            path: /check
            port: 13000
          failureThreshold: 30
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /check
            port: 13000
          periodSeconds: 60
        resources:
          requests:
            cpu: 16
            memory: 20Gi
          limits:
            cpu: 16
            memory: 20Gi
        env:
        - name: REDIS_SERVER
          value: "10.3.5.7"
        - name: REDIS_PORT
          value: "28000"
        - name: REDIS_PWD
          value: "yourpassword"
        - name: REDIS_DB
          value: "7"
        volumeMounts:
        - name: fc-volume
          mountPath: /data
      volumes:
      - name: fc-volume
        persistentVolumeClaim:
          claimName: nas-znsj-fc-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: fc-service
  namespace: fc-space  # 与上面一致
spec:
  selector:
    app: fc-pod # 这里注意匹配pod的标签
  ports:
  - port: 80
    targetPort: 18501
  type: ClusterIP
```

## mysql

pv、pvc

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: mysql-pv-volume
  labels:
    type: local
spec:
  storageClassName: manual
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: "/mnt/data"
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-pv-claim
spec:
  storageClassName: manual
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```
deployment

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql
spec:
  ports:
  - port: 3306
    targetPort: 3306
    nodePort: 30100
  type: NodePort
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
  strategy:
    type: Recreate
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
          value: test123456
        ports:
        - containerPort: 3306
          name: mysql
        volumeMounts:
        - name: mysql-persistent-storage
          mountPath: /var/lib/mysql
      volumes:
      - name: mysql-persistent-storage
        persistentVolumeClaim:
          claimName: mysql-pv-claim
```

## elasticsearch

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: znsj-es
  namespace: znsj-gpu-sit
spec:
  serviceName: znsj-es
  replicas: 1
  selector:
    matchLabels:
      app: znsj-es
  template:
    metadata:
      labels:
        app: znsj-es
    spec:
      imagePullSecrets:
      - name: "registry-key"
      containers:
      - name: elasticsearch
        image: cr.registry.res.pdcloud.cn/znsj-repo/fc-es:v7.17.7
        ports:
        - containerPort: 9200
          name: rest
        - containerPort: 9300
          name: inter-node
        env:
        - name: cluster.name
          value: elasticsearch
        - name: node.name
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: discovery.seed_hosts
          value: "elasticsearch-0.elasticsearch"
        # es7.x版本（集群用这个，单点用single-node，不能一起使用）
        - name: cluster.initial_master_nodes
          value: "elasticsearch-0"
        # 单点用这个，不能和上面共用
        - name: discovery.type
          value: single-node
        volumeMounts:
        - name: es-data
          mountPath: /usr/share/elasticsearch/data
      securityContext:
        fsGroup: 1000
      volumes:
      - name: es-data
        persistentVolumeClaim:
          claimName: nas-znsj-es-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: znsj-es-svc
  namespace: znsj-gpu-sit
spec:
  selector:
    app: znsj-es
  ports:
  - port: 9200
    targetPort: rest
  type: ClusterIP
```

## redis

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: fc-redis
  namespace: znsj-gpu-sit
spec:
  serviceName: "fc-redis"
  replicas: 1
  selector:
    matchLabels:
      app: fc-redis
  template:
    metadata:
      labels:
        app: fc-redis
    spec:
      imagePullSecrets:
      - name: "registry-key"
      containers:
      - name: redis
        image: cr.registry.res.pdcloud.cn/znsj-repo/fc-redis:v1
        ports:
        - containerPort: 6379
          name: redis
        command:
        - redis-server
        - /etc/redis/redis.conf
---
apiVersion: v1
kind: Service
metadata:
  name: fc-redis-svc
  namespace: znsj-gpu-sit
spec:
  selector:
    app: fc-redis
  ports:
  - port: 6379
    targetPort: redis
  type: ClusterIP
```

## prometheus

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: znsj-gpu-sit
spec:
  selector:
    matchLabels:
      app: prometheus
  replicas: 1
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      imagePullSecrets:
      - name: "registry-key"
      containers:
      - name: prometheus
        image: cr.registry.res.pdcloud.cn/znsj-repo/prometheus:v2.53.2
        args:
          - '--config.file=/etc/prometheus/prometheus.yml'
          - '--storage.tsdb.path=/prometheus'
        ports:
        - containerPort: 9090
          name: web
        volumeMounts:
        - name: prometheus-config-volume
          mountPath: /etc/prometheus
        - name: prometheus-storage-volume
          mountPath: /prometheus
      volumes:
      - name: prometheus-config-volume
        configMap:
          name: prometheus-config
      - name: prometheus-storage-volume
        persistentVolumeClaim:
          claimName: nas-prometheus-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: znsj-gpu-sit
spec:
  selector:
    app: prometheus
  ports:
  - port: 9090
    targetPort: web
  type: ClusterIP
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: znsj-gpu-sit
data:
  prometheus.yml: |
    global:
      scrape_interval:     15s
      evaluation_interval: 15s

    scrape_configs:
    - job_name: 'prometheus'
      static_configs:
      - targets: ['localhost:9090']
```

