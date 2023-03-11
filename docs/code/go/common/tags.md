# Go-Tags

struct tags 使用还是很广泛的，特别是在 json 序列化，或者是数据库 ORM 映射方面。

## 使用反引号

在声明 `struct tag` 时，使用反引号包围 tag 的值，可以防止转义字符的影响，使 tag 更容易读取和理解。

```go
type User struct {
    ID    int    `json:"id" db:"id"`
    Name  string `json:"name" db:"name"`
    Email string `json:"email" db:"email"`
}
```

## 避免使用空格

在 struct tag 中，应该避免使用空格，特别是在 tag 名称和 tag 值之间。使用空格可能会导致编码或解码错误，并使代码更难以维护。

```go
// 不规范的写法
type User struct {
    ID    int    `json: "id" db: "id"`
    Name  string `json: "name" db: "name"`
    Email string `json: "email" db: "email"`
}

// 规范的写法
type User struct {
    ID    int    `json:"id" db:"id"`
    Name  string `json:"name" db:"name"`
    Email string `json:"email" db:"email"`
}
```

## 避免重复

在 struct 中，应该避免重复使用同一个 tag 名称。如果重复使用同一个 tag 名称，编译器可能会无法识别 tag，从而导致编码或解码错误。

```go
// 不规范的写法
type User struct {
    ID    int    `json:"id" db:"id"`
    Name  string `json:"name" db:"name"`
    Email string `json:"email" db:"name"`
}

// 规范的写法
type User struct {
    ID    int    `json:"id" db:"id"`
    Name  string `json:"name" db:"name"`
    Email string `json:"email" db:"email"`
}
```

## 使用标准化的 tag 名称

为了使 struct tag 更加标准化和易于维护，应该使用一些标准化的 tag 名称。其中，`Password` 字段后面的 `-` 表示忽略该字段，也就是说该字段不会被序列化或反序列化。

```go
type User struct {
    ID       int    `json:"id" db:"id"`
    Name     string `json:"name" db:"name"`
    Password string `json:"-" db:"password"` // 忽略该字段
    Email    string `json:"email" db:"email"`
}
```

## 多个 tag 值

如果一个字段需要指定多个 tag 值，可以使用 `,` 将多个 tag 值分隔开。其中 omitempty 表示如果该字段值为空，则不序列化该字段。

```go
type User struct {
    ID        int    `json:"id" db:"id"`
    Name      string `json:"name" db:"name"`
    Email     string `json:"email,omitempty" db:"email,omitempty"`
}
```

## struct tags 的原理

Go的反射库提供了一些方法，可以让我们在程序运行时获取和解析结构体标签。先来看看 `reflect.StructField` ，它是描述结构体字段的数据类型。定义如下：

```go
type StructField struct {
    Name      string      // 字段名
    Type      Type        // 字段类型
    Tag       StructTag   // 字段标签
}
```

在结构体的反射中，我们经常使用 `reflect.TypeOf` 获取类型信息，然后使用 `Type.Field` 或 `Type.FieldByName()` 获取结构体字段的 `reflect.StructField`，然后根据 `StructField` 中的信息做进一步处理。

```go
package main

import (
    "fmt"
    "reflect"
)

type User struct {
    Name string `json:"name"`
    Age  int    `json:"age"`
}

type Manager struct {
    Title string `json:"title"`
    User
}

func main() {
    m := Manager{Title: "Manager", User: User{Name: "Alice", Age: 25}}

    mt := reflect.TypeOf(m)

    // 获取 User 字段的 reflect.StructField
    userField, _ := mt.FieldByName("User")
    fmt.Println("Field 'User' exists:", userField.Name, userField.Type)

    // 获取 User.Name 字段的 reflect.StructField
    nameField, _ := userField.Type.FieldByName("Name")
    tag := nameField.Tag.Get("json")
    fmt.Println("User.Name tag:", tag)
}

////////输出
Field 'User' exists: User {string int}
User.Name tag: "name"
```


