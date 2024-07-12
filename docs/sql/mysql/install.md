# Linux安装Mysql

## 参考资料

* https://www.cnblogs.com/hello-tl/p/9238298.html

## docker安装mysql

1. 拉取mysql镜像：`docker pull mysql`,默认拉取最新版本，如果要指定版本加上`tag`即可
1. 运行mysql容器：`docker run -d -e MYSQL_ROOT_PASSWORD=123456 --name mysql-xx --restart always -v /data/mysql/data:/var/lib/mysql -p 3308:3306 mysql`
1. 如果有防火墙需要开启防火墙

    ```bash
    //开启防火墙
    # systemctl start firewalld
    //开启3306端口
    # firewall-cmd --zone=public --add-port=3308/tcp --permanent

    # 去除localhost限制
    update user set host='%' where host='localhost';
    flush privileges;

    # 修改密码（mariadb10.x）
    SET PASSWORD FOR 'root'@'localhost' = PASSWORD('newpass');
    ```

1. 如果mysql是 8 版本以上应该会出一下错误:`ERROR 2059 (HY000): Authentication plugin 'caching_sha2_password' cannot be loaded:`  
   解决方案  
   1. 进入mysql容器:`docker exec -it mysql /bin/bash`
   1. 进入mysql:`mysql -uroot -p123456`
   1. 修改密码:`ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY '123456'`
   1. `FLUSH PRIVILEGES;`

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
sql_mode='STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION'
# 开启binlog
log-bin=mysql_bin
server-id=1
binlog_format=Row
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
```

运行容器命令(mysql文件夹下运行)：

```bash
# 如果确定不了配置文件映射到哪个目录，可以跑一个空的容器，执行 mysql --help，
# 查看读取的是哪个配置文件，配置文件中include了哪个目录。需要映射到对应的目录中。
# mysql
sudo docker run -d --restart=always -p 33306:3306 \
-v "$PWD/mysqld.cnf":/etc/mysql/mysql.conf.d/mysqld.cnf \
-v "$PWD/data":/var/lib/mysql \
-e MYSQL_ROOT_PASSWORD="abc" \
--name mysql mysql:5.7

# mariadb
sudo docker run -d --restart=always -p 33306:3306 \
-v "$PWD/mysqld.cnf":/etc/mysql/conf.d/mysqld.cnf \
-v "$PWD/data":/var/lib/mysql \
-e MYSQL_ROOT_PASSWORD="abc" \
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
