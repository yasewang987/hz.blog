# Go实现网页Terminal

简单流程：
1. 网页引入xterm，发起websocket请求
1. 后端创建与服务器连接的ssh客户端，并开启连接
1. 将后端创建的ssh客户端的输入输出设置为该websocket

服务端核心代码

```go
import (
	"io"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/ssh"
	"golang.org/x/net/websocket"
)

type ShellRequest struct {
	W      int        `json:"w"`
	H      int        `json:"h"`
	Server serverInfo `json:"server"`
}

func ShellWS(c *gin.Context) {
	w, _ := strconv.Atoi(c.Query("w"))
	h, _ := strconv.Atoi(c.Query("h"))
	sid, _ := strconv.Atoi(c.Query("sid"))
	req := &ShellRequest{
		Server: serverInfo{},
		W:      w,
		H:      h,
	}

  // 获取服务器信息
	server := db.QueryRow("select ip,port,username,pwd from server where id=?", sid)
	server.Scan(&req.Server.Ip, &req.Server.Port, &req.Server.UserName, &req.Server.Pwd)

  // 建立websocket
	websocket.Handler(func(ws *websocket.Conn) {
		err := req.runTerminal(ws, ws, ws, ws)
		if err != nil {
			_ = websocket.Message.Send(ws, "connect error!")
			_ = ws.Close()
			return
		}
	}).ServeHTTP(c.Writer, c.Request)
}

func (sr *ShellRequest) runTerminal(stdout, stderror io.Writer, stdin io.Reader, ws *websocket.Conn) error {
	sshConfig := ssh.ClientConfig{
		User:            sr.Server.UserName,
		Auth:            []ssh.AuthMethod{ssh.Password(sr.Server.Pwd)},
		Timeout:         60 * time.Second,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}
	addr := sr.Server.Ip + ":" + strconv.Itoa(sr.Server.Port)

	sshClient, err := ssh.Dial("tcp", addr, &sshConfig)
	if err != nil {
		return err
	}
	defer sshClient.Close()

	sshSession, err := sshClient.NewSession()
	if err != nil {
		return err
	}
	defer sshSession.Close()
	sshSession.Stdout = stdout
	sshSession.Stderr = stderror
	sshSession.Stdin = stdin

	modes := ssh.TerminalModes{}
	if err := sshSession.RequestPty("xterm-256color", sr.H, sr.W, modes); err != nil {
		return err
	}

	err = sshSession.Run("bash")
	if err != nil {
		return err
	}
	return nil
}

/// 添加路由
srv := gin.Default()
srv.GET("/ws", handler.ShellWS)
```

前端核心代码

```html
<script lang="ts" setup>
import "xterm/css/xterm.css"
import { ref, onMounted, nextTick } from 'vue'
import { Terminal } from 'xterm'
import { AttachAddon } from 'xterm-addon-attach'
import { FitAddon } from 'xterm-addon-fit'

const ConnectHostShell = async () => {
  var fit = new FitAddon()
  var term = new Terminal({
    cursorBlink: true,
    theme: {
      background: "black"
    }
  })
  term.loadAddon(fit)
  // nexTick这个特别特别关键，不然会显示不了xterm
  nextTick(() => {
    term.open(document.getElementById('shell')??document.body)
    fit.fit()
    let socketUrl = `ws://localhost:19999/ws?h=${term.rows}&w=${term.cols}&sid=${currentServer.value.id}`
    term.loadAddon(new AttachAddon(new WebSocket(socketUrl)))
  })
}
</script>
<template>
  <button @click="ConnectHostShell">打开终端</button>
  <div id="shell" style="height: 500px;></div>
</template>
```