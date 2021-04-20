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