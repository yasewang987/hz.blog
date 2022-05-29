# Go Http请求

## 客户端
### GET请求

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
    // 组合到querystring上
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
    defer resp.Body.Close()
    body, _ := ioutil.ReadAll(resp.Body)
    fmt.Printf(string(body))
}
```
### POST使用

```go
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
```

## Http服务端

```go
func main() {
	// 加载配置
	conf.GlobalConfig = &conf.Config{}
	conf.GlobalConfig.InitConfig("./config.yaml")

	// 启动http-listen
    // get
	http.HandleFunc("/", func(rw http.ResponseWriter, r *http.Request) {
		rw.Write([]byte("hello"))
	})
    // post
	http.HandleFunc("/validateToken", ValidateToken)
	http.ListenAndServe(":9999", nil)
}

type tokenRes struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// 验证token
func ValidateToken(w http.ResponseWriter, r *http.Request) {
	b, err := ioutil.ReadAll(r.Body)
	if err != nil {
		panic(err)
	}
	token := string(b)

	// 验证token
	resToken := auth.VilidateToken(token, "123456")

	res := tokenRes{
		Code:    0,
		Message: "认证通过",
	}
	if !resToken {
		res.Code = 1
		res.Message = "token错误，请重新输入!"
	}

	// 返回
	err = json.NewEncoder(w).Encode(res)
	if err != nil {
		log.Fatal(err)
	}
}
```