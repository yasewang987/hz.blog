# 云开发 - Theia

## http部署

```bash
docker run -d --init -p 3000:3000 --name theia -v "$(pwd)/projects:/home/project:cached" theiaide/theia-full
```

部署完毕之后访问 http://localhost:3000 即可


## https部署

```bash
docker run -d --name theia --init -p 10443:10443 -e token=mytoken -v "$(pwd)/projects:/home/project:cached" theiaide/theia-ht
tps
```

部署完毕之后访问 https://localhost:10443/ 一般会提示不安全，继续输入 `token` 即可进入