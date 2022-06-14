# Viper配置文件

## 简介

功能：

* 支持配置key默认值设置
* 支持读取JSON,TOML,YAML,HCL,envfile和java properties等多种不同类型配置文件
* 可以监听配置文件的变化，并重新加载配置文件
* 读取系统环境变量的值
* 读取存储在远程配置中心的配置数据，如ectd，Consul,firestore等系统，并监听配置的变化
* 从命令行读取配置
* 从buffer读取配置
* 可以显示设置配置的值

配置优先级

* `set`: 显示使用Set函数设置值
* `flag`：命令行参数
* `env`：环境变量
* `config`：配置文件
* `key/value store`：key/value存储系统，如(etcd)
* `default`:默认值

## 基本功能

```go
package viperdemo

import (
	"bytes"
	"fmt"
	"os"
	"strings"

	"github.com/fsnotify/fsnotify"
	"github.com/spf13/pflag"
	"github.com/spf13/viper"
)

func Run() {
	// 初始化结构，也可以不初始化，使用viper库中默认的对象
	// viper := viper.New()

	//// Set显示设置配置项
	// key值是不区分大小写
	viper.Set("test", "this is a test value")
	fmt.Println(viper.Get("TEST"))

	//// SetDefault
	viper.SetDefault("key1", "value1")
	viper.SetDefault("key2", "value2")
	fmt.Println(viper.Get("key1"))
	fmt.Println(viper.Get("key2"))

	////yaml
	viper.SetConfigFile("./viperdemo/config.yml")
	viper.ReadInConfig()
	fmt.Println(viper.Get("cnfkey1"))
	fmt.Println(viper.Get("cnfkey2"))
	// 多路径查找
	viper.SetConfigName("config")                // 配置文件名，不需要后缀名
	viper.SetConfigType("yml")                   // 配置文件格式
	viper.AddConfigPath("/etc/appname/")         // 查找配置文件的路径
	viper.AddConfigPath("$HOME/.appname")        // 查找配置文件的路径
	viper.AddConfigPath(".")                     // 查找配置文件的路径
	if err := viper.ReadInConfig(); err != nil { // 查找并读取配置文件
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			fmt.Printf("File not found: %v \n", err)
		} else {
			fmt.Printf("Fatal error config file: %v \n", err)
		}
	}

	//// WriteConfig
	// 将配置写入预先设置好路径的配置文件中，如果配置文件存在，则覆盖，如果没有，则创建。

	//// SafeWriteConfig
	// 与WriteConfig函数唯一的不同是如果配置文件存在，则会返回一个错误。

	//// WriteConfigAs
	// 与WriteConfig函数的不同是需要传入配置文件保存路径，viper会根据文件后缀判断写入格式。

	//// SafeWriteConfigAs
	// 与WriteConfigAs的唯一不同是如果配置文件存在，则返回一个错误。

	//// 监听配置文件
	viper.OnConfigChange(func(e fsnotify.Event) {
		fmt.Println("Config file changed:", e.Name)
	})

	//// 从io.Reader读取配置
	viper.SetConfigType("json")
	var jsonObj = []byte(`
	 {
		"name": "yase"
	 }`)
	viper.ReadConfig(bytes.NewBuffer(jsonObj))
	fmt.Println(viper.Get("name"))

	//// 注册和使用别名
	//为name设置一个username的别名
	viper.RegisterAlias("username", "name")
	fmt.Println(viper.Get("username"))

	//// 读取环境变量
	// 调用AutomaticEnv函数，开启环境变量读取
	viper.AutomaticEnv()
	fmt.Println(viper.Get("path"))

	// 使用BindEnv绑定某个环境变量,注意这里第二个参数是环境变量，这里是区分大小写的
	viper.BindEnv("p", "PATH")
	fmt.Println(viper.Get("p"))

	// 使用函数SetEnvPrefix可以为所有环境变量设置一个前缀，这个前缀会影响AutomaticEnv和BindEnv函数
	os.Setenv("AAA_PATH", "test")
	viper.SetEnvPrefix("test")
	viper.AutomaticEnv()
	fmt.Println(viper.Get("aaa_path"))

	// 环境变量大多是使用下划号(_)作为分隔符的，如果想替换，可以使用SetEnvKeyReplacer函数
	//设置一个环境变量
	os.Setenv("USER_NAME", "test")
	//将下线号替换为-和.
	viper.SetEnvKeyReplacer(strings.NewReplacer("-", "_", ".", "_"))
	//读取环境变量
	viper.AutomaticEnv()
	fmt.Println(viper.Get("user.name")) //通过.访问
	fmt.Println(viper.Get("user-name")) //通过-访问
	fmt.Println(viper.Get("user_name")) //原来的下划线也可以访问

	// 默认的情况下，如果读取到的环境变量值为空(注意，不是环境变量不存在，而是其值为空)，会继续向优化级更低数据源去查找配置，如果想阻止这一行为，让空的环境变量值有效，则可以调用AllowEmptyEnv函数：
	viper.SetDefault("username", "admin")
	viper.SetDefault("password", "123456")
	//默认是AllowEmptyEnv(false)，这里设置为true
	viper.AllowEmptyEnv(true)
	viper.BindEnv("username")
	os.Setenv("USERNAME", "")
	fmt.Println(viper.Get("username")) //输出为空，因为环境变量USERNAME空
	fmt.Println(viper.Get("password")) //输出：123456

	//// 与命令行参数搭配使用
	// pflag
	pflag.Int("port", 8080, "server http port")
	pflag.Parse()
	viper.BindPFlags(pflag.CommandLine)
	fmt.Println(viper.GetInt("port")) //输出8080

  //// 判断配置key是否存在
  if viper.IsSet("user"){
    fmt.Println("key user is not exists")
  }

  //// 打印所有配置
  m := viper.AllSettings()
  fmt.Println(m)
}
```

## 远程读取

viper支持存储或者读取远程配置存储中心和NoSQL(目前支持etcd,Consul,firestore)的配置，并可以实时监听配置的变化

现在远程配置中心存储着以下JSON的配置信息

```json
{
 "hostname":"localhost",
 "port":"8080"
}
```

```go
import _ "github.com/spf13/viper/remote"

// Consul
viper.AddRemoteProvider("consul", "localhost:8500", "MY_CONSUL_KEY")
// etcd
viper.AddRemoteProvider("etcd", "http://127.0.0.1:4001","/config/hugo.json")
// firestore
viper.AddRemoteProvider("firestore", "google-cloud-project-id", "collection/document")

// 连接上配置中心后，就可以像读取配置文件读取其中的配置了
viper.SetConfigType("json")
err := viper.ReadRemoteConfig()

fmt.Println(viper.Get("port")) // 输出:8080
fmt.Println(viper.Get("hostname")) // 输出:localhost

// 监听配置系统
go func(){
 for {
  time.Sleep(time.Second * 5) 
  err := viper.WatchRemoteConfig()
  if err != nil {
   log.Errorf("unable to read remote config: %v", err)
   continue
  }
 }
}()

// viper连接etcd,Consul,firestore进行配置传输时，也支持加解密，这样可以更加安全，如果想要实现加密传输可以把AddRemoteProvider函数换为SecureRemoteProvider。
viper.SecureRemoteProvider("etcd", "http://127.0.0.1:4001","/config/hugo.json","/etc/secrets/mykeyring.gpg")

```

## 配置访问(多层级、数组等)

```json
{
  "mysql":{
    "db":"test"
  },
  "host":{
   "address":"localhost"
   "ports":[
    "8080",
    "8081"
   ]
  }
}
```

```go
// 多层级，使用 . 拼接
viper.Get("mysql.db")
viper.GetString("user.db")
viper.Get("host.address")//输出：localhost
// 数组，使用序列号
viper.Get("host.posts.1")//输出: 8081
// 也可以使用sub函数解析某个key的下级配置
hostViper := viper.Sub("host")
fmt.Println(hostViper.Get("address"))
fmt.Println(hostViper.Get("posts.1"))
```

## 序列化

配置文件`config.yaml`：

```yaml
mysql: 
  host: localhost
  username: test
  password: test
  port: 3306
  charset: utf8
  dbName: test
redis: 
  host: localhost
  port: 6379
```
```go
type MySQL struct {
 Host     string
 DbName   string
 Username string
 Password string
 Charset  string
}

type Redis struct {
 Host string
 Port string
}

type Config struct {
 MySQL MySQL
 Redis Redis
}

func main() {

 viper.SetConfigName("config")
 viper.SetConfigType("yaml")
 viper.AddConfigPath(".")
 viper.ReadInConfig()
 var config Config

 viper.Unmarshal(&config)

 fmt.Println(config.MySQL.Username)
 fmt.Println(config.Redis.Host)
}
```