# Docker-Compose File 详解

## compose安装

[官方安装地址](https://docs.docker.com/compose/install/)

## 配置文件详解

里面涉及到需要依赖 swarm 的配置都去掉了。

```yaml
version: "3"
services:

  redis:
    image: redis:alpine
    ports:
      - "6379"
    networks:
      - frontend
    deploy:
      # 副本数量
      replicas: 2
      # 更新配置
      update_config:
        # 一次性更新的容器数量
        parallelism: 2
        # 重启的等待时间
        delay: 10s
      # 重启策略
      restart_policy:
        condition: on-failure
    # 环境变量
    environment:
      RACK_ENV: development
      SHOW: 'true'

  db:
    image: postgres:9.4
    # 挂载目录
    volumes:
      - db-data:/var/lib/postgresql/data
    networks:
      - backend
    deploy:
      placement:
        constraints: [node.role == manager]
  
  webapp:
    # 构建生成的镜像名
    image: webapp:tag
    # 通过dockerfile构建镜像
    build:
      # Dockerfile 的文件路径，也可以是到链接到 git 仓库的 url
      context: ./dir
      # 设置容器 /dev/shm 分区的大小
      shm_size: '2gb'
      # dockerfile文件名
      dockerfile: Dockerfile-alternate
      # dockerfile中使用的参数
      # ARG buildno
      # RUN echo "Build number: $buildno"
      args:
        buildno: 1
    # 覆盖容器启动后默认执行的命令
    # command: ["bundle", "exec", "thin", "-p", "3000"]
    command: bundle exec thin -p 30001
    # 健康检查
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      # 间隔时间
      interval: 1m30s
      # 超时时间
      timeout: 10s
      # 重试次数
      retries: 3
      # 第一次检查的时间
      start_period: 40s
      # 链接到其它服务的中的容器
      links:
        # 指定链接别名（SERVICE：ALIAS)
        - db:database

  vote:
    image: dockersamples/examplevotingapp_vote:before
    ports:
      - 5000:80
    networks:
      - frontend
    # 启动依赖项
    depends_on:
      - redis
    deploy:
      replicas: 2
      update_config:
        parallelism: 2
      restart_policy:
        condition: on-failure

  result:
    image: dockersamples/examplevotingapp_result:before
    ports:
      - 5001:80
    networks:
      - backend
    depends_on:
      - db
    deploy:
      replicas: 1
      update_config:
        parallelism: 2
        delay: 10s
      restart_policy:
        condition: on-failure

  worker:
    image: dockersamples/examplevotingapp_worker
    networks:
      - frontend
      - backend
    deploy:
      mode: replicated
      replicas: 1
      labels: [APP=VOTING]
      restart_policy:
        condition: on-failure
        delay: 10s
        max_attempts: 3
        window: 120s
      placement:
        constraints: [node.role == manager]

  visualizer:
    image: dockersamples/visualizer:stable
    ports:
      - "8080:8080"
    stop_grace_period: 1m30s
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock"
    deploy:
      placement:
        constraints: [node.role == manager]

# 类似 docker network create
networks:
  frontend:
  backend:
# 类似 docker volume create
volumes:
  db-data:
```

