# Go Dockerfile

```dockerfile
FROM golang:1.16 as builder
ENV GO111MODULE=on \
    GOPROXY=https://goproxy.cn,direct
WORKDIR /app
COPY . .
RUN GOOS=linux GOARCH=amd64 go build -o alertsystem ./src

FROM alpine
WORKDIR /app
COPY --from=builder /app/alertsystem .
ENV GIN_MODE=release \
    PORT=80
EXPOSE 80
ENTRYPOINT ["./alertsystem"]
```