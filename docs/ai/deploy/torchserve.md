# TorchServe使用说明

官方github地址：https://github.com/pytorch/serve

说明文档参考地址：https://github.com/pytorch/serve/tree/master/docs

## TorchServe部署

### Docker部署

官方Docker安装教程地址：https://github.com/pytorch/serve/blob/master/docker/README.md

* 前置条件

    * 安装docker 19.03 及以上版本
    * 安装 [nvidia显卡驱动](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/install-nvidia-driver.html)
    * 安装 [nvidia container toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html#installing-on-ubuntu-and-debian)

* 下载 TorchServe 镜像，[dockerhub链接](https://hub.docker.com/r/pytorch/torchserve/tags?page=1&ordering=last_updated),注意一下自己需要的 `cuda版本`.
* 运行 TorchServe 容器以启动服务：
    
    我这里使用的镜像是 `pytorch/torchserve:0.2.0-cuda10.1-cudnn7-runtime`,是一个GPU版本的镜像

    ```bash
    # 新建文件夹保存模型文件
    mkdir model-server && cd model-server
    mkdir model-store && mkdir examples

    # 启动容器
    docker run --rm -d --gpus all -p 8080-8082:8080-8082 -p 7070-7071:7070-7071 -v $(pwd)/model-store:/home/model-server/model-store -v $(pwd)/examples:/home/model-server/examples pytorch/torchserve:0.2.0-cuda10.1-cudnn7-runtime
    ```

    * 8080提供服务接口，8081提供管理接口，8082提供监控接口

## TorchServe控制面解析

官方ManagementAPI地址：https://github.com/pytorch/serve/blob/master/docs/management_api.md

### 模型加载（Register a model）

`POST /models`

支持参数：`url`,`model_name`,`handler`,`runtime`,`batch_size`,`max_batch_delay`,`initial_workers`,`synchronous`,`response_timeout`

```bash
# 正常加载，这个时候并启用，因为没有设置线程去运行改模型
curl -X POST  "http://localhost:8081/models?url=https://torchserve.pytorch.org/mar_files/squeezenet1_1.mar"

{
  "status": "Model \"squeezenet_v1.1\" Version: 1.0 registered with 0 initial workers. Use scale workers API to add workers for the model."
}

# 异步加载模型并启用（synchronous=false表示异步）
curl -v -X POST "http://localhost:8081/models?initial_workers=1&synchronous=false&url=https://torchserve.pytorch.org/mar_files/squeezenet1_1.mar"

< HTTP/1.1 202 Accepted
< content-type: application/json
< x-request-id: 4dc54158-c6de-42aa-b5dd-ebcb5f721043
< content-length: 47
< connection: keep-alive
< 
{
  "status": "Processing worker updates..."
}
```

### 伸缩模型工作线程数（Scale workers）

`PUT /models/{model_name}`

支持参数：`min_worker`,`max_worker`,`synchronous`,`timeout`

```bash
# 设置,默认异步方式
curl -v -X PUT "http://localhost:8081/models/squeezenet1_1?min_worker=3"

< HTTP/1.1 202 Accepted
< content-type: application/json
< x-request-id: 42adc58e-6956-4198-ad07-db6c620c4c1e
< content-length: 47
< connection: keep-alive
< 
{
  "status": "Processing worker updates..."
}

# 同步
curl -v -X PUT "http://localhost:8081/models/squeezenet1_1?min_worker=3&synchronous=true"

< HTTP/1.1 200 OK
< content-type: application/json
< x-request-id: b72b1ea0-81c6-4cce-92c4-530d3cfe5d4a
< content-length: 63
< connection: keep-alive
< 
{
  "status": "Workers scaled to 3 for model: squeezenet1_1"
}
```

### 设置模型默认版本（Set Default Version）

`PUT /models/{model_name}/{version}/set-default`

```bash
curl -v -X PUT http://localhost:8081/models/squeezenet1_1/2.0/set-default
```

### 查询模型信息（Describe model）

```bash
# 查询所有模型
curl "http://localhost:8081/models"
{
  "models": [
    {
      "modelName": "squeezenet1_1",
      "modelUrl": "https://torchserve.pytorch.org/mar_files/squeezenet1_1.mar"
    }
  ]
}
```

`GET /models/{model_name}` ： 默认版本

```bash
curl http://localhost:8081/models/squeezenet1_1
[
  {
    "modelName": "squeezenet1_1",
    "modelVersion": "1.0",
    "modelUrl": "https://torchserve.pytorch.org/mar_files/squeezenet1_1.mar",
    "runtime": "python",
    "minWorkers": 1,
    "maxWorkers": 1,
    "batchSize": 1,
    "maxBatchDelay": 100,
    "loadedAtStartup": false,
    "workers": [
      {
        "id": "9000",
        "startTime": "2021-04-23T02:42:57.999Z",
        "status": "READY",
        "gpu": false,
        "memoryUsage": 196386816
      }
    ]
  }
]
```

`GET /models/{model_name}/{version}` : 带版本号

```bash
curl http://localhost:8081/models/squeezenet1_1/2.0
```

`GET /models/{model_name}/all`:所有版本

```bash
curl http://localhost:8081/models/squeezenet1_1/all
```

### 测试模型效果

```bash
# 下载图片
curl -O https://raw.githubusercontent.com/pytorch/serve/master/docs/images/kitten_small.jpg

# 测试模型效果
curl http://localhost:8080/predictions/squeezenet1_1 -T kitten_small.jpg
# 正常输出如下信息：
{
  "lynx": 0.5370931625366211,
  "tabby": 0.2835577428340912,
  "Egyptian_cat": 0.10669822245836258,
  "tiger_cat": 0.06301568448543549,
  "leopard": 0.006023923866450787
}
```

### 卸载模型（Unregister a model）

`DELETE /models/{model_name}/{version}`

```bash
curl -X DELETE http://localhost:8081/models/squeezenet1_1/1.0

{
  "status": "Model \"squeezenet1_1\" unregistered"
}
```

### 查看所有API描述（API Description）

```bash
# To view all inference APIs:
curl -X OPTIONS http://localhost:8080

# To view all management APIs:
curl -X OPTIONS http://localhost:8081
```

## TorchServe监控解析

