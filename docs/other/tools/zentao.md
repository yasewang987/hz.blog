# 蝉道部署

使用docker安装禅道，在禅道官方的方式：https://www.zentao.net/book/zentaopmshelp/303.html，在官方论坛中，有一篇使用docker中央仓库的禅道二次部署
封装的帖子（idoop/zentao）：https://www.zentao.net/thread/87209.html

区别：idoop/zentao部署更方便，镜像更小

idoop/zentao镜像官方地址：https://github.com/idoop/zentao

下载镜像：

```bash
docker pull idoop/zentao
```

启动容器

```bash
docker run -d -p 10080:80 -p 13306:3306 -e ADMINER_USER="root" -e ADMINER_PASSWD="zentao" -e BIND_ADDRESS="false" -v $PWD/zentao:/opt/zbox --name zentao idoop/zentao
```

镜像集成基于php的web界面数据库管理工具Adminer，访问地址http://IP:10080/adminer/

* ADMINER_USER：Adminer默认用户名
* ADMINER_PASSWD：Adminer默认密码

* BIND_ADDRESS：是否够允许数据库远程登录（不影响Adminer），设置为fasle，则不绑定IP，即任意IP都能登录（my.cnf：bind-address = 0.0.0.0），默认为true（my.cnf：bind-address = 127.0.0.1）；经过测试在设置为false的情况下，外部虽然能telnet通13306端口，但是数据库工具依然无法连接连接，测试发现，BIND_ADDRESS仅改变了`my.cnf -> bind-address`，而用户登录权限还需要在数据库执行用户赋权限指令。

需要先进入容器，然后执行如下命令：

```bash
cd /opt/zbox/run/mysql
# 数据库默认密码123456
./mysql -uroot -p
# 数据库用户赋权限指令
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'password' WITH GRANT OPTION;
FLUSH PRIVILEGES;
```

当然，如果容器启动参数中不配置BIND_ADDRESS，也可直接修改`/opt/zbox/etc/mysql/my.cnf`，更改是bind-address设置为`bind-address = 0.0.0.0`，并执行数据库用户赋权限指令

访问蝉道：  http://IP:10080  ，zentao默认用户名密码为：`admin:123456`


## 蝉道官方方法安装问题汇总

* 容器启动成功后，docker logs -f {container}查看日志，发现系统报错ERROR 1045 (28000): `Access denied for user 'root'@'localhost' (using password: NO)`，不会影响禅道的正常使用（原因未知，猜测是php程序启动时建立了无密码的默认配置连接所导致，由于之后又使用了用户设置的`my.php`的数据库配置，因此程序功能正常）

* 重启docker容器，发现10080端口无法访问，查看日志发现报错：`The apache2 instance did not start within 20 seconds. Please read the log files to discover problems`，在官方寻找答案，发现是官方已说明是脚本BUG，apache未正常启动的解决方法为：`/etc/init.d/apache2 restart`，原因是当数据库启动过慢，apache先启动时，php程序数据库无法连接，导致程序启动失败，因此重启apache，问题解决

* 如果需要将zentao容器中的数据库3306端口映射处理，需要修改数据库配置，并更改容器启动参数

    ```bash
    find / -name my.cnf
    cd /etc/mysql
    cat /etc/mysql/mariadb.conf.d/50-server.cnf
    # 修改bind-address，并执行<数据库用户赋权限指令>
    ```

* 修改数据库密码后，需要需改my.php中的数据库密码，并且在升级禅道时需要修改MYSQL_ROOT_PASSWORD变量

* 安装过程中需要实时构建，部分源下载速度慢耗时过长；构建后的镜像500M+，`idoop/zentao` 100M+