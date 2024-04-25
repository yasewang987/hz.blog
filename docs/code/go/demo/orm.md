# Go-ORM 资料记录

* [ent](https://entgo.io/docs/getting-started), `facebook`出品的orm框架。
* [gorm](https://gorm.io/)

## GORM

官方文档：https://gorm.io/zh_CN/docs/index.html

GORM 是用于Golang的出色ORM（对象关系映射）库，它以开发人员友好而闻名。它的主要目标是提供一个全功能的ORM工具，帮助开发者更加高效地处理关系型数据库。GORM是在Go语言的`database/sql`包的基础上发展起来的。下面我们详细介绍GORM的功能以及如何在Go项目中使用GORM。

### gorm关键特性

* 全功能的ORM：支持几乎所有的ORM功能，包括模型定义、基本的CRUD操作、复杂查询、关联处理等。
* 关联支持：非常灵活的关联（has one, has many, belongs to, many to many, polymorphism, single-table inheritance）功能。
* 钩子（Hooks）：支持在create/save/update/delete/find操作前后进行自定义处理。
* 预加载（Eager Loading）：使用Preload, Joins等方式预加载关联数据。
* 事务处理：支持事务、嵌套事务、保存点以及回滚到保存点。
* 上下文支持: 支持上下文管理、准备语句模式、DryRun模式。
* 批量操作: 支持批量插入、分批次查询、通过Map进行查找/创建、使用SQL Expr和Context Valuer进行CRUD。
* SQL构建器: 支持Upsert、锁定、优化器/索引/注释提示、命名参数以及子查询。
* 复合主键、索引、约束：对于复合主键、索引和约束也有很好的支持。
* 自动迁移（Auto Migrations）: 支持自动数据库迁移。
* 日志: 支持日志记录功能。
* 插件API：提供可扩展、灵活的插件API, 如数据库解析器（支持多数据库、读写分离）/ Prometheus监控。
* 测试完备：每一个功能都伴随着对应的测试用例。

### GORM的基本使用

```go
//// 数据库连接和配置
import (
    "gorm.io/gorm"
    "gorm.io/driver/mysql" // 修改为相应的数据库驱动
)

func main() {
    dsn := "username:password@protocol(address)/dbname?charset=utf8mb4&parseTime=True&loc=Local"
    db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
    if err != nil {
        panic("failed to connect database")
    }

    // 接下来可以使用 `db` 句柄进行数据库操作
}

// gorm.Model 是一个包含了 ID, CreatedAt, UpdatedAt, DeletedAt 字段的基础模型
// 用户模型
type User struct {
    gorm.Model
    Name   string
    Age    uint
    Active bool
}

//// CRUD 操作
// 创建
user := User{Name: "Jinzhu", Age: 18, Active: true}
result := db.Create(&user) // 通过数据模型创建记录
// 检查错误
if result.Error != nil {
    panic(result.Error)
}

// 查询
var user User
result := db.First(&user, 1) // 查询ID为1的用户
// 检查错误
if result.Error != nil {
    panic(result.Error)
}
fmt.Println(user.Name)

// 更新(U)
db.Model(&user).Update("Name", "Jin")

// 删除(D)
db.Delete(&user, 1) // 删除 ID 为1的用户

//// 关联处理
type User struct {
    gorm.Model
    CreditCards []CreditCard
}
type CreditCard struct {
    gorm.Model
    Number string
    UserID uint
}
var user User
// Preload 函数预加载了用户的所有信用卡记录
db.Preload("CreditCards").Find(&user)


//// 事务处理
// 开启一个事务
tx := db.Begin()

// 在事务中进行一系列操作
tx.Create(&user)
tx.Create(&creditCard)

// 如果操作成功，则提交事务
tx.Commit()

// 如果中间产生了错误，您可以回滚这个事务
tx.Rollback()

//// 钩子（Hooks）
func (u *User) BeforeSave(tx *gorm.DB) (err error) {
  fmt.Println("Before save")
  return
}
func (u *User) AfterCreate(tx *gorm.DB) (err error) {
  fmt.Println("After create")
  return
}

//// SQL构建器和日志记录
db.Where("name = ?", "jinzhu").First(&user)
```