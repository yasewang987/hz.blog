# DDNS

github参考地址：https://github.com/TimothyYe/godns

## 阿里云ddns

登录阿里云创建AccessKey,记住id,secret。

新建配置config.json，内容如下：

```json
// 参数介绍在GitHub页面中有
{
  "provider": "AliDNS",
  "email": "accesskey",
  "password": "accesssecret",
  "login_token": "",
  "domains": [
    {
      "domain_name": "91mor.com",
      "sub_domains": [
        "home"
      ]
    }
  ],
  "ip_url": "https://myip.biturl.top", // get public ipv4
  "interval": 300,
  "resolver": "8.8.8.8",
  "socks5_proxy": "",
  "notify": {
    "mail": {
      "enabled": false,
      "smtp_server": "",
      "smtp_username": "",
      "smtp_password": "",
      "smtp_port": 25,
      "send_to": ""
    }
  }
}
```

## 使用docker运行ddns

```bash
docker run -d --name godns --restart=always \
-v /path/to/config.json:/usr/local/godns/config.json timothyye/godns:latest
```