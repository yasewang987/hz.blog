# Go静态资源使用

可以将静态资源和go一起打包到二进制文件中，主要用于将`vue`生成的网页整合到golang应用中。


## vue示例

vue项目打包生成好静态网站后，直接将`dist`文件夹转移到`golang`项目根目录，然后修改代码如下

```go
package main

import (
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
	"github.com/yasewang987/hz.deploy/handler"
)

func main() {
	// 加载配置文件
	viper.SetConfigFile("./config.yml")
	viper.ReadInConfig()
	// 启动http服务
	addr := viper.Get("addr").(string)
	srv := gin.Default()

	// 前端资源
	srv.Static("/assets", "dist/assets")
	srv.StaticFile("/", "dist/index.html")
	srv.StaticFile("/vite.svg", "dist/vite.svg")

  // 后端api统一使用前缀 /api
	apiGroup := srv.Group("/api")
	// 健康检查
	apiGroup.GET("/health", func(ctx *gin.Context) {
		ctx.JSON(200, "ok")
	})
	// 授权认证
	apiGroup.POST("/login", handler.Login)
	// 文档管理中心
	apiGroup.POST("/uploadfiles", handler.Doc_UploadFiles)
	apiGroup.POST("/removefiles", handler.Doc_RemoveFiles)
	apiGroup.GET("/queryfiles", handler.Doc_QueryFiles)
	// 服务器管理
	apiGroup.GET("/server_query", handler.Server_Query)
	apiGroup.POST("/server_add", handler.Server_Add)
	apiGroup.POST("/server_update", handler.Server_Update)
	apiGroup.POST("/server_remove", handler.Server_Remove)
	apiGroup.POST("/server_info", handler.Server_Info)
	// 启动服务
	srv.Run(addr)
}

```