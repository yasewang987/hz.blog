# Go-Redis

```go
package main

import "github.com/hoisie/redis"

func main() {
    var client redis.Client
    client.Addr = "127.0.0.1:6379"

    // string
    client.Set("a", []byte("hello"))
    val, _ := client.Get("a")
    println(string(val))
    client.Del("a")

    // list
    vals := []string{"a", "b", "c", "d", "e"}
    for _, v := range vals {
        client.Rpush("l", []byte(v))
    }
    dbvals,_ := client.Lrange("l", 0, 4)
    for i, v := range dbvals {
        println(i,":",string(v))
    }
    client.Del("l")

    // pubsub
    sub := make(chan string, 1)
    sub <- "foo"
    messages := make(chan Message, 0)
    go client.Subscribe(sub, nil, nil, nil, messages)

    time.Sleep(10 * 1000 * 1000)
    client.Publish("foo", []byte("bar"))

    msg := <-messages
    println("received from:", msg.Channel, " message:", string(msg.Message))

    close(sub)
    close(messages)
}

```