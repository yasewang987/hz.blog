# 网站防火墙

在社区广受好评的网站防护工具 —— SafeLine Web 安全网关。

简单来说这是一个自带安全 buf 的 Nginx，它基于业界领先的语义分析检测技术开发，作为反向代理接入，保护你的网站不受黑客攻击。

* 攻击事件：用于查看黑客攻击的日志和统计
* 访问控制：支持对源 IP、Host、Path、Header 、Body 配置黑白名单
* 频率限制：基于 IP 和 Session 限制客户端的访问频率 ，可以有效防 CC 攻击
* 人机验证：识别客户端是不是自然人，可以用来对抗爬虫、对抗机器人
* 语义分析引擎：企业级语义分析检测引擎，高性能，支持 0day 防护

## 安装

```bash
git clone https://github.com/chaitin/SafeLine.git
cd SafeLine
bash ./release/latest/setup.sh

# 命令执行成功后，打开浏览器访问 127.0.0.1:9443，即可看到 SafeLine 的控制台登录界面，使用 totp 软件扫描绑定就可以开始使用了。
```