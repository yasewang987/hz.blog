# Go-SSE

## 基础介绍

### SSE 的本质
严格地说，HTTP 协议无法做到服务器主动推送信息。但是，有一种变通方法，就是服务器向客户端声明，接下来要发送的是流信息（streaming）。

也就是说，发送的不是一次性的数据包，而是一个数据流，会连续不断地发送过来。这时，客户端不会关闭连接，会一直等着服务器发过来的新的数据流，视频播放就是这样的例子。本质上，这种通信就是以流信息的方式，完成一次用时很长的下载。

SSE 就是利用这种机制，使用流信息向浏览器推送信息。它基于 HTTP 协议，目前除了 IE/Edge，其他浏览器都支持。

### SSE 的特点

* SSE 使用 HTTP 协议，现有的服务器软件都支持。WebSocket 是一个独立协议。
* SSE 属于轻量级，使用简单；WebSocket 协议相对复杂。
* SSE 默认支持断线重连，WebSocket 需要自己实现。
* SSE 一般只用来传送文本，二进制数据需要编码后传送，WebSocket 默认支持传送二进制数据。
* SSE 支持自定义发送的消息类型。

## 服务端实现

```bash
# 服务器向浏览器发送的 SSE 数据，必须是 UTF-8 编码的文本，具有如下的 HTTP 头信息。
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

# 每一次发送的信息，由若干个message组成，每个message之间用\n\n分隔。每个message内部由若干行组成，每一行都是如下格式。
# field: data、event、id、retry
[field]: value\n

# 冒号开头的行，表示注释。通常，服务器每隔一段时间就会向浏览器发送一个注释，保持连接不中断。
: This is a comment

### data
# 示例1：注释
: this is a test stream\n\n
# 示例2：一行数据
data: some text\n\n
# 示例3：如果数据很长，可以分成多行，最后一行用\n\n结尾，前面行都用\n结尾。
data: another message\n
data: with two lines \n\n
# 示例4：JSON 数据
data: {\n
data: "foo": "bar",\n
data: "baz", 555\n
data: }\n\n

#### id
# 浏览器用lastEventId属性读取这个值。一旦连接断线，浏览器会发送一个 HTTP 头，里面包含一个特殊的Last-Event-ID头信息，将这个值发送回来，用来帮助服务器端重建连接。因此，这个头信息可以被视为一种同步机制。
# 数据标识符用id字段表示，相当于每一条数据的编号
id: msg1\n
data: message\n\n

#### event
# event字段表示自定义的事件类型，默认是message事件。浏览器可以用addEventListener()监听该事件。
event: foo\n
data: a foo event\n\n

#### retry
# 服务器可以用retry字段，指定浏览器重新发起连接的时间间隔。
retry: 10000\n
```

```go
package main

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

func main() {
	http.HandleFunc("/sse", handleSSE)
	http.ListenAndServe(":9999", nil)
}

func handleSSE(w http.ResponseWriter, r *http.Request) {
	// 检查服务器是否支持
	flusher, ok := w.(http.Flusher)
	if !ok {
		log.Println("浏览器不支持sse")
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	for {
		select {
		// 客户端断开触发
		case <-r.Context().Done():
			fmt.Println("request done...")
			return
		case <-time.After(time.Second):
			fmt.Fprintf(w, "id: %d\nevent: ping\nretry: 10000\ndata: data-%d\n\n", time.Now().Unix(), time.Now().Unix())
			flusher.Flush()
		}
	}
}
```


## 客户端实现

```js
// 检测浏览器是否支持 SSE
if ('EventSource' in window) {
  // ...
}

// 初始化一个sse对象
var source = new EventSource(url);
// 跨域，打开withCredentials属性，表示是否一起发送 Cookie。
var source = new EventSource(url, { withCredentials: true });

// EventSource实例的readyState属性，表明连接的当前状态。该属性只读，可以取以下值。
// 0：相当于常量EventSource.CONNECTING，表示连接还未建立，或者断线正在重连。
// 1：相当于常量EventSource.OPEN，表示连接已经建立，可以接受数据。
// 2：相当于常量EventSource.CLOSED，表示连接已断，且不会重连。
source.readyState

// 连接一旦建立，就会触发open事件，可以在onopen属性定义回调函数
source.onopen = function (event) {
  // ...
};

// 客户端收到服务器发来的数据，就会触发message事件，可以在onmessage属性的回调函数。
source.onmessage = function (event) {
  var data = event.data;
  // handle message
};
// 另一种写法，自定义事件
source.addEventListener('foo', function (event) {
  var data = event.data;
  // handle message
}, false);

// 如果发生通信错误（比如连接中断），就会触发error事件，可以在onerror属性定义回调函数。
source.onerror = function (event) {
  // handle error event
};
// 另一种写法
source.addEventListener('error', function (event) {
  // handle error event
}, false);

// close方法用于关闭 SSE 连接。
source.close();
```
示例：
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SSE-Test</title>
</head>
<body>
  <h2>SSE</h2>
  <div id="result"></div>
</body>
<script>
const source = new EventSource('http://localhost:9999/sse')
source.onopen = () => {
  console.log('打开连接')
}
// 定义的接收事件和服务端返回的event对应
// 如果服务端不指定，默认监听的是message
source.addEventListener("ping", (res) => {
  document.getElementById('result').innerHTML += `${res.data}<br />`
})
source.onerror = (err) => {
  console.log(err)
}
</script>
</html>
```