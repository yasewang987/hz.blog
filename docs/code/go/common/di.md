# Go依赖注入

## Uber-dig

添加引用

```bash
go get github.com/uber-go/dig
```
使用示例
```go
// 构建一个DI容器
func BuildContainer() *dig.Container {
  container := dig.New()
  // 注入config的实例化方法
  container.Provide(NewConfig)
  // 注入database的实例化方法
  container.Provide(ConnectDatabase)
  // 注入repository的实例化方法
  container.Provide(repo.NewPersonRepository)
  // 注入service的实例化方法
  container.Provide(service.NewPersonService)
  // 注入server
  container.Provide(NewServer)

  return container
}

func main() {
  container := BuildContainer()
  
  err := container.Invoke(func(server *Server) {
    server.Run()
  })

  if err != nil {
    panic(err)
  }
}
```

下面是对main函数里基础服务注入的流程说明：

* `BuildContainer`，只将各个基础服务的实例化方法注入到容器里，还没有调用这些方法来实例化基础服务
* `container.Invoke`,这里将会从容器里寻找`server`实例，来运行`server.Run()`。如果实例不存在，则调用其实例化的方法，也就是`NewServer`
* 因为`NewServer(config *config.Config, service *service.PersonService) *Server`依赖于`config.Config`和`service.PersonService`，故触发`NewConfig`和`NewPersonService`方法。
* `NewConfig`不依赖于任何实例，故可以成功返回`config.Config`实例。
* `NewPersonService(config *config.Config, repository *repo.PersonRepository) *PersonService`依赖`config.Config`和`repo.PersonRepository`,继而触发`repo.NewPersonRepository`去实例化`repo.PersonRepository`
* `repo.NewPersonRepository`方法依赖于`db`,故触发`ConnectDatabase`方法，用来连接数据库，实例化`db`实例
* 最后递归倒推回去，完成所有实例的初始化与注入，调用`server.Run()`方法启动`http`服务。

**注意**: 有依赖的初始化方法，需要放在前置依赖注入之后，比如`container.Provide(ConnectDatabase)`就放在`container.Provide(NewConfig)`之后。如果找不到初始化需要的依赖对象，在Invoke时就会报错。
