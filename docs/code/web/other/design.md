# 前端设计工具

## penpot

* 官网：https://penpot.app/
* 帮助中心：https://help.penpot.app/

### 部署

```bash
curl -o docker-compose.yaml https://raw.githubusercontent.com/penpot/penpot/main/docker/images/docker-compose.yaml
docker compose -p penpot -f docker-compose.yaml up -d

# 访问
http://localhost:9001
```