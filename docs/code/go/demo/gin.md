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

    // 绑定URL查询字符串
    //curl -XGET https://xxx.com/binding/query?year=2022&month=10
    type queryUri struct {
        Id int `uri:"id"`
        Name string `uri:"name"`
    }
    router.GET("/binding/query", func(c *gin.Context) {
        var q queryUri
        err:= c.ShouldBindQuery(&q)
    })

    // 绑定URL路径的位置参数
    // curl -XGET https://xxx.com/binding/100/XiaoWang
    type queryParameter struct {
        Year int `form:"year"`
        Month int `form:"month"`
    }
    router.GET("/binding/:id/:name", func(c *gin.Context) {
        var q queryParameter
        err:= c.ShouldBindUri(&q)
    })

    // 绑定HTTP Header
    // curl -H "token: a1b2c3" -H "platform: 5"
    type queryHeader struct {
        Token string `header:"token"`
        Platform string `header:"platform"`
    }
    router.GET("/binding/header",func(c *gin.Context) {
        var q queryHeader
        err := c.ShouldBindHeader(&q)
    })

    // 绑定FormData
    type InfoParam struct {
        A string `form:"a" json:"a"`
        B int    `form:"b" json:"b"`
    }
    router.GET("/test1", func(c *gin.Context) {
        var info InfoParam
        c.ShouldBind(&info)
    })
​
    // 监听并服务于 0.0.0.0:8080
    router.Run(":8080")
}
```
## 不绑定直接获取数据
### query+post 表单

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

### 路由参数

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

### Multipart/Urlencoded 表单

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
## 参数验证

常用验证规则：

* `uppercase`:只允许包含大写字母
* `lowercase`:只允许包含小写字母
* `require`: 必填
* `contains`:包含指定的字串
* `alphanum`:只允许包含英文字母和数字
* `alpha`:只允许包含英文字母
* `endswith`: 字符串以指定子串结尾
* `startwith`: 字符串以指定子串开始

```go
// 参数必填验证
// 其 binding 标签里用require进行声明
type queryBody struct {
  Name string `json:"name" binding:"require"`
 Age int `json:"age"`
 Sex int `json:"sex"`
}

// 手机号、邮箱地址、地区码验证
type Body struct {
   FirstName string `json:"firstName" binding:"required"`
   LastName string `json:"lastName" binding:"required"`
   // email: 使用通用正则表达式验证电子邮件
   Email string `json:"email" binding:"required,email"`
   // e164: 使用国际 E.164 标准验证电话
   Phone string `json:"phone" binding:"required,e164"`
   // iso3166_1_alpha2: 使用 ISO-3166-1 两字母标准验证国家代码
   CountryCode string `json:"countryCode" binding:"required,iso3166_1_alpha2"`
}

// 字符串输入验证
// 手机类产品的SKU，在SKU码中都会包含MB关键字，产品编码都以PC关键字前缀开头
type MobileBody struct {
   ProductCode string `json:"productCode" binding:"required,startswith=PC,len=10"`
  SkuCode string `json:"skuCode" binding:"required,contains=MB,len=12"`
}

// 字段组合验证和比较
type Body struct {
    // 必填，1 <= Width <= 100，Width 大于 Height 字段的值
   Width int `json:"width" binding:"required,gte=1,lte=100,gtfield=Height"`
   // 必填，1<= Height <= 100
   Height int `json:"height" binding:"required,gte=1,lte=100"`
}

// 验证时间是否有效
type Body struct {
    // 必填，小于EndDate字段的值，参数中的格式为："2006-01-02" 即 "yyy-mm-dd" 的形式
   StartDate time.Time `form:"start_date" binding:"required,ltefield=EndDate" time_format:"2006-01-02"`
   EndDate time.Time `form:"end_date" binding:"required" time_format:"2006-01-02"`
}

// 自定义验证
// 官方的验证器里提供了一个oneof验证
type ReqBody struct {
    // 只能是列举出的标签值red blue pink值其中一个，这些值必须是数值或字符串，每个值以空格分隔
   Color string `json:"name" uri:"name" binding:"oneof=red blue pink"`
}
// 自定义一个notoneof的自定义验证
func main() {
  route := gin.Default()
  ...
  // 获取验证引擎，并类型转换成*validator.Validate
  if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
     // 注册notoneof的验证函数
     v.RegisterValidation("notoneof", func(fl validator.FieldLevel) bool {
       // split values using ` `. eg. notoneof=bob rob job
       // 用空格分割ontoneof的值 比如：notoneof=red blue pink
        match:=strings.Split(fl.Param()," ")
       // 把用反射获取的字段值由reflect.Value 转为 string
        value:=fl.Field().String()
        for _,s:=range match {
           // 判断字段值是否等于notoneof指定的那些值
           if s==value {
              return false
           }
        }
        return true
     })
  }
  ...
  route.Run(":8080")
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
## 多种数据响应格式（返回值）

```go
//// JSON
package main
import (
 "net/http"

 "github.com/gin-gonic/gin"
)
type User struct {
 Id     int
 Name   string
 Habits []string
}
func main() {
 engine := gin.New()

 u := User{Id: 1, Name: "小明", Habits: []string{"看书", "看电影"}}

 engine.GET("/JSON", func(ctx *gin.Context) {
  ctx.JSON(http.StatusOK, u)
 })
 // JSONP：与script标签配合使用，可以不受浏览器跨域限制
 engine.GET("/JSONP?callback=test", func(ctx *gin.Context) {
  ctx.JSONP(http.StatusOK, u)
 })
 // AsciiJSON：将JSON数据中非ASCII转化为ASCII码
 engine.GET("/AsciiJSON", func(ctx *gin.Context) {
  ctx.AsciiJSON(http.StatusOK, u)
 })
 // IndentedJSON：对齐输出
 engine.GET("/IndentedJSON", func(ctx *gin.Context) {
  ctx.IndentedJSON(http.StatusOK, u)
 })
 // PureJSON：不转换HTML标签
 engine.GET("/PureJSON", func(ctx *gin.Context) {
  ctx.PureJSON(http.StatusOK, u)
 })
 // SecureJSON：预防JSON数组劫持
 engine.GET("/SecureJSON", func(ctx *gin.Context) {
  data := []int{1, 2, 3, 4}
  ctx.SecureJSON(http.StatusOK, data)
 })

 engine.Run()
}


//// XML
// 请求的Content-Type要设置为application/xml
package main

import (
 "encoding/xml"

 "github.com/gin-gonic/gin"
)

type User struct {
 XMLName xml.Name `xml:"user"`
 Id      int      `xml:"id"`
 Name    string   `xml:"name"`
 Habits  []string `xml:"habits"`
}

func main() {

 engine := gin.New()

 engine.GET("/xml", func(ctx *gin.Context) {
  user := &User{Id: 1, Name: "小明", Habits: []string{"看书", "看电影"}}
  ctx.XML(http.StatusOK, user)
 })

 engine.Run()
}


//// TOML
// 请求的Content-Type设置为application/toml
package main

import (
 "net/http"

 "github.com/gin-gonic/gin"
)

type User struct {
 Id     int
 Name   string
 Habits []string
}

func main() {

 engine := gin.New()

 engine.GET("/toml", func(ctx *gin.Context) {
  user := &User{Id: 1, Name: "小明", Habits: []string{"看书", "看电影"}}
  ctx.TOML(http.StatusOK, user)
 })

 engine.Run()
}


//// YAML
// 请求Content-Type设置为application/yaml
package main

import (
 "net/http"

 "github.com/gin-gonic/gin"
)

type User struct {
 Id     int
 Name   string
 Habits []string
}

func main() {

 engine := gin.New()

 engine.GET("/yaml", func(ctx *gin.Context) {
  user := &User{Id: 1, Name: "小明", Habits: []string{"看书", "看电影"}}
  ctx.YAML(http.StatusOK, user)
 })

 engine.Run()
}


//// ProtoBuf
// 定义proto文件
syntax = "proto3";

option go_package = "./user";

message User {
    int64  Id = 1;
    string Name = 2;
    string Email = 3;
}
// 调用protoc生成pb文件
protoc --proto_path=./ --go_out=./ ./user.proto
// 目录结构如下
├── main.go
├── user
│   └── user.pb.go
└── user.proto
// go代码
package main

import (
 "user"
 "github.com/gin-gonic/gin"
)

func main() {
 router := gin.New()
 router.GET("/protoBuf", func(ctx *gin.Context) {
  u := user.User{Id: 1, Name: "protoBuf", Email: "test@163.com"}
  ctx.ProtoBuf(http.StatusOK, &u)
 })
 router.Run()
}

//// HTML模板
// 假设我们有一个模板名称为templates/index.tmpl
<html>
 <h1>
  {{ .title }}
 </h1>
</html>
// LoadHTMLFiles()可以加载一个或多个HTML模板
package main 

func main() {
 engine := gin.Default()
 engine.LoadHTMLFiles("templates/index.tmpl")
 engine.GET("/index", func(c *gin.Context) {
  c.HTML(http.StatusOK, "index.tmpl", gin.H{
   "title": "主页",
  })
 })
 engine.Run()
}
// LoadHTMLGlob()加载整个目录的HTML模板
package main 

func main() {
 engine := gin.Default()
 engine.LoadHTMLGlob("templates/**/*")
 engine.GET("/index", func(ctx *gin.Context) {
  ctx.HTML(http.StatusOK, "index.tmpl", gin.H{
   "title": "主页",
  })
 })
 engine.Run()
}
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

多个全局中间件，它们将按照注册的顺序依次执行（类似管道）。

```go
func main() {
    // gin.Default()默认使用了 Logger 和 Recovery 中间件
    // New会创建一个默认的没有任何中间件的路由
    r := gin.New()

    // 自定义全局中间件
    r.Use(LoggerMiddleware)
​
    // 对于每个路由中间件，您可以根据需要添加任意数量
    r.GET("/benchmark", MyBenchLogger(), benchEndpoint)
​
    // 创建一个路由分组，并将中间件应用于该分组中的所有路由
    apiGroup := r.Group("/api", LoggerMiddleware, AuthMiddleware)
    
    apiGroup.GET("/users", func(c *gin.Context) {
        c.String(http.StatusOK, "List of Users")
    })
    
    apiGroup.GET("/products", func(c *gin.Context) {
        c.String(http.StatusOK, "List of Products")
    })
​
    // 监听并服务于 0.0.0.0:8080
    r.Run(":8080")
}

func LoggerMiddleware(c *gin.Context) {
	// 在请求处理之前执行的逻辑
	fmt.Println("Start Logging")

	// 将请求传递给下一个处理程序
	c.Next()

	// 在请求处理之后执行的逻辑
	fmt.Println("End Logging")
}

func AuthMiddleware(c *gin.Context) {
	// 检查是否有有效的 Authorization 头
	if authorizationHeader := c.GetHeader("Authorization"); authorizationHeader == "" {
		// 如果 Authorization 头缺失，返回未授权状态
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	// 检查使用你的自定义逻辑提供的身份验证是否有效
	if !isValidAuth(c.GetHeader("Authorization")) {
		// 如果身份验证失败，返回未授权状态
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	// 如果身份验证成功，继续执行下一个中间件或路由处理程序
	c.Next()
}

//// 中间件设置共享数据
func CustomMiddleware(c *gin.Context) {
	// 在中间件中设置数据
	c.Set("userID", 123)

	// 继续执行下一个中间件或路由处理程序
	c.Next()
}
//// 函数提取共享数据
func ProtectedRouteHandler(c *gin.Context) {
	// 从上一个中间件中获取数据
	userID, exists := c.Get("userID")
	if !exists {
		// 如果数据不存在，返回错误响应
		c.String(http.StatusInternalServerError, "无法获取用户信息")
		return
	}

	// 数据存在，继续处理
	c.String(http.StatusOK, fmt.Sprintf("用户ID：%v，你有权访问受保护的路由！", userID))
}
```

gin中间件中使用 goroutine，不能使用原始的上下文(`c *gin.Context`)， 必须使用其只读副本(`c.Copy()`)

```go
r.GET("/", func(c *gin.Context) {
		cCp := c.Copy()
		go func() {
			// simulate a long task with time.Sleep(). 5 seconds time.Sleep(5 * time.Second)
			// 这里使用你创建的副本
			fmt.Println("Done! in path " + cCp.Request.URL.Path)
		}()
		c.String(200, "首页")

	})
```

## 跨域设置

```go
package main

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

func main() {
	r := gin.Default()

	// 使用中间件处理跨域问题
	r.Use(CORSMiddleware())

	// 其他路由注册
	r.GET("/hello", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "Hello, CORS is enabled!"})
	})

	// 启动 Gin 服务器
	r.Run(":8080")
}

// CORSMiddleware 中间件处理跨域问题
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
```

也可以使用`gin-contrib/cors`

```go
package main

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"strings"
	"time"
)

func main() {
	// 创建一个默认的 Gin 实例
	server := gin.Default()

	// 使用 CORS 中间件处理跨域问题，配置 CORS 参数
	server.Use(cors.New(cors.Config{
		// 允许的源地址（CORS中的Access-Control-Allow-Origin）
		// AllowOrigins: []string{"https://foo.com"},
		// 允许的 HTTP 方法（CORS中的Access-Control-Allow-Methods）
		AllowMethods: []string{"PUT", "PATCH"},
		// 允许的 HTTP 头部（CORS中的Access-Control-Allow-Headers）
		AllowHeaders: []string{"Origin"},
		// 暴露的 HTTP 头部（CORS中的Access-Control-Expose-Headers）
		ExposeHeaders: []string{"Content-Length"},
		// 是否允许携带身份凭证（CORS中的Access-Control-Allow-Credentials）
		AllowCredentials: true,
		// 允许源的自定义判断函数，返回true表示允许，false表示不允许
		AllowOriginFunc: func(origin string) bool {
			if strings.HasPrefix(origin, "http://localhost") {
				// 允许你的开发环境
				return true
			}
			// 允许包含 "yourcompany.com" 的源
			return strings.Contains(origin, "yourcompany.com")
		},
		// 用于缓存预检请求结果的最大时间（CORS中的Access-Control-Max-Age）
		MaxAge: 12 * time.Hour,
	}))

	// 启动 Gin 服务器，监听在 0.0.0.0:8080 上
	server.Run(":8080")
}

//// Default（）允许所有来源
// 使用所有来源会禁用 Gin 为客户端设置 cookie 的能力。处理凭据时，不要允许所有来源。
func main() {
  router := gin.Default()
  // same as
  // config := cors.DefaultConfig()
  // config.AllowAllOrigins = true
  // router.Use(cors.New(config))
  router.Use(cors.Default())
  router.Run()
}

//// 使用DefaultConfig作为起点
func main() {
  router := gin.Default()
  // - No origin allowed by default
  // - GET,POST, PUT, HEAD methods
  // - Credentials share disabled
  // - Preflight requests cached for 12 hours
  config := cors.DefaultConfig()
  config.AllowOrigins = []string{"http://google.com"}
  // config.AllowOrigins = []string{"http://google.com", "http://facebook.com"}
  // config.AllowAllOrigins = true

  router.Use(cors.New(config))
  router.Run()
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
## 静态文件

```go
// 文件目录如下
├── main.go
└── static
    ├── js
    │   └── index.js
    └── pages
        └── index.html

// go代码
package main

import (
 "github.com/gin-gonic/gin"
)

func main() {
 engine := gin.New()
 engine.Static("static/pages", "./static/pages")
 engine.StaticFile("/static/js/index.js", "./static/js/index.js")
 engine.Run()
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

