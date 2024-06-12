# 运维常用例子

## 简单的端口监控工具
```go
package main

import (
 "fmt"
 "net"
 "time"
)

// CheckPort 检查指定主机和端口是否可达
func CheckPort(host string, port int) bool {
 address := fmt.Sprintf("%s:%d", host, port)
 conn, err := net.DialTimeout("tcp", address, 2*time.Second)
 if err != nil {
  return false
 }
 _ = conn.Close()
 return true
}

func main() {
 host := "localhost"
 port := 8080

 for {
  if CheckPort(host, port) {
   fmt.Printf("Port %d on host %s is reachable\n", port, host)
  } else {
   fmt.Printf("Port %d on host %s is NOT reachable\n", port, host)
  }
  time.Sleep(5 * time.Second)
 }
}
```

## 系统资源监控工具

```go
go mod init sysmonitor
go get github.com/shirou/gopsutil

package main

import (
 "fmt"
 "time"

 "github.com/shirou/gopsutil/cpu"
 "github.com/shirou/gopsutil/mem"
 "github.com/shirou/gopsutil/disk"
)

// PrintCPUUsage 打印CPU使用情况
func PrintCPUUsage() {
 percent, _ := cpu.Percent(0, false)
 fmt.Printf("CPU Usage: %.2f%%\n", percent[0])
}

// PrintMemoryUsage 打印内存使用情况
func PrintMemoryUsage() {
 vm, _ := mem.VirtualMemory()
 fmt.Printf("Memory Usage: %.2f%%\n", vm.UsedPercent)
}

// PrintDiskUsage 打印磁盘使用情况
func PrintDiskUsage() {
 u, _ := disk.Usage("/")
 fmt.Printf("Disk Usage: %.2f%%\n", u.UsedPercent)
}

func main() {
 for {
  PrintCPUUsage()
  PrintMemoryUsage()
  PrintDiskUsage()
  fmt.Println("---------------------")
  time.Sleep(5 * time.Second)
 }
}
```

## 多服务器运行脚本

```go
package main

import (
 "fmt"
 "os/exec"
)

// ExecuteSSHCommand 在指定服务器上执行命令
func ExecuteSSHCommand(host, user, command string) error {
 cmd := exec.Command("ssh", fmt.Sprintf("%s@%s", user, host), command)
 output, err := cmd.CombinedOutput()
 if err != nil {
  return fmt.Errorf("error executing command: %s\n%s", err, string(output))
 }

 fmt.Printf("Output from %s:\n%s\n", host, string(output))
 return nil
}

func main() {
 servers := []string{"server1.example.com", "server2.example.com"}
 user := "admin"
 command := "sudo systemctl restart myapp"

 for _, server := range servers {
  err := ExecuteSSHCommand(server, user, command)
  if err != nil {
   fmt.Printf("Failed to execute command on %s: %s\n", server, err)
  } else {
   fmt.Printf("Successfully executed command on %s\n", server)
  }
 }
}
```

## docker容器管理

```go
go mod init dockerdemo
go get github.com/docker/docker/client
go get github.com/docker/docker/api/types

package main

import (
 "context"
 "fmt"
 "github.com/docker/docker/api/types"
 "github.com/docker/docker/api/types/container"
 "github.com/docker/docker/client"
 "time"
)

func main() {
 cli, err := client.NewClientWithOpts(client.FromEnv)
 if err != nil {
  panic(err)
 }

 ctx := context.Background()

 // 拉取镜像
 _, err = cli.ImagePull(ctx, "busybox", types.ImagePullOptions{})
 if err != nil {
  panic(err)
 }
 fmt.Println("Image pulled successfully")

 // 创建容器
 resp, err := cli.ContainerCreate(ctx, &container.Config{
  Image: "busybox",
  Cmd:   []string{"echo", "Hello, World"},
  Tty:   true,
 }, nil, nil, nil, "mycontainer")
 if err != nil {
  panic(err)
 }
 fmt.Println("Container created successfully")

 // 启动容器
 if err := cli.ContainerStart(ctx, resp.ID, types.ContainerStartOptions{}); err != nil {
  panic(err)
 }
 fmt.Println("Container started successfully")

 // 等待容器执行完毕
 statusCh, errCh := cli.ContainerWait(ctx, resp.ID, container.WaitConditionNotRunning)
 select {
 case err := <-errCh:
  if err != nil {
   panic(err)
  }
 case <-statusCh:
 }

 // 获取容器日志
 out, err := cli.ContainerLogs(ctx, resp.ID, types.ContainerLogsOptions{ShowStdout: true})
 if err != nil {
  panic(err)
 }
 defer out.Close()

 // 打印日志
 buf := make([]byte, 1024)
 for {
  n, err := out.Read(buf)
  if err != nil {
   break
  }
  fmt.Print(string(buf[:n]))
 }
}
```