# Go Http请求

```go
r.POST("/git/pipeline/wechat", func(context *gin.Context) {
    var request GitlabRequest

    // 反序列化为结构
    context.ShouldBindJSON(&request)

    text := fmt.Sprint("流水线执行结果\n流水线id：", request.ObjectAttributes.Id,
        "\n执行状态：", request.ObjectAttributes.Status,
        "\n项目名：", request.Project.Name,
        "\n发布主题：", request.Commit.Title,
        "\n提交内容链接：", request.Commit.Url)

    // send message
    url := "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=11"
    method := "POST"
    playload := strings.NewReader(`{
"msgtype": "text",
"text": {
    "content": "` + text + `"
}
}`)
    // http请求
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
```