# 常用Dockerfiles


## dockerfile-tools

包含常用工具的镜像`vim,ping,curl`

dockerhub镜像名：`yasewang/tool`

```dockerfile
FROM ubuntu
LABEL Name=tool Version=0.0.1
RUN apt-get -y update && apt-get install -y vim && apt-get install -y iputils-ping && apt-get install -y curl
```

## dockerfile-go

```dockerfile
FROM golang:1.16 as builder
ENV GO111MODULE=on \
    GOPROXY=https://goproxy.cn,direct \
    CGO_ENABLED=0 \
    GOOS=linux
WORKDIR /app
COPY . .
RUN go build -o alertsystem ./src

FROM alpine
WORKDIR /app
RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
COPY --from=builder /app/alertsystem .
ENV GIN_MODE=release \
    PORT=80
EXPOSE 80
ENTRYPOINT ["./alertsystem"]
```

## dockerfile-python

```dockerfile
FROM python:3

WORKDIR /app

COPY requirements.txt ./
RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && pip install -i http://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com -r requirements.txt

COPY . .

CMD ["python", "./init.py"]
```

## dockerfile-tensorflow

基础镜像版本根据自己的需求选择

```dockerfile
FROM tensorflow/tensorflow:1.13.2-gpu-py3
WORKDIR /app
COPY ./requirements.txt .
RUN pip install --ignore-installed -i http://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com -r requirements.txt
```
## dockerfile-pytorch

基础镜像版本根据自己的需求选择

```dockerfile
FROM pytorch/pytorch:1.3-cuda10.1-cudnn7-runtime
WORKDIR /app
COPY ./requirements.txt .
RUN pip install --ignore-installed -i http://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com -r requirements.txt
```

## dockerfile-pyltp

`pyltp` 目前只支持 `python3.6` 版本的 `pip` 安装，所以需要确认官方镜像的python版本,可以通过基础镜像的官方github仓库查看对应分支的`Dockerfile`确认

```dockerfile
FROM pytorch/pytorch:1.3-cuda10.1-cudnn7-runtime
WORKDIR /app
COPY ./requirements.txt .
RUN pip install --ignore-installed -i http://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com -r requirements.txt
```
