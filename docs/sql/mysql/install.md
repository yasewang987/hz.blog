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
    ```

1. 如果mysql是 8 版本以上应该会出一下错误:`ERROR 2059 (HY000): Authentication plugin 'caching_sha2_password' cannot be loaded: ÕÒ²»µ½Ö¸¶¨µÄÄ£¿é¡£`  
   解决方案  
   1. 进入mysql容器:`docker exec -it mysql /bin/bash`
   1. 进入mysql:`mysql -uroot -p123456`
   1. 修改密码:`ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY '123456'`
   1. `FLUSH PRIVILEGES;`

---
