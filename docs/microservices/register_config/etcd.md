# etcd安装

参考：https://github.com/etcd-io/etcd/releases 最新的docker安装即可

国内无法直接访问到官网推荐的镜像，需要更换为：`bitnami/etcd`

```bash
# 拉取镜像
docker pull bitnami/etcd
# 创建文件夹
mkdir -p ~/etcd/data && chmod 777 ~/etcd/data
# 创建配置文件(参考https://github.com/etcd-io/etcd/blob/main/etcd.conf.yml.sample)
# 通过指定环境变量可以不创建
vim ~/etcd/etcd.conf.yml

# 默认环境变量：
# ETCD_ADVERTISE_CLIENT_URLS：http://127.0.0.1:2379
# ETCD_AUTO_TLS：false
# ETCD_CLIENT_CERT_AUTH：false
# ETCD_DATA_DIR：/bitnami/etcd/data
# ETCD_LISTEN_CLIENT_URLS：http://0.0.0.0:2379
# ETCD_LOG_LEVEL：info
# ETCD_PEER_AUTO_TLS：false
# ETCD_TRUSTED_CA_FILE=
# ETCD_DISABLE_STORE_MEMBER_ID=no
# ETCD_CONF_FILE=/opt/bitnami/etcd/conf/etcd.yaml
# ETCD_LISTEN_PEER_URLS=
# ETCD_ON_K8S=no
# ETCD_SNAPSHOTS_DIR=/snapshots
# ETCD_BIN_DIR=/opt/bitnami/etcd/bin
# ETCD_VOLUME_DIR=/bitnami/etcd
# ETCD_INITIAL_CLUSTER_TOKEN=
# ETCD_NAME=
# ETCD_ROOT_PASSWORD=
# ETCD_CLUSTER_DOMAIN=
# ETCD_DISASTER_RECOVERY=no
# ETCD_KEY_FILE=
# ETCD_CONF_DIR=/opt/bitnami/etcd/conf
# ETCD_DAEMON_GROUP=etcd
# ETCD_START_FROM_SNAPSHOT=no
# ETCD_INIT_SNAPSHOT_FILENAME=
# ETCD_INIT_SNAPSHOTS_DIR=/init-snapshot
# ETCD_DISABLE_PRESTOP=no
# ETCD_TMP_DIR=/opt/bitnami/etcd/tmp
# ETCD_INITIAL_CLUSTER_STATE=
# ETCD_BASE_DIR=/opt/bitnami/etcd
# ETCD_INITIAL_CLUSTER=
# ETCD_CERT_FILE=
# ETCD_NEW_MEMBERS_ENV_FILE=/bitnami/etcd/data/new_member_envs
# ETCD_DAEMON_USER=etcd
# ETCD_INITIAL_ADVERTISE_PEER_URLS=
# 启动容器
docker run -d --name etcd \
 -v $HOME/etcd/data:/bitnami/etcd/data \
 -e ETCD_NAME=s1 \
 -e ETCD_ADVERTISE_CLIENT_URLS='http://0.0.0.0:2379' \
 -e ETCD_LISTEN_CLIENT_URLS='http://0.0.0.0:2379' \
 -e ETCD_LISTEN_PEER_URLS='http://0.0.0.0:2380' \
 -e ETCD_INITIAL_ADVERTISE_PEER_URLS='http://0.0.0.0:2380' \
 -e ETCD_INITIAL_CLUSTER='s1=http://0.0.0.0:2380' \
 -e ETCD_INITIAL_CLUSTER_TOKEN=mytoken \
 -e ETCD_INITIAL_CLUSTER_STATE=new \
 -e ETCD_ROOT_PASSWORD=hzpwd \
 bitnami/etcd:latest

# 进入容器验证
docker exec etcd etcd --version
docker exec etcd etcdctl version
docker exec etcd etcdutl version
docker exec etcd etcdctl --user=root --password=hzpwd endpoint health
docker exec etcd etcdctl --user=root --password=hzpwd put foo bar
docker exec etcd etcdctl --user=root --password=hzpwd get foo
```

# etcd-watch机制

通过 etcdctl 命令行工具实现键值对的检测：

```bash
etcdctl --user=root --password=hzpwd put foo bar
etcdctl --user=root --password=hzpwd put foo bar2
# 开启watch监控foo的变化（指定版本号从1开始）
etcdctl --user=root --password=hzpwd watch foo -w=json --rev=1
# 输出
{"Header":{"cluster_id":4560255704285051037,"member_id":11840245738679262175,"revision":3,"raft_term":4},"Events":[{"kv":{"key":"Zm9v","create_revision":2,"mod_revision":2,"version":1,"value":"YmFy"}},{"kv":{"key":"Zm9v","create_revision":2,"mod_revision":3,"version":2,"value":"YmFyMg=="}}],"CompactRevision":0,"Canceled":false,"Created":false}
# 再次更新
etcdctl --user=root --password=hzpwd put foo bar3
# 输出
{"Header":{"cluster_id":4560255704285051037,"member_id":11840245738679262175,"revision":4,"raft_term":4},"Events":[{"kv":{"key":"Zm9v","create_revision":2,"mod_revision":4,"version":3,"value":"YmFyMw=="}}],"CompactRevision":0,"Canceled":false,"Created":false}
```