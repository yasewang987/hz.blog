# 简单任务调度系统

## 代码

`main.go`：主应用入口

```go
package main

import (
	"log"
	"task_schedule/other"

	"github.com/gin-gonic/gin"
)

func main() {
	app := gin.New()

	log.Println("init")
	// routes
	app.GET("/jobs", other.GetJobs)
	app.POST("/jobs", other.AddTask)
	app.DELETE("/jobs/:id", other.DeleteJob)

	if err := app.Run(":9999"); err != nil {
		panic(err)
	}
	log.Println("started")
}
```

`other/task.go`：定时任务相关

```go
package other

import (
	"log"
	"os/exec"

	"github.com/robfig/cron/v3"
)

func init() {
	go Cron.Run()
}

var Cron = cron.New()

func ExecTask(cmdStr string) {
	cmd := exec.Command("sh", "-c", cmdStr)
	if err := cmd.Run(); err != nil {
		log.Println(err.Error())
	}
	log.Println("task exec success!")
}
```

## 验证

```bash
# 添加任务
curl -X POST -H 'Content-Type:application/json' -d '{"cron": "* * * * *", "exec": "touch 111.txt"}' http://localhost:9999/jobs

# 获取任务列表
curl http://localhost:9999/jobs

# 删除任务
curl -X DELETE http://localhost:9999/jobs/1
```

`other/api.go`：保存接口相关
```go
package other

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/robfig/cron/v3"
)

func AddTask(c *gin.Context) {
	var payload struct {
		Cron string `json:"cron"`
		Exec string `json:"exec"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	// add job
	eid, err := Cron.AddFunc(payload.Cron, func() {
		ExecTask(payload.Exec)
	})
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, eid)
}

func GetJobs(c *gin.Context) {
	results := make(map[int]interface{})
	for _, e := range Cron.Entries() {
		results[int(e.ID)] = e.Next
	}
	c.JSON(http.StatusOK, results)
}

func DeleteJob(c *gin.Context) {
	id := c.Param("id")
	eid, err := strconv.Atoi(id)
	if err != nil {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	Cron.Remove(cron.EntryID(eid))
	c.JSON(http.StatusOK, "ok")
}
```

