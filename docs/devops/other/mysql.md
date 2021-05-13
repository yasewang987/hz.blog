# mysql安装

## mysql5.7

mysqld.cnf 内容如下：

```conf
[mysqld]
pid-file        = /var/run/mysqld/mysqld.pid
socket          = /var/run/mysqld/mysqld.sock
datadir         = /var/lib/mysql
#log-error      = /var/log/mysql/error.log
# By default we only accept connections from localhost
#bind-address   = 127.0.0.1
# Disabling symbolic-links is recommended to prevent assorted security risks
symbolic-links=0
```

运行容器命令(mysql文件夹下运行)：

```bash
sudo docker run -d --restart=always -p 3306:3306 \
-v "$PWD/mysqld.cnf":/etc/mysql/mysql.conf.d/mysqld.cnf \
-v "$PWD/data":/var/lib/mysql \
-e MYSQL_ROOT_PASSWORD="ifuncun888" \
--name mysql mysql:5.7
```


## nginx反向代理

监听具备公网ip服务器的3307端口，实现跳转到172.31.88.27的3306端口。

特别注意：stream要与http在同级目录  

```conf
stream {
    upstream mysql3306 {
        hash $remote_addr consistent;
        server 172.31.88.27:3306 weight=5 max_fails=3 fail_timeout=30s;
    }
	
	 server {
        listen 3307;
        proxy_connect_timeout 10s;
        proxy_timeout 200s;
        proxy_pass mysql3306;
    }
}
```