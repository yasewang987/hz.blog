# Go读取配置文件

## yaml

配置文件：

```yaml
services:
  - name: tcw
    statusCmd: tail -20 1.txt | grep rc:499
    unhealthCondition: rc:499
  - name: slc
    statusCmd: tail -20 1.txt | grep rc:499
    unhealthCondition: rc:499
# N次异常之后告警
errorCount: 5
# 检测间隔时间-秒
intervalTime: 2 
# 告警系统地址
messageUrl: http://localhost:7777/sendmessage
```

示例代码：

```go
import (
	"io/ioutil"
	"log"

	"gopkg.in/yaml.v2"
)

type Service struct {
	Name string `yaml:"name"`
	// 服务状态获取命令
	StatusCmd string `yaml:"statusCmd"`
	// 服务异常判断条件
	UnHealthCondition string `yaml:"unhealthCondition"`
	// 异常累计次数
	ErrCount int
	// 已告警
	Alerted bool
}

type Config struct {
	// 所有服务
	Services []*Service `yaml:"services"`
	// N次之后告警
	ErrorCount int `yaml:"errorCount"`
	// 告警地址
	MessageUrl string `yaml:"messageUrl"`
	// 检查间隔时间
	IntervalTime int `yaml:"intervalTime"`
}

var GlobalConfig *Config

func InitConfig(path string) {
	log.Println("开始加载配置文件～")
	file, err := ioutil.ReadFile(path)
	if err != nil {
		log.Println("读取配置文件出错")
		panic(err)
	}
	GlobalConfig = &Config{}
	if err = yaml.Unmarshal(file, GlobalConfig); err != nil {
		log.Println("反序列化配置失败")
		panic(err)
	}
	log.Println("完成配置文件加载～")
}
```

## json

配置文件:

```json
{
    "services": [
        {
            "name": "tcw",
            "statusCmd": "tail -20 1.txt | grep rc:499",
            "unhealthCondition": "rc:499"
        },
        {
            "name": "slc",
            "statusCmd": "tail -20 1.txt | grep rc:499",
            "unhealthCondition": "rc:499"
        }

    ],
    "errorCount": 5
    "intervalTime": 2
    "messageUrl": "http://localhost:7777/sendmessage"
}
```

示例代码：

```go
import (
	"io/ioutil"
	"log"

	"encoding/json"
)

type Service struct {
	Name string `json:"name"`
	// 服务状态获取命令
	StatusCmd string `json:"statusCmd"`
	// 服务异常判断条件
	UnHealthCondition string `json:"unhealthCondition"`
	// 异常累计次数
	ErrCount int
	// 已告警
	Alerted bool
}

type Config struct {
	// 所有服务
	Services []*Service `json:"services"`
	// N次之后告警
	ErrorCount int `json:"errorCount"`
	// 告警地址
	MessageUrl string `json:"messageUrl"`
	// 检查间隔时间
	IntervalTime int `json:"intervalTime"`
}

var GlobalConfig *Config

func InitConfig(path string) {
	log.Println("开始加载配置文件～")
	file, err := ioutil.ReadFile(path)
	if err != nil {
		log.Println("读取配置文件出错")
		panic(err)
	}
	GlobalConfig = &Config{}
	if err = json.Unmarshal(file, GlobalConfig); err != nil {
		log.Println("反序列化配置失败")
		panic(err)
	}
	log.Println("完成配置文件加载～")
}

//////或者使用如下方式
configFile, err:= os.Open(filename) // * File
jsonParser := json.NewDecoder(configFile)
err = jsonParser.Decode(&config)
```