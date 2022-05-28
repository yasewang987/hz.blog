# ABAC权限系统

ABAC设计的目的是**为了能够满足控制请求者在某些条件下是否对请求数据具备某个操作（API） 的能力**。

目前来看，ABAC还暂时没有什么标准建模（`policy`不是由实体组成），一般都是`policy`的语法设计，这个指的就是用一个`json`或者一个`xml`来描述一个`policy` ，这个`policy`会和`用户`或者其他`实体`绑定，然后这个用户或者是实体就具备了在某些条件下对某些数据的操作能力。

```json
// 模板
{
    "effect":"Allow",
    "actions":[
        "getUser",
        "updateUser",
        "get*"
    ],
    // resource主要是各种业务条件以及业务数据的约束
    // 业务系统前端把这些在policy中的业务属性带在请求头中
    "resources":[
        "contextField:contextValue:resourceField:resourceValue"
    ],
    // condition部分完全可以由权限系统自己来闭环
    "condition":[
        {
            "operation-name":{
                "condition-key":[
                    "condition value"
                ]
            }
        }
    ]
}
// 实例
{
    "effect":"Allow",
    "actions":[
        "getOrder"       
    ],
    "resources":[
        "isMain:1:orderId:12345"  // 必须是主商家，且只能访问orderId为123456的订单
    ],
    "condition":[
        {
            "DateLessThan":{
                "CurrentTime":[
                    "2021-03-30 17:00:00"              // 必须满足时间小于2021-03-30 17:00:00
                ]
            }
        }
    ]
}
```

## 业务设计图

![abac1](http://cdn.go99.top/docs/microservices/other/abac1.awebp)