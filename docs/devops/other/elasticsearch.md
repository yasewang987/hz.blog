# elasticsearch安装

`config/elasticsearch.yml` 内容：

```yml
http.host: 0.0.0.0

# 设置启动默认端口号
http.port: 19200
```

## docker启动es

运行容器命令（elasticsearch文件夹下运行）：

```bash
sudo docker run --name elasticsearch -p 9200:9200 -p 9300:9300 \
-e "discovery.type=single-node" \
-v $PWD/config/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml \
-v $PWD/data:/usr/share/elasticsearch/data \
-v $PWD/plugins:/usr/share/elasticsearch/plugins \
-d --restart=always elasticsearch:7.1.0
```

## 直接启动es

```bash
# 解压
tar zxvf elasticsearch-7.14.0-linux-aarch64.tar.gz -C /opt/mytest/

# (涉密服务器直接用root帐号)es不允许root账户运行必须创建账号
useradd mytest
chown mytest:mytest /opt/mytest -R

# 使用自带的jdk（修改 bin/elasticsearch-env 文件）
# 注释掉下面几行即可
elif [ ! -z "$JAVA_HOME" ]; then
  # fallback to JAVA_HOME
  echo "warning: usage of JAVA_HOME is deprecated, use ES_JAVA_HOME" >&2
  JAVA="$JAVA_HOME/bin/java"
  JAVA_TYPE="JAVA_HOME"

# 启动 -d 后台运行
/opt/mytest/elasticsearch/bin/elasticsearch -d
```

## 查看信息

```bash
# 查看到es对应的版本和基本信息
curl http://localhost:9200
# 查看索引信息
curl http://localhost:9200/_cat/indices?v 
```