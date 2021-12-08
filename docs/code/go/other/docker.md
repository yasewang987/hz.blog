# Go Dockerfile

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
RUN apk add tzdata \
    && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/localtimezone \
    && apk del tzdata
COPY --from=builder /app/alertsystem /app/config.yaml ./
ENV GIN_MODE=release \
    PORT=80
EXPOSE 80
ENTRYPOINT ["./alertsystem"]
```