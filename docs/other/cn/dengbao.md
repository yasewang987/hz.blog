# DB3.0评测

## 涉及基础内容

找专业的机构去做测评（预计总计10w），里面包括了硬件环境，软件环境等。

1. 网络防火墙（购买下一代防火墙可以不需要waf） - 预计3w
1. 日志审计（包括系统、业务、数据库日志，只需要确认能保持180天的日志即可，可以定时任务备份）
1. 数据库审计- mysql可以通过直接开启`general_log`
1. 堡垒机 - 开源jmpserver
1. WAF防火墙 - 开源雷池等waf防火墙
1. CA证书 - 直接用阿里云免费的，需要将入口设置到WAF上
1. 态势感知（不需要，主要是收集硬件设备运行信息，网络设备少不需要）

## mysql开启审计

```sql
# 查看general_log是否开启
show global variables like '%general%';

# 开启general_log（0:关闭-OFF，1:开启-ON）
set global general_log=1;
```

永久修改，修改my.cnf文件

```conf
[mysqld]
general_log = on        // on为开启；off为关闭
general_log = 1                                          
general_log_file = /var/log/generalLog.log         // 审计信息存储位置
```

## waf防火墙设置

* 社区版本不支持等保，需要购买企业版（包含审计、防篡改）
* 雷池资料地址：https://waf-ce.chaitin.cn/docs/guide/install

```bash
# 需要先安装docker和docker compose
# 软件依赖：Docker 20.10.14 版本以上
# 软件依赖：Docker Compose 2.0.0 版本以上

# 下载离线包
wget https://demo.waf-ce.chaitin.cn/image.tar.gz
# 加载镜像
cat image.tar.gz | gzip -d | docker load
# 创建雷池运行目录
mkdir -p safeline  &&  cd safeline
# 下载compose编排脚本
wget https://waf-ce.chaitin.cn/release/latest/compose.yaml
# 设置环境变量
cat >> .env <<EOF
SAFELINE_DIR=$(pwd)
IMAGE_TAG=latest
MGT_PORT=9443
POSTGRES_PASSWORD=$(LC_ALL=C tr -dc A-Za-z0-9 </dev/urandom | head -c 32)
SUBNET_PREFIX=172.22.222
IMAGE_PREFIX=chaitin
EOF
# 启动雷池
docker compose up -d
# 重置admin密码
docker exec safeline-mgt resetadmin
```
