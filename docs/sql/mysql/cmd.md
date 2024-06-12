# mysql常用命令

```bash
# 登陆
mysql -uroot -p
# 查询全局变量
show global variables like '%plugin_dir%';
# 设置全局变量
set global wait_timeout=900;
# 查询会话变量
show variables like 'plugin_dir';
# 设置会话变量
set wait_timeout=900;

# 更新密码
update user set authentication_string=password('123456') where user='root';
# 更新host
update user set host='%' where user='root';


#### 插件相关操作
# 查看已安装插件
show plugins;
# 查看插件安装目录
show variables like 'plugin_dir';
# 安装validate_password插件
INSTALL PLUGIN validate_password SONAME 'validate_password.so';
# mariadb的密码复杂度设置
INSTALL SONAME 'simple_password_check';
# 查看密码全局变量设置
show variables like '%password%';
```