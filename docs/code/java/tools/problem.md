# Java问题处理

## jdk容器时区问题

```bash
# 映射本机时区
docker run -d -v /etc/localtime:/etc/localtime --name hello helloworld

# 设置jvm默认时区
java -jar -Duser.timezone=Asia/Shanghai app.jar
```