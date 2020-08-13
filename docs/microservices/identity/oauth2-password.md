# OAuth2 - 密码模式

* 参考资料：[rfc6749](https://tools.ietf.org/html/rfc6749)
* dotnet完整代码参考：[https://github.com/yasewang987/hz.identityserver](https://github.com/yasewang987/hz.identityserver)

密码模式中，用户向客户端提供自己的用户名和密码，客户端使用这些信息，认证授权服务器索要授权。

这种模式中，用户必须把自己的密码给客户端，但是客户端不得储存密码（既然用户信任你，你就必须兑现这个承诺）。

密码模式的特性决定，需要用在用户对客户端高度信任的情况下，比如同一个公司的内部系统。

交互流程如下：

```
+----------+
| Resource |
|  Owner   |
|          |
+----------+
    v
    |    Resource Owner
    (A) Password Credentials
    |
    v
+---------+                                  +---------------+
|         |>--(B)---- Resource Owner ------->|               |
|         |         Password Credentials     | Authorization |
| Client  |                                  |     Server    |
|         |<--(C)---- Access Token ---------<|               |
|         |    (w/ Optional Refresh Token)   |               |
+---------+                                  +---------------+
```

* A：资源所有者在客户端输入账号密码
* B：客户端携带资源所有者的凭证向认证服务器获取访问令牌
* C：认证服务器核验相关信息，假如通过，则返回 `access_token`等信息

## 步骤解析

### 步骤B,C

步骤A在客户端实现，这里跳过。

请求参数：

* `grant_type`：授权类型，这里固定为 `password`
* `username`：用户账号
* `password`：用户密码
* `scope`: （可选）授权范围

> 也可以加入`client_id`到请求参数中，验证客户端的合法性

示例：

```
POST http://localhost:5000/auth/passwordtoken HTTP/1.1
Content-Type: application/json

{
  "grant_type": "password",
  "username": "admin",
  "password": "123456",
  "scope": "admin"
}
```

返回参数：

* `access_token`：访问令牌
* `token_type`：令牌类型，一般为 `bearer`
* `expires_in`：（建议）过期时间，单位秒
* `refresh_token`：（可选）更新令牌
* `scope`：（可选）权限范围

示例：

```
HTTP/1.1 200 OK
Content-Type: application/json;charset=UTF-8
Cache-Control: no-store
Pragma: no-cache

{
  "access_token":"2YotnFZFEjr1zCsicMWpAA",
  "token_type":"example",
  "expires_in":3600,
  "refresh_token":"tGzv3JOkF0XG5Qx2TlKWIA",
  "example_parameter":"example_value"
}
```

dotnet代码实现：

```csharp
/// <summary>
/// 密码式
/// </summary>
/// <param name="options"></param>
/// <returns></returns>
[HttpPost]
public IActionResult PasswordToken([FromBody]PasswordTokenOptions options)
{
    // client_id 可以没有
    // if(!_clientService.ValidateClientId(options.client_id))
    // {
    //     return Json(new { error = "invalid clientid"});
    // }
    
    if(!options.ValidateGrantType())
    {
        return Json(new { error = "error grant_type" });
    }

    var userAdmin = UserInfo.CreateAdminUser();
    if(userAdmin.CheckUser(options.username, options.password))
    {
        return Json(HandleToken(userAdmin.id.ToString()));
    }
    else
    {
        return Json(new { error = "error userinfo"});
    }
}

private TokenResult HandleToken(string userid)
{
    var token = _keyFactory.GenerateToken();
    var refreshToken = _keyFactory.GenerateToken();
    var tokenExpiresIn = 60*60*24; // 1天
    var refreshTokenExpiresIn = 60*60*24*365; // 1年

    var tokenResult = new TokenResult {
        access_token = token,
        refresh_token = refreshToken,
        expires_in = tokenExpiresIn,
        userid = userid
    };

    // 将access_token,refresh_token加入缓存
    _cache.SetString(CacheKeyProvider.TokenKey(token), userid, new DistributedCacheEntryOptions {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(tokenExpiresIn)
    });

    _cache.SetString(CacheKeyProvider.RefreshTokenKey(refreshToken), System.Text.Json.JsonSerializer.Serialize(tokenResult), new DistributedCacheEntryOptions {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(refreshTokenExpiresIn)
    });

    return tokenResult;
}
```