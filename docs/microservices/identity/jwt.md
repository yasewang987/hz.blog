# Jwt

## 简介

Json web token (JWT), 是为了在网络应用环境间传递声明而执行的一种基于JSON的开放标准 ([RFC 7519](https://tools.ietf.org/html/rfc7519)).该token被设计为紧凑且安全的，特别适用于分布式站点的单点登录（SSO）场景。JWT的声明一般被用来在身份提供者和服务提供者间传递被认证的用户身份信息，以便于从资源服务器获取资源，也可以增加一些额外的其它业务逻辑所必须的声明信息，该token也可直接被用于认证，也可被加密

## 使用场景

* Authorization (授权) : 这是使用JWT的最常见场景。一旦用户登录，后续每个请求都将包含JWT，允许用户访问该令牌允许的路由、服务和资源。单点登录是现在广泛使用的JWT的一个特性，因为它的开销很小，并且可以轻松地跨域使用。
* Information Exchange (信息交换) : 对于安全的在各方之间传输信息而言，JSON Web Tokens无疑是一种很好的方式。因为JWT可以被签名，例如，用公钥/私钥对，你可以确定发送人就是它们所说的那个人。另外，由于签名是使用头和有效负载计算的，您还可以验证内容没有被篡改。

### 优点

* 因为json的通用性，所以JWT是可以进行跨语言支持的，像C#,JAVA,JavaScript,NodeJS,PHP等很多语言都可以使用。
* 因为有了payload部分，所以JWT可以在自身存储一些其他业务逻辑所必要的非敏感信息。
* 便于传输，jwt的构成非常简单，字节占用很小，所以它是非常便于传输的。
* 它不需要在服务端保存会话信息（取决于使用者是否要保存）, 所以它易于应用的扩展（很适合分布式应用）。

### 缺点

* 由于服务端不存储session信息，导致在有效期内无法废除token。
* 不适合保存太多claim信息。

### 注意事项

* 不应该在jwt的payload部分存放敏感信息，因为该部分是客户端可解密的部分。
* 保护好secret私钥，该私钥非常重要（如果丢失，其他人可以随意自行制造token）。
* 如果可以，请使用https协议。

## 原理介绍

一般分为3部分：Header，PlayLoad，Signature，一个典型的Jwt形式如下：

```
xxxxxxxx.yyyyyyyy.zzzzzzzz
```

### Header

Jwt Header 头信息一般格式如下：

```bash
{
  # 声明类型
  'typ': 'JWT',
  # 加密算法，一般为HMAC SHA256
  'alg': 'HS256'
}
```
* 上面的加密算法也可以是其他的算法，这个取决于使用者。

1. 首先将上面的 `Header` 对象通过 `UTF-8` 转换成字节数组。
1. 然后将上面的信息通过 `Base64Url` 编码成字符串,作为jwt第一部分内容（xxxxxxxx）。

### PlayLoad

JWT PlayLoad 信息一般格式如下：

```bash
{
    "iss":"joe",
    "exp":1300819380,
    "id":123,
    "name": hz
}
```
* 上面信息包含了一部分jwt标准中预设的信息（iss，exp），以及一些自定义信息（id，name）。

1. 首先将上面的 `PlayLoad` 对象通过 `UTF-8` 转换成字节数组。
1. 然后将上面的信息通过 `Base64Url` 编码成字符串,作为jwt第二部分内容（yyyyyyyy）。

标准中注册的声明 (建议但不强制使用) ：

* iss: jwt签发者
* sub: jwt所面向的用户
* aud: 接收jwt的一方
* exp: jwt的过期时间，这个过期时间必须要大于签发时间
* nbf: 定义在什么时间之前，该jwt都是不可用的
* iat: jwt的签发时间
* jti: jwt的唯一身份标识，主要用来作为一次性token,从而回避重放攻击

### Signature

这一部分属于签证加密的信息，前面2部分的信息都可以通过Base64直接解密出来，那要如何防止其他人伪造jwt呢？

通过这一部分讲解你就可以了解了。

签证部分信息由3部分组成：

1. Base64Url加密后的Header。
1. Base64Url加密后的PlayLoad。
1. Secret（自定义的密钥，这部分信息不能泄露）。

生成签证算法的步骤：

1. 将加密后的Header，PlayLoad通过 `.` 组合到一起。
1. 将上面的 `PlayLoad` 对象通过 `UTF-8` 转换成字节数组。
1. 声明私钥（secret）
1. 使用Header头中声明的算法，并且使用私钥作为key，第一步中组合好的内容作为value去生成字节数组。
1. 然后将上面的信息通过 `Base64Url` 编码成字符串,作为jwt第三部分内容（zzzzzzzz）。

## 客户端使用

一般是在请求头里加入Authorization，并加上Bearer标注：
```bash
POST http://localhost:5000/test/1 HTTP/1.1
Content-Type: application/json
Authorization: Bearer xxxxxxxx.yyyyyyyy.zzzzzzzz

{
  "aaa": "bbb",
  "code": "519bb3ffd7734feb9daa69454846ed4e",
}
```

## Jwt实现代码

* C#

```csharp
/// <summary>
/// 自定义生成jwttoken
/// </summary>
/// <param name="id"></param>
/// <param name="username"></param>
/// <returns></returns>
public string GenerateJwtToken(string id, string username)
{
    // header
    var jwtHeader = new {
    typ = "JWT",
    alg = "HS256"
    };
    var jwtHeaderBytes = System.Text.Json.JsonSerializer.SerializeToUtf8Bytes(jwtHeader);
    var jwtHeaderBase64 = Base64UrlEncode(jwtHeaderBytes);
    
    // payload
    
    // 使用微软定义的Claim，可以直接配合微软的中间件直接使用
    // var jwtPayload = new List<Claim> {
    //   new Claim("id", id),
    //   new Claim("username", username)
    // };

    // 可以使用自定义的模型，但是在客户端使用时就需要重写中间件
    var jwtPayload = new {
        id = id,
        username = username
    };

    var jwtPayloadBytes = System.Text.Json.JsonSerializer.SerializeToUtf8Bytes(jwtPayload);
    var jwtPayloadBase64 = Base64UrlEncode(jwtPayloadBytes);

    // signature
    var security = "abc!@#123";

    var alg = new HMACSHA256(Encoding.UTF8.GetBytes(security));
    var bytesToSign = Encoding.UTF8.GetBytes($"{jwtHeaderBase64}.{jwtPayloadBase64}");
    var hash = alg.ComputeHash(bytesToSign);
    var jwtSignBase64 = Base64UrlEncode(hash);

    // token
    return $"{jwtHeaderBase64}.{jwtPayloadBase64}.{jwtSignBase64}";
}

private string Base64UrlEncode(byte[] input)
{
    var output = Convert.ToBase64String(input);
    output = output.Split('=')[0].Replace('+','-').Replace('/','_');
    return output;
}
```