# Go Http请求

## GET请求

```go
func main(){
    resp, err := http.Get("http://httpbin.org/get?name=zhaofan&age=23")
    if err != nil {
        fmt.Println(err)
        return
    }
    defer resp.Body.Close()
    body, _ := ioutil.ReadAll(resp.Body)
    fmt.Println(string(body))
    // 反序列化
    res := make(map[string]interface{})
    _ = json.Unmarshal(body,&res)
}

// 把一些参数做成变量而不是直接放到url中

func main(){
    params := url.Values{}
    Url, err := url.Parse("http://httpbin.org/get")
    if err != nil {
        return
    }
    params.Set("name","zhaofan")
    params.Set("age","23")
    //如果参数中有中文参数,这个方法会进行URLEncode
    Url.RawQuery = params.Encode()
    urlPath := Url.String()
    fmt.Println(urlPath) // https://httpbin.org/get?age=23&name=zhaofan
    resp,err := http.Get(urlPath)
    defer resp.Body.Close()
    body, _ := ioutil.ReadAll(resp.Body)
    fmt.Println(string(body))
}

// GET请求添加请求头
func main() {
    client := &http.Client{}
    req,_ := http.NewRequest("GET","http://httpbin.org/get",nil)
    req.Header.Add("name","zhaofan")
    req.Header.Add("age","3")
    resp,_ := client.Do(req)
    body, _ := ioutil.ReadAll(resp.Body)
    fmt.Printf(string(body))
}
```

## POST使用

```go
func main() {
    urlValues := url.Values{}
    urlValues.Add("name","zhaofan")
    urlValues.Add("age","22")
    resp, _ := http.PostForm("http://httpbin.org/post",urlValues)
    body, _ := ioutil.ReadAll(resp.Body)
    defer resp.Body.Close()
    fmt.Println(string(body))
}

// 另外一种方式
func main() {
    urlValues := url.Values{
        "name":{"zhaofan"},
        "age":{"23"},
    }
    reqBody:= urlValues.Encode()
    resp, _ := http.Post("http://httpbin.org/post", "text/html",strings.NewReader(reqBody))
    body,_:= ioutil.ReadAll(resp.Body)
    fmt.Println(string(body))
}

// 发送JSON数据的post请求
func main() {
    client := &http.Client{}
    data := make(map[string]interface{})
    data["name"] = "zhaofan"
    data["age"] = "23"
    bytesData, _ := json.Marshal(data)
    req, _ := http.NewRequest("POST","http://httpbin.org/post",bytes.NewReader(bytesData))
    resp, _ := client.Do(req)
    body, _ := ioutil.ReadAll(resp.Body)
    defer resp.Body.Close()
    fmt.Println(string(body))
}
// 不用client的post请求
func main() {
    data := make(map[string]interface{})
    data["name"] = "zhaofan"
    data["age"] = "23"
    bytesData, _ := json.Marshal(data)
    resp, _ := http.Post("http://httpbin.org/post","application/json", bytes.NewReader(bytesData))
    body, _ := ioutil.ReadAll(resp.Body)
    fmt.Println(string(body))
}
```

## 企业微信机器人实例

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