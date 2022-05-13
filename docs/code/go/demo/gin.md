# Gin

## 引入Gin

```bash
# 下载包
go get -u github.com/gin-gonic/gin

# 引入gin
import "github.com/gin-gonic/gin"

# (可选)如果使用诸如http.StatusOK之类的常量，则需要引入net/http包
import "net/http"
```
## 常用序列化方法

需要在绑定的字段上设置tag，比如，绑定格式为json，需要设置为 `json:"fieldname"`

* 类型 - Must bind
	* 方法 - Bind, BindJSON, BindXML, BindQuery, BindYAML, BindHeader
	* 行为 - 这些方法底层使用`MustBindWith`，如果存在绑定错误，请求将被以下指令中止 `c.AbortWithError(400, err).SetType(ErrorTypeBind)`，响应状态代码会被设置为400，请求头`Content-Type`被设置为`text/plain; charset=utf-8`。注意，如果你试图在此之后设置响应代码，将会发出一个警告 `[GIN-debug] [WARNING] Headers were already written. Wanted to override status code 400 with 422`，如果你希望更好地控制行为，请使用`ShouldBind`相关的方法。
* 类型 - Should bind
	* 方法 - ShouldBind, ShouldBindJSON, ShouldBindXML, ShouldBindQuery, ShouldBindYAML, ShouldBindHeader。
	* 行为 - 这些方法底层使用 `ShouldBindWith`，如果存在绑定错误，则返回错误，开发人员可以正确处理请求和错误。当我们使用绑定方法时，Gin会根据`Content-Type`推断出使用哪种绑定器，如果你确定你绑定的是什么，你可以使用`MustBindWith`或者`BindingWith`。

下面示例中Password字段使用了`binding:"required"`，加入没有赋值就会报错，如果我们使用`binding:"-"`，那么它就不会报错。

```go
// 绑定为 JSON
type Login struct {
    User     string `form:"user" json:"user" xml:"user"  binding:"required"`
    Password string `form:"password" json:"password" xml:"password" binding:"required"`
}

func main() {
    router := gin.Default()
​
    // JSON 绑定示例 ({"user": "manu", "password": "123"})
    router.POST("/loginJSON", func(c *gin.Context) {
        var json Login
        if err := c.ShouldBindJSON(&json); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        
        if json.User != "manu" || json.Password != "123" {
            c.JSON(http.StatusUnauthorized, gin.H{"status": "unauthorized"})
            return
        } 
        
        c.JSON(http.StatusOK, gin.H{"status": "you are logged in"})
    })
​
    // XML 绑定示例 (
    //  <?xml version="1.0" encoding="UTF-8"?>
    //  <root>
    //      <user>user</user>
    //      <password>123</password>
    //  </root>)
    router.POST("/loginXML", func(c *gin.Context) {
        var xml Login
        if err := c.ShouldBindXML(&xml); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        
        if xml.User != "manu" || xml.Password != "123" {
            c.JSON(http.StatusUnauthorized, gin.H{"status": "unauthorized"})
            return
        } 
        
        c.JSON(http.StatusOK, gin.H{"status": "you are logged in"})
    })
​
    // 绑定HTML表单的示例 (user=manu&password=123)
    router.POST("/loginForm", func(c *gin.Context) {
        var form Login
        //这个将通过 content-type 头去推断绑定器使用哪个依赖。
        if err := c.ShouldBind(&form); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        
        if form.User != "manu" || form.Password != "123" {
            c.JSON(http.StatusUnauthorized, gin.H{"status": "unauthorized"})
            return
        } 
        
        c.JSON(http.StatusOK, gin.H{"status": "you are logged in"})
    })
​
    // 监听并服务于 0.0.0.0:8080
    router.Run(":8080")
}
```
## 简单使用Gin

```go
package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)


func main() {
	// 禁用控制台颜色，当你将日志写入到文件的时候，你不需要控制台颜色
    gin.DisableConsoleColor()
	// 记录日志的颜色
    //gin.ForceConsoleColor()
​
    // 写入日志文件
    f, _ := os.Create("gin.log")
    gin.DefaultWriter = io.MultiWriter(f)
​
    // 如果你需要同时写入日志文件和控制台上显示，使用下面代码
    // gin.DefaultWriter = io.MultiWriter(f, os.Stdout)

	// 默认已经连接了 Logger and Recovery 中间件
	r := gin.Default()
	// 简单的post示例
	r.POST("/git/pipeline/wechat", func(context *gin.Context) {
		var request GitlabRequest

		context.ShouldBindJSON(&request)
		text := fmt.Sprint("流水线执行结果\n流水线id：", request.ObjectAttributes.Id,
			"\n执行状态：", request.ObjectAttributes.Status,
			"\n项目名：", request.Project.Name,
			"\n发布主题：", request.MergeRequest.Title,
			"\n合并内容链接：", request.MergeRequest.Url)

		// send message
		url := "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=mykey"
		method := "POST"
		playload := strings.NewReader(`{
	"msgtype": "text",
	"text": {
		"content": "` + text + `"
	}
	}`)
		client := &http.Client{}
		req,err := http.NewRequest(method,url, playload)

		if err != nil {
			context.JSON(http.StatusInternalServerError, err)
		}

		req.Header.Add("Content-Type","application/json")
		res,err := client.Do(req)
		if err != nil {
			context.JSON(http.StatusInternalServerError, err)
		}

		defer res.Body.Close()

		body,err := ioutil.ReadAll(res.Body)

		if err != nil {
			context.JSON(http.StatusInternalServerError, err)
		}
		//data,_ := json.Marshal(request)
		context.JSON(http.StatusOK, string(body))
	})
	// get示例
	r.GET("/tasks/", handleGetTasks)
	// put示例
	r.PUT("/tasks/", handleCreateTask)
	// 启动
	r.Run()
}

func handleGetTasks(c *gin.Context)  {
	var tasks []Task
	var task Task
	task.Title = "Title1"
	task.Body = `- Body1
	- Body1 - 1
	- Body1 - 2`
	tasks = append(tasks, task)
	c.JSON(http.StatusOK, gin.H {"tasks": tasks})
}

func handleCreateTask(c *gin.Context)  {
	var task Task

	if err := c.ShouldBindJSON(&task); err != nil {
		log.Print(err)
		c.JSON(http.StatusBadRequest, gin.H{"msg": err})
		return
	}

	id, err := Create(&task)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"msg": err})
		return
	}

	c.JSON(http.StatusOK, gin.H{"id":id})
}
```

## query+post 表单

```go
// 简单示例
POST /post?id=1234&page=1 HTTP/1.1
Content-Type: application/x-www-form-urlencoded
​
name=manu&message=this_is_great
​
func main() {
    router := gin.Default()
​
    router.POST("/post", func(c *gin.Context) {
​
        id := c.Query("id")
        page := c.DefaultQuery("page", "0")
        name := c.PostForm("name")
        message := c.PostForm("message")
​
        fmt.Printf("id: %s; page: %s; name: %s; message: %s", id, page, name, message)
    })
    router.Run(":8080")
}

// Map 作为查询字符串或 post表单 参数
POST /post?ids[a]=1234&ids[b]=hello HTTP/1.1
Content-Type: application/x-www-form-urlencoded
​
names[first]=thinkerou&names[second]=tianou
func main() {
    router := gin.Default()
​
    router.POST("/post", func(c *gin.Context) {
​
        ids := c.QueryMap("ids")
        names := c.PostFormMap("names")
​
        fmt.Printf("ids: %v; names: %v", ids, names)
    })
    router.Run(":8080")
}
```

## 路由参数

```go
func main() {
 router := gin.Default()

// 这个handler 将会匹配 /user/john 但不会匹配 /user/ 或者 /user
 router.GET("/user/:name", func(c *gin.Context) {
  name := c.Param("name")
  c.String(http.StatusOK, "Hello %s", name)
 })

// 这个将匹配 /user/john/ 以及 /user/john/send
// 如果没有其他路由器匹配 /user/john, 它将重定向到 /user/john/
 router.GET("/user/:name/*action", func(c *gin.Context) {
  name := c.Param("name")
  action := c.Param("action")
  message := name + " is " + action
  c.String(http.StatusOK, message)
 })

// 对于每个匹配的请求，上下文将保留路由定义
 router.POST("/user/:name/*action", func(c *gin.Context) {
  c.FullPath() == "/user/:name/*action" // true
 })

 router.Run(":8080")
}
```

## Multipart/Urlencoded 表单

```go
func main() {
 router := gin.Default()

 router.POST("/form_post", func(c *gin.Context) {
  message := c.PostForm("message")
  nick := c.DefaultPostForm("nick", "anonymous")

  c.JSON(200, gin.H{
   "status":  "posted",
   "message": message,
   "nick":    nick,
  })
 })
 router.Run(":8080")
}
```

## 上传文件

上传文件的文件名可以由用户自定义，所以可能包含非法字符串，为了安全起见，应该由服务端统一文件名规则。

```go
// 单文件
func main() {
    router := gin.Default()
    // 给表单限制上传大小 (默认是 32 MiB)
    router.MaxMultipartMemory = 8 << 20  // 8 MiB
    router.POST("/upload", func(c *gin.Context) {
        // single file
        file, _ := c.FormFile("file")
        log.Println(file.Filename)
​
        // 上传文件到指定的路径
        c.SaveUploadedFile(file, dst)
​
        c.String(http.StatusOK, fmt.Sprintf("'%s' uploaded!", file.Filename))
    })
    router.Run(":8080")
}

// 多文件
func main() {
    router := gin.Default()
    // 给表单限制上传大小 (default is 32 MiB)
    router.MaxMultipartMemory = 8 << 20  // 8 MiB
    router.POST("/upload", func(c *gin.Context) {
        // 多文件
        form, _ := c.MultipartForm()
        files := form.File["upload[]"]
​
        for _, file := range files {
            log.Println(file.Filename)
​
            //上传文件到指定的路径
            c.SaveUploadedFile(file, dst)
        }
        c.String(http.StatusOK, fmt.Sprintf("%d files uploaded!", len(files)))
    })
    router.Run(":8080")
}
```

测试

```bash
# 单文件
curl -X POST http://localhost:8080/upload \
  -F "file=@/Users/appleboy/test.zip" \
  -H "Content-Type: multipart/form-data"

# 多文件
curl -X POST http://localhost:8080/upload \
  -F "upload[]=@/Users/appleboy/test1.zip" \
  -F "upload[]=@/Users/appleboy/test2.zip" \
  -H "Content-Type: multipart/form-data"
```

## 路由分组

```go
func main() {
    router := gin.Default()
​
    // Simple group: v1
    v1 := router.Group("/v1")
    {
        v1.POST("/login", loginEndpoint)
        v1.POST("/submit", submitEndpoint)
        v1.POST("/read", readEndpoint)
    }
​
    // Simple group: v2
    v2 := router.Group("/v2")
    {
        v2.POST("/login", loginEndpoint)
        v2.POST("/submit", submitEndpoint)
        v2.POST("/read", readEndpoint)
    }
​
    router.Run(":8080")
}
```

## 中间件

```go
func main() {
    // 创建一个默认的没有任何中间件的路由
    r := gin.New()
​
    // 全局中间件
    // Logger 中间件将写日志到 gin.DefaultWriter 即使你设置 GIN_MODE=release.
    // 默认设置 gin.DefaultWriter = os.Stdout
    r.Use(gin.Logger())
​
    // Recovery 中间件从任何 panic 恢复，如果出现 panic，它会写一个 500 错误。
    r.Use(gin.Recovery())
​
    // 对于每个路由中间件，您可以根据需要添加任意数量
    r.GET("/benchmark", MyBenchLogger(), benchEndpoint)
​
    // 授权组
    // authorized := r.Group("/", AuthRequired())
    // 也可以这样
    authorized := r.Group("/")
    // 每个组的中间件！ 在这个实例中，我们只需要在 "authorized" 组中
    // 使用自定义创建的 AuthRequired() 中间件
    authorized.Use(AuthRequired())
    {
        authorized.POST("/login", loginEndpoint)
        authorized.POST("/submit", submitEndpoint)
        authorized.POST("/read", readEndpoint)
​
        // 嵌套组
        testing := authorized.Group("testing")
        testing.GET("/analytics", analyticsEndpoint)
    }
​
    // 监听并服务于 0.0.0.0:8080
    r.Run(":8080")
}
```

## 自定义格式日志

```go
func main() {
    router := gin.New()
​
    // LoggerWithFormatter 中间件会将日志写入 gin.DefaultWriter
    // 默认 gin.DefaultWriter = os.Stdout
	// 输出
	// ::1 - [Fri, 07 Dec 2018 17:04:38 JST] "GET /ping HTTP/1.1 200 122.767µs "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.80 Safari/537.36" "
    router.Use(gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
​
        // 你的自定义格式
        return fmt.Sprintf("%s - [%s] \"%s %s %s %d %s \"%s\" %s\"\n",
                param.ClientIP,
                param.TimeStamp.Format(time.RFC1123),
                param.Method,
                param.Path,
                param.Request.Proto,
                param.StatusCode,
                param.Latency,
                param.Request.UserAgent(),
                param.ErrorMessage,
        )
    }))
    router.Use(gin.Recovery())
​
    router.GET("/ping", func(c *gin.Context) {
        c.String(200, "pong")
    })
​
    router.Run(":8080")
}
```
