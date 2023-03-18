# Go-SSH & SCP

## SSH

```go
import (
 "bytes"
 "fmt"
 "log"
  
  "golang.org/x/crypto/ssh"
)

func main() {

 var (
  username = "your username"
  password = "your password"
  addr     = "ip:22"
 )
 
 config := &ssh.ClientConfig{
  User: username,
  Auth: []ssh.AuthMethod{
   ssh.Password(password),
  },
  // 使用的是不校验的方式 ssh.InsecureIgnoreHostKey()，生产情况下建议使用 ssh.FixedHostKey(key PublicKey)
  HostKeyCallback: ssh.InsecureIgnoreHostKey(),
 }
 client, err := ssh.Dial("tcp", addr, config)
 if err != nil {
  log.Fatal("Failed to dial: ", err)
 }
 defer client.Close()

 // 开启一个session，用于执行一个命令
 session, err := client.NewSession()
 if err != nil {
  log.Fatal("Failed to create session: ", err)
 }
 defer session.Close()

 // 执行命令，并将执行的结果写到 b 中
 var b bytes.Buffer
 session.Stdout = &b
  
  // 也可以使用 session.CombinedOutput() 整合输出
  // 调用远程服务器脚本脚本
 // res, err := session.CombinedOutput("sh /opt/test.sh")
 if err := session.Run("/usr/bin/whoami"); err != nil {
  return b.string() + "\n" +err.Error()
 }
 fmt.Println(b.String())  // root
}
```

## SCP

在 `sftp client` 中，还有许多方法，例如 `Walk、ReadDir、Stat、Mkdir`等，针对文件也有 `Read、Write、WriteTo、ReadFrom`等方法，像操作本地文件系统一样，非常便利。

```go
package main

import (
 "io"
 "log"
 "os"
 "time"
  
  "github.com/pkg/sftp"
 "golang.org/x/crypto/ssh"
)

func main() {

 var (
  username = "your username"
  password = "your password"
  addr     = "ip:22"
 )
//////// 远程拷贝到本地
 // 1. 建立 ssh client
 config := &ssh.ClientConfig{
  User: username,
  Auth: []ssh.AuthMethod{
   ssh.Password(password),
  },
  HostKeyCallback: ssh.InsecureIgnoreHostKey(),
 }
 client, err := ssh.Dial("tcp", addr, config)
 if err != nil {
  log.Fatal("Failed to dial: ", err)
 }
 defer client.Close()

 // 2. 基于ssh client, 创建 sftp 客户端
 sftpClient, err := sftp.NewClient(client)
 if err != nil {
  log.Fatal("Failed to init sftp client: ", err)
 }
 defer sftpClient.Close()

 // 3. 打开远程服务器文件
 filename := time.Now().Format("2006-01-02") + ".log"
 source, err := sftpClient.Open("/opt/" + filename)
 if err != nil {
  log.Fatal("Failed to open remote file: ", err)
 }
 defer source.Close()

 // 4. 创建本地文件
 target, err := os.OpenFile(filename, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0644)
 if err != nil {
  log.Fatal("Failed to open local file: ", err)
 }
 defer target.Close()

 // 5. 数据复制
 n, err := io.Copy(target, source)
 if err != nil {
  log.Fatal("Failed to copy file: ", err)
 }
 log.Println("Succeed to copy file: ", n)

}

//// 本地拷贝到远程
func server_RunSCP(server serverInfo, filename string) (res string, err error) {
	fileFullName := FILE_PATH + "/" + filename
	// 打开本地文件
	srcFile, err := os.Open(fileFullName)
	if err != nil {
		return "", err
	}
	defer srcFile.Close()

	addr := server.Ip + ":" + strconv.Itoa(server.Port)
	config := &ssh.ClientConfig{
		User: server.UserName,
		Auth: []ssh.AuthMethod{
			ssh.Password(server.Pwd),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}

	client, err := ssh.Dial("tcp", addr, config)
	if err != nil {
		return "", err
	}
	defer client.Close()

	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		return "", err
	}
	defer sftpClient.Close()

	// 操作远程文件备份 - 新建
	sftpClient.Rename(fileFullName, fileFullName+".back")
	destFile, err := sftpClient.Create(fileFullName)
	if err != nil {
		return "", err
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, srcFile)
	if err != nil {
		return "", err
	}
	return "success", nil
}
```