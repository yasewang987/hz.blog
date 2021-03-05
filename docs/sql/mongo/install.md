# MongoDB安装

## Docker安装MongoDB

```bash
docker run -d -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=myusername -e MONGO_INITDB_ROOT_PASSWORD=mypassword -e MONGO_INITDB_DATABASE=mydb -v /home/mongodb/data:/data/db --name mongodb mongo
```