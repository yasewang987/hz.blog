# OpenSSH国产适配

## 源码编译

下载地址：https://mirrors.aliyun.com/pub/OpenBSD/OpenSSH/portable/

```bash
# 下载
wget https://mirrors.aliyun.com/pub/OpenBSD/OpenSSH/portable/openssh-9.0p1.tar.gz
# 解压
tar -zxf openssh-9.0p1.tar.gz && cd openssh-9.0p1

# 编译
./configure  --prefix=/usr --sysconfdir=/etc/ssh --with-zlib --with-pam  --without-openssl-header-check --with-ssl-dir=/usr/local/ssl --with-privsep-path=/var/lib/sshd

# 执行之后应该会在文件夹中生成rpm包
make

# 安装
make install

# 打开远程登录
sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/g' /etc/ssh/sshd_config
```