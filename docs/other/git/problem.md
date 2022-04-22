# Git问题汇总

* `error: copy-fd: write returned Permission denied`
`fatal: cannot copy '/usr/share/git-core/templates/description' to '/mnt/wk01/xxx/.git/description': Permission denied`

```bash
sudo chmod -R 755 /usr/share/git-core/templates/description
```


* github镜像中的release相关包下载特别慢，获取github代码拉取速度慢，可以使用下面的网址替换 `github.com` 域名

```bash
# 推荐这个速度快
https://hub.fastgit.org
https://github.com.cnpmjs.org
```

* github代码下载很慢

通过 `ipaddress.com` 查询下面几个IP，并设置到 `/etc/hosts` 中

```bash
140.82.114.3 github.com
199.232.69.194 github.global.ssl.fastly.net
185.199.108.153 assets-cdn.github.com
185.199.109.153 assets-cdn.github.com
185.199.110.153 assets-cdn.github.com
185.199.111.153 assets-cdn.github.com
```