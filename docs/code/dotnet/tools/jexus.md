# Jexus部署.Net网站

## 参考资料

* 官网：https://www.jexus.org
* 直接搭建参考：https://www.cnblogs.com/GuZhenYin/p/6932237.html
* Dokcer部署参考：https://qinyuanpei.github.io/posts/815861661/

---

## 直接部署

1. 下载安装Jexus：`curl https://jexus.org/release/x64/install.sh|sudo sh`
1. 安装完成之后，jexus在`/usr/jexus`目录下,可以通过`ls /usr`查看
1. 将MVC网站上传到目录`/root/mvc`中（这个目录自己定义，也可以上传到jexus的默认目录`/var/www/default`中）
<!-- more -->
1. 修改jexus的配置文件`vim /usr/jexus/siteconf/default`
   
   ```bash
   ...
   port=4000                  
   root=/ /root/mvc
   ...
   ```
1. 重启jexus：`cd /usr/jexus`,然后执行`./jws restart`

---

## 参考命令

Jexus包括如下操作命令（首先 `cd /usr/jexus`）：
启动：`sudo ./jws start`  
停止：`sudo ./jws stop`  
重启：`sudo ./jws restart`   

---

## Dokcer部署

```bash
FROM ubuntu:14.04
LABEL vendor="qinyuanpei@163.com"

# Prepare Environment
RUN sudo apt-get update 
RUN sudo apt-get install -y
RUN sudo apt-get install -y curl
RUN sudo apt-get install -y wget
RUN sudo curl -sSL https://jexus.org/release/x64/install.sh|sudo sh

# Deploy Website
ADD dest/ /
RUN sudo mv -f aspnetconf /usr/jexus/siteconf/aspnetconf
RUN sudo mkdir -p /var/www
RUN sudo mv ./aspnet /var/www

# Start Jexus
EXPOSE 4000
WORKDIR /usr/jexus
CMD sudo ./jws start aspnet
```
