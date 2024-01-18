# goroutine

## Worker 协程平滑关闭

对于worker协程的平滑关闭，可以使用 `context.Context` 实现。

```go
package main

import (
    "context"
    "fmt"
    "os"
    "os/signal"
    "sync"
    "time"
)

func worker(ctx context.Context, wg *sync.WaitGroup) {
    defer wg.Done()

    for {
        select {
        case <-ctx.Done():
            fmt.Println("Worker received shutdown signal")
            return
        default:
            // 执行工作任务
            fmt.Println("Working...")
            time.Sleep(time.Second)
        }
    }
}

func main() {
    ctx, cancel := context.WithCancel(context.Background())
    var wg sync.WaitGroup

    // 启动worker协程
    wg.Add(1)
    go worker(ctx, &wg)

    // 等待中断信号来优雅地关闭worker协程
    stop := make(chan os.Signal, 1)
    signal.Notify(stop, os.Interrupt)

    <-stop // 等待中断信号
    fmt.Println("Shutting down...")

    // 发送关闭信号给worker协程
    cancel()
    wg.Wait()
    fmt.Println("Shutdown complete")
}

```