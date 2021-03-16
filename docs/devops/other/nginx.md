# Nginx

Nginx 是一个采用主从架构的 Web 服务器，可用于反向代理、负载均衡器、邮件代理和 HTTP 缓存。

## Nginx 基本配置 & 示例

首先，在本地创建如下的目录结构:

```
.
├── nginx-demo
│  ├── content
│  │  ├── first.txt
│  │  ├── index.html
│  │  └── index.md
│  └── main
│    └── index.html
└── temp-nginx
  └── outsider
    └── index.html
```

这里，我们有两个单独的文件夹 nginx-demo 和 temp-nginx，每个文件夹都包含静态 HTML 文件。我们将着力在一个公共端口上运行这两个文件夹，并设置我们想要的规则。

1. 添加配置的基本设置。一定要添加 events {}，因为在 Nginx 架构中，它通常用来表示 worker 的数量。在这里我们用 http 告诉 Nginx 我们将在 OSI 模型 的第 7 层作业。

    这里，我们告诉 Nginx 监听 5000 端口，并指向 main 文件夹中的静态文件。
    
    ```
    http {

    server {
      listen 5000;
      root /path/to/nginx-demo/main/; 
      }

    }

    events {}
    ```
1. 接下来我们将为 /content 和 /outsider URL 添加其他的规则，其中 outsider 将指向第一步中提到的根目录之外的目录。

    这里的 location /content  表示无论我在叶（leaf）目录中定义了什么根（root），content 子 URL 都会被添加到定义的根 URL 的末尾。因此，当我指定 root 为 root /path/to/nginx-demo/时，这仅仅意味着我告诉 Nginx 在 http://localhost:5000/path/to/nginx-demo/content/ 文件夹中显示静态文件的内容。

    ```
    http {

      server {
          listen 5000;
          root /path/to/nginx-demo/main/; 

          location /content {
              root /path/to/nginx-demo/;
          }   

          location /outsider {
              root /path/temp-nginx/;
          }
      }
    }

    events {}
    ```
1. 接下来，我们在主服务器上编写一个规则来防止任意 .md 文件被访问。我们可以在 Nginx 中使用正则表达式，因此我们将这样定义规则：

    ```
    location ~ .md {
          return 403;
    }
    ```
1. 最后，让我们学习下 proxy_pass 命令来结束这个章节。我们已经了解了什么是代理和反向代理，在这里我们从定义另一个运行在 8888 端口上的后端服务器开始。现在，我们在 5000 和 8888 端口上运行了 2 个后端服务器。

    我们要做的是，当客户端通过 Nginx 访问 8888 端口时，将这个请求传到 5000 端口，并将响应返回给客户端！

  ```
  server {
      listen 8888;

      location / {
          proxy_pass http://localhost:5000/;
      }

      location /new {
          proxy_pass http://localhost:5000/outsider/;
      }
  }
  ```

## Nginx常用命令

```bash
# 首次启动 Nginx Web 服务器
sudo nginx

# 重新加载正在运行的 Nginx Web 服务器
sudo nginx -s reload

# 停止正在运行中的 Nginx Web 服务器
sudo nginx -s stop

# 查看系统上运行的 Nginx 进程
ps -ef | grep Nginx
sudo kill -9 <PID>
```