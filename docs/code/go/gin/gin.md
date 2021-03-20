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

## 简单使用Gin

```go
package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)


func main() {
	r := gin.Default()
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
	r.GET("/tasks/", handleGetTasks)
	r.PUT("/tasks/", handleCreateTask)
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

