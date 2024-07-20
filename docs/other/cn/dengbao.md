# DB3.0评测

详细内容可以参考wps的等保改造文档【等保内容改造】。

## 涉及基础内容

找专业的机构去做测评（预计总计10w），里面包括了硬件环境，软件环境等。

1. 网络防火墙-天融信ALLIC-F-MTG-1Y （购买下一代防火墙可以不需要waf、需要购买安全模块-入侵、病毒防御） - 预计3w
1. 日志审计，可以自己通过nginx搭建静态文件服务器可以查看log文件（包括系统审计、业务、数据库日志、防火墙日志，只需要确认能保持180天的日志即可，可以定时任务备份）
1. 数据库审计- mysql可以通过直接开启`general_log`、登录失败、密码过期等
1. 堡垒机 - 开源jmpserver
1. WAF防火墙 - 开源雷池等waf防火墙
1. CA证书 - 需要将入口设置到WAF上，所有服务需要https协议
1. 机房硬件环境支持
1. 业务系统（三员版本、双因子认证）
1. 所有服务模块、包含备份系统（都需要有热备机制）
1. 态势感知（不需要，主要是收集硬件设备运行信息，网络设备少不需要）

## 数据库调整

如果使用mariadb建议版本 `10.4.xx` 最新版本

1. 开启审计日志及密码设置

```sql
# 查看general_log是否开启
show global variables like '%general%';

# 开启general_log（0:关闭-OFF，1:开启-ON）
set global general_log=1;
```

永久修改，修改my.cnf文件

```conf
[mysqld]
# 审计日志开启
general_log = 1                                          
general_log_file = /var/log/generalLog.log
# 建议该数据库要求90天定期更换密码
default_password_lifetime = 90
# 登陆错误次数限制
max_password_errors=5
```

1. 建议该数据库安装对应模块，配置密码复杂度策略，要求密码由三种以上字符组成，长度8位以上：

```bash
validate_password_length 8
validate_password_mixed_case_count 1
validate_password_number_count 1
validate_password_policy MEDIUM
validate_password special_char_count 1
```

1. 配置连接超时自动退出时间15分钟，修改参数为`wait_timeout=900`
1. 建议通过ACl或在mysql.user表配置指定白名单IP，对远程管理终端的地址接入范围进行限制（建议先测试是否影响运营）
1. 建议对数据库配置数据、业务数据进行定期备份

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

## 服务器调整

1. 建议设置密码复杂度策略，密码最小长度为8位，在`/etc/pam.d/common-password`文件配置参数为

```bash
# 安装libpam-cracklib模块
apt-get -y install libpam-cracklib
# 在/etc/pam.d/common-password文件配置末尾追加一下参数
password    requisite     pam_cracklib.so minlen=8 ucredit=-1 lcredit=-1 dcredit=-1 ocredit=-1 enforce_for_root
# 在修改密码是至少8位，至少有一个字母小写，至少有一个数字和通用特殊字符
```

1. 建议90天定期更换一次密码，在`/etc/login.defs`文件配置参数为`PASS_MAX_DAYS 90`

```bash
# 使用vim打开/etc/login.defs配置文件，将参数下改为以下数值
PASS_MAX_DAYS   90
PASS_MIN_DAYS   0
PASS_WARN_AGE   8
```

1. 建议启用登录失败处理功能，限制非法登录次数10次，超过10次锁定账户300秒，在 `/etc/pam.d/common-auth`文件配置参数

```bash
# 安装libpam-cracklib模块
apt-get -y install libpam-cracklib

# 在/etc/pam.d/common-auth文件开始处或现有的pam_unix.so行之前,添加以下行
auth        required      pam_tally2.so deny=10 even_deny_root unlock_time=300 root_unlock_time=300

# 可以尝试使用错误的密码登录5次后，账户会不会被锁定，以验证配置是否有效

# 清除用户锁定限制
/usr/sbin/pam_tally2 --user root --reset
```

1. 建议设置连接超时自动退出时间900秒，在`/etc/profile`文件配置参数为`export TMOUT=900`。

```bash
# 在/etc/profile文件的末尾添加以下行
export TMOUT=900

# 手动重新加载配置文件
source /etc/profile
```

1. 配置启用audit安全审计服务

```bash
# 安装auditd：使用以下命令安装auditd
apt-get -y install auditd

# 配置audit规则：编辑 /etc/audit/rules.d/audit.rules 文件，添加需要审计的规则。
# auditd 的配置文件通常位于/etc/audit/auditd.conf

# 启动auditd服务：使用以下命令启动auditd服务
sudo systemctl start auditd.service

# 例如执行sudo命令，并检查/var/log/audit/audit.log文件中是否记录了审计事件。
```

1. 对审计记录进行保护，定期备份，避免受到未预期的删除、修改或覆盖等，在`/etc/logrotate.conf`文件将参数`rotate 4`修改为 `rotate 26`，确保审计日志记录保存时间可达到6个月以上

```bash
# 使用vim打开/etc/logrotate.conf配置文件，将rotate 4参数下改为以下参数
rotate 26
```

1. 对登录接入范围进行限制，通过网络安全设备或在/etc/hosts.deny（需有一条拒绝所有的）、/etc/hosts.allow文件对IP地址接入范围进行有效限制，仅允许指定IP地址（如堡垒机）接入（建议先在一台机子上测试）

只允许堡垒机内网ip及部分指定内网ip、指定单个外网ip直接访问。

1. 安装杀毒软件如clamav，及时更新版本和病毒库

```bash
# 安装杀毒软件clamav
apt -y install clamav clamav-daemon

# 更新病毒库，停止守护进程
systemctl stop clamav-daemon
service clamav-freshclam stop
freshclam
service clamav-freshclam restart
systemctl restart clamav-daemon


# 撰写脚本，制作周期计划任务
1 5 * * 7 bash ~/shells/clamav.sh

#### 脚本内容
#!/bin/bash
DATE_TIME=$(date +%F)
LOG_FILE=/root/shells/clamav_log/${DATE_TIME}_clamav.log
#方便及时打断输出脚本执行pid号
echo "打断脚本执行使用: kill  $$"
echo "生成备份日志: $LOG_FILE"
function msg_info(){
    echo -e "\033[34m $(date +%Y-%m-%d\ %H:%M:%S)   | [INFO]\t$@ \033[0m"   >>$LOG_FILE
    echo -e "\033[34m $(date +%Y-%m-%d\ %H:%M:%S)   | [INFO]\t$@ \033[0m"
}
function msg_err(){
    echo -e "\033[31m $(date +%Y-%m-%d\ %H:%M:%S)   | [ERROR]\t$1  \033[0m"   >>$LOG_FILE
    echo -e "\033[31m $(date +%Y-%m-%d\ %H:%M:%S)   | [INFO]\t$@ \033[0m"
    exit "$2"
}

if [ ! -d "/root/shells/clamav_log" ]; then mkdir -p /root/shells/clamav_log; fi

function clamav(){
    msg_info "正在升级clamav" && apt install --only-upgrade clamav && msg_info "clamav升级成功" || msg_err "升级失败"
    msg_info "正在同步病毒库…………"
    systemctl stop clamav-daemon && msg_info "关闭clamav成功" || msg_err "关闭clamav失败"
    service clamav-freshclam stop && msg_info "关闭守护进程成功" || msg_err "关闭守护进程失败"
    freshclam && msg_info "同步病毒库成功！！！" || msg_err "同步病毒库失败"
    service clamav-freshclam restart && msg_info "重启守护进程成功"  || msg_err "重启守进程失败"
    systemctl restart clamav-daemon && msg_info "重启clamav成功"  || msg_err "重启clamav失败"
}

clamav
```

1. 定期备份对应文件（可每周备份）：`/etc,/审计日志,/中间件相关,/应用系统相关`

直接使用脚本定期备份对应的物理文件。

1. 对`Nginx、Tomcat`日志做定期备份或修改配置，确保日志保留时间可以达到180天以上

直接使用脚本定期备份对应的物理文件。

1. 所有服务器时区统一使用上海时区

## 堡垒机

1. 设置密码复杂度要求（最小长度8位，由大写字母、小写字母、数字、特殊符号组成）
1. 设置密码有效期90天
1. 使用https协议，关闭http协议
1. 双因子登录措施（如用户名密码+短信验证码/邮箱验证码等）（可仅针对管理员用户）
1. 限制IP登陆范围（只允许公司外网ip访问）

## 应用系统

1. 建议为三员版本（系统管理员、安全管理员、安全审计员），权限要分离。
1. 密码有效期设置（7天）
1. 登陆失败措施（密码错误多少次锁定，锁定后怎么解锁）
1. 空闲登录限制（无操作自动退出时间修改为30分钟或30分钟以内）
1. 双因子认证
1. 日志（操作日志、登陆日志等审计日志），只有安全审计员可以查看
1. 字符（%￥……&，防SQL注入）过滤代码：输入框的特殊字符过滤
1. 对数据库、应用系统数据进行定期备份
1. 提供清除用户cookies、会话session代码：用户登出清除用户鉴别信息（前端处理即可）
1. 所有服务都需要有双份备份

## windows终端

1. 配置超时锁定屏幕策略
1. 建议通过网络层面的访问控制规则措施禁用高危端口21、135、137~139和445、3389。防火墙入站规则阻止高危端口
1. 确保日志保留时间达到180天(右键此电脑，选择管理选项-安全-属性，修改日志属性大小)
1. 禁用高危服务（禁用无用的打印机等服务）
1. 建议安装杀毒软件（火绒安全卫士：个人版亦可以），并更新到最新版本和最小病毒库

## 机房调整

1. 部署手提式气体灭火器（如二氧化碳灭火器）
1. 网线使用标签标记一下目标及源地址
1. 交换机等硬件设备需要用螺丝等固定
1. 漏水检测绳（电商购买）
1. 防静电手环（同上）
1. 网线和电源线分开走线
1. 机房内各区域所有机柜及内部设备均通过接地线安全接地
1. 具备建筑物抗震设防审批文档（书面报告/说明照片）- 可选
1. 机房、应急供电间等相关工作房间提供建筑材料为具有耐火等级的说明书（照片）-可选

## 硬件防火墙调整

1. 防火墙限制流量进入的端口【增加禁用25、135、137、445高危端口】（可以开通业务服务端口+any）-外到内，最下面还需要增加一条拒绝所有的策略。
1. 防火墙开通（入侵防御、病毒防御）
1. 防火墙的日志发送到固定的日志服务器上（登陆、业务日志，流量日志如果太多可以选择部分高级别日志）- 搭配服务器开启rsyslog的514端口的udp服务，会默认保存到`/var/log/syslog`中
1. 防火墙设置只允许指定内网ip访问，如（192.168.0.85、86、169、171）
1. 防火墙设置90天修改密码

