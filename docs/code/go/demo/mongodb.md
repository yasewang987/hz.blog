# Go操作MongoDb

```go
package main

import (
	"context"
	"fmt"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"log"
	"time"
)

const (
	connectTimeout = 5
	connectStringTemplate = "mongodb://%s:%s@%s"
)

func getConnection() (*mongo.Client, context.Context, context.CancelFunc) {
	username := "admin"//os.Getenv("MONGODB_USERNAME")
	passwords := "ifuncun888"//os.Getenv("MONGODB_PASSWORD")
	clusterEndpoint := "inner.test.ifuncun.cn"//os.Getenv("MONGODB_ENDPOINT")

	connectionURI := fmt.Sprintf(connectStringTemplate, username, passwords, clusterEndpoint)

	client, err := mongo.NewClient(options.Client().ApplyURI(connectionURI))

	if err != nil {
		log.Printf("Fail to create client: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), connectTimeout * time.Second)

	err = client.Connect(ctx)

	if err != nil {
		log.Printf("Failed to connect to cluster: %v", err)
	}

	err = client.Ping(ctx, nil)

	if err != nil {
		log.Printf("Failed to ping cluster: %v", err)
	}

	fmt.Println("Connected to MongoDB!")

	return client ,ctx, cancel
}

func Create(task *Task) (primitive.ObjectID, error) {
	client, ctx, cancel := getConnection()
	defer cancel()
	defer client.Disconnect(ctx)

	task.ID = primitive.NewObjectID()

	result, err := client.Database("funcun").Collection("tasks").InsertOne(ctx, task)

	if err != nil {
		log.Printf("Cloud not create Task: %v", err)
		return primitive.NilObjectID, err
	}

	oid := result.InsertedID.(primitive.ObjectID)

	return oid, nil
}
```