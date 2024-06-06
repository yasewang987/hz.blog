# WebSocket

client注册流程：client请求建立websocket -> 服务端将请求升级为websocket -> 加入到全局管理器统一管理所有websocket 

消息发送流程：client向websocket发送消息 -> 服务端对应的websocket接收消息 -> 发送到全局管理器广播频道 -> 全局管理器发送给所有client

## 服务端

实现：`gin + gorilla/websocket`

`handler/client.go`
```go
package handler

import (
	"log"
	"time"

	"github.com/gorilla/websocket"
)

// 客户端
type Client struct {
	// 客户端标记
	ID     string
	Socket *websocket.Conn
	// 最后存活时间
	LastTime time.Time
	// 在ExpirTime时间内如果服务端没有接收客户端发送过来的消息就代表对应客户端已经下线
	ExpireTime time.Duration
	Send       chan []byte
}

// 读取客户端发送的消息
func (c *Client) Read() {
	defer func() {
		c.Socket.Close()
		Manager.UnRegister <- c
	}()

	for {
		_, msg, err := c.Socket.ReadMessage()
		if err != nil {
			log.Println(err.Error())
			break
		}

		// switch msg.Type {
		// // 心跳检测，只需要回复给发送方
		// case 1:
		// 	res, _ := json.Marshal(&WsMessage{Type: 1, Data: "pong"})
		// 	c.LastTime = time.Now()
		// 	c.Send <- res
		// 文本信息，需要发送给所有人
		// 发送到广播频道
		Manager.Broadcast <- msg
	}
}

// 回写信息到客户端
// 当对应客户端的Send管道被写入消息是就会触发Write方法中服务端给该客户端推送消息的操作。
// 如果客户端离线了则将对应离线客户端写入Manager.UnRegister中。
func (c *Client) Write() {
	defer func() {
		c.Socket.Close()
		Manager.UnRegister <- c
	}()

	for {
		select {
		case msg, ok := <-c.Send:
			if !ok {
				// 没有消息发送空响应
				err := c.Socket.WriteMessage(websocket.CloseMessage, []byte{})
				if err != nil {
					log.Println(err.Error())
					return
				}
				return
			}
			err := c.Socket.WriteMessage(websocket.TextMessage, msg)
			if err != nil {
				log.Println(err.Error())
				return
			}
		}
	}
}

// 检测客户端存活
func (c *Client) Check() {
	for {
		select {
		case <-time.Tick(time.Second * 10):
			now := time.Now()
			duration := now.Sub(c.LastTime)
			if duration >= c.ExpireTime {
				Manager.UnRegister <- c
				return
			}
		}
	}
}
```

`handler/client_manager.go`

```go
package handler

// 全局manager
var Manager *ClientManager

// 客户端管理
type ClientManager struct {
	// 在线客户端
	Clients map[string]*Client
	// 广播消息
	Broadcast chan []byte
	// 触发用户登录
	Register chan *Client
	// 触发用户退出
	UnRegister chan *Client
}

// 启动全局管理器，监听注册管道中的信息添加客户端
func (cm *ClientManager) Start() {
	for conn := range cm.Register {
		cm.Clients[conn.ID] = conn
	}
}

// 广播消息
func (cm *ClientManager) BroadcastSend() {
	for msg := range cm.Broadcast {
		for _, conn := range cm.Clients {
			conn.Send <- msg
		}
	}
}

// 离线用户触发删除
func (cm *ClientManager) Quit() {
	for conn := range cm.UnRegister {
		delete(cm.Clients, conn.ID)
	}
}

func InitClientManger() {
	Manager = &ClientManager{
		Clients:    make(map[string]*Client, 10),
		Broadcast:  make(chan []byte, 10),
		Register:   make(chan *Client),
		UnRegister: make(chan *Client),
	}

	go Manager.Start()
	go Manager.BroadcastSend()
	go Manager.Quit()
}
```

`handler/wshandler.go`

```go
package handler

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

func WebSocketHandler(ctx *gin.Context) {
	conn, err := (&websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}).Upgrade(ctx.Writer, ctx.Request, nil)

	if err != nil {
		http.NotFound(ctx.Writer, ctx.Request)
		log.Println(err.Error())
		return
	}

	id := ctx.Query("id")

	client := &Client{
		ID:         id,
		Socket:     conn,
		Send:       make(chan []byte),
		LastTime:   time.Now(),
		ExpireTime: time.Minute,
	}

	Manager.Register <- client
	go client.Read()
	go client.Write()
	go client.Check()
	log.Println("客户端注册成功，id：" + id)
}
```

`main.go`

```go
package main

import (
	"mywebsocket/handler"

	"github.com/gin-gonic/gin"
)

func main() {
	handler.InitClientManger()

	server := gin.Default()
	server.GET("/ws", handler.WebSocketHandler)
	server.Run(":12345")
}
```

## web客户端

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
  <div>
    <input id="msg" type="text" />
    <button id="send">发送</button>
  </div>
  <div id="result"></div>
  <script>
    const socket = new WebSocket('ws://localhost:12345/ws?id=abc123')
		// socket.onopen = function() {}
    socket.addEventListener('open', function(event) {
      socket.send('我是abc123-已建立连接')
    })
		// socket.onmessage = function(event) {}
    socket.addEventListener('message', function(event) {
      let el = document.getElementById('result')
      el.innerHTML = `${el.innerHTML} <br /> ${event.data}`
    })
		// socket.onerror = function(event) {}
		socket.addEventListener('error', function(event) {
			console.error(event)
		})
		// socket.onclose = function(event) {}
		socket.addEventListener('close', function(event) {
			console.log('ws连接关闭')
		})
    document.getElementById('send').onclick = function() {
      let msg = document.getElementById('msg').value
			// ws发送消息
      socket.send(msg)
    }
  </script>
</body>
</html>
```