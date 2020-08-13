# OAuth2 - 介绍

## 概要

OAuth2.0 实际上就是让第三方服务获得用户在资源服务器上的授权的过程


## 角色

* 资源拥有者（Resource owner），即用户
* 认证服务器（Authorization server），用来认证用户凭证，颁布授权码的服务器
* 资源服务器（Resource Server），存放用户受保护的资源的服务器（一般与认证服务器属于同一个服务商）
* 第三方应用（Client），也称之为客户端(后续皆称 客户端)，需要得到用户授权，以便访问用户受保护的资源的应用程序
  > 客户端需要在认证服务器中注册过，获取到 `client_id`,`client_secret`，用来向认证服务器表明客户端身份。

## 基本的认证授权协议流程

```
+--------+                               +---------------+
|        |--(A)- Authorization Request ->|   Resource    |
|        |                               |     Owner     |
|        |<-(B)-- Authorization Grant ---|               |
|        |                               +---------------+
|        |
|        |                               +---------------+
|        |--(C)-- Authorization Grant -->| Authorization |
| Client |                               |     Server    |
|        |<-(D)----- Access Token -------|               |
|        |                               +---------------+
|        |
|        |                               +---------------+
|        |--(E)----- Access Token ------>|    Resource   |
|        |                               |     Server    |
|        |<-(F)--- Protected Resource ---|               |
+--------+                               +---------------+
```

* A: 客户端向资源所有者索要授权，授权请求可以跳转到授权服务器的授权页
* B：用户 允许/拒绝 客户端的授权请求，假设允许
* C：客户端使用上一步中取到的授权码请求授权服务器授权
* D：授权服务器确认授权码合法，返回 `access_token`
* E：客户端使用 `access_token` 请求资源服务器上的资源
* F：资源服务器验证 `access_token`, 返回相关受保护的资源

## 常用授权认证模式

* 授权码模式 （authorization code）
* 隐式授权 （implicit）
* 密码模式 （resource owner password credentials）
* 客户端模式 （client credentials）

后面文章中有具体介绍，以及部分核心代码实现